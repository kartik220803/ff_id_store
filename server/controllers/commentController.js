const Comment = require('../models/Comment');
const Product = require('../models/Product');

// @desc    Get all comments for a product
// @route   GET /api/comments/:productId
// @access  Public
const getComments = async (req, res) => {
    try {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const comments = await Comment.find({ product: productId })
            .populate('user', 'name avatar')
            .populate('replies.user', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Comment.countDocuments({ product: productId });

        res.json({
            success: true,
            data: comments,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: comments.length,
                totalComments: total,
            },
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch comments',
        });
    }
};

// @desc    Add a comment to a product
// @route   POST /api/comments/:productId
// @access  Private
const addComment = async (req, res) => {
    try {
        const { productId } = req.params;
        const { comment } = req.body;

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Comment cannot be empty',
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        const newComment = await Comment.create({
            product: productId,
            user: req.user.id,
            comment: comment.trim(),
        });

        // Update product comments count
        await Product.findByIdAndUpdate(productId, {
            $inc: { commentsCount: 1 },
        });

        // Populate user data
        await newComment.populate('user', 'name avatar');

        res.status(201).json({
            success: true,
            data: newComment,
            message: 'Comment added successfully',
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add comment',
        });
    }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
// @access  Private (only comment owner)
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found',
            });
        }

        // Check if user owns the comment
        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this comment',
            });
        }

        await Comment.findByIdAndDelete(commentId);

        // Update product comments count
        await Product.findByIdAndUpdate(comment.product, {
            $inc: { commentsCount: -1 },
        });

        res.json({
            success: true,
            message: 'Comment deleted successfully',
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete comment',
        });
    }
};

// @desc    Like/Unlike a comment
// @route   PUT /api/comments/:commentId/like
// @access  Private
const likeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found',
            });
        }

        const existingLike = comment.likes.find(
            (like) => like.user.toString() === userId
        );

        if (existingLike) {
            // Unlike the comment
            comment.likes = comment.likes.filter(
                (like) => like.user.toString() !== userId
            );
        } else {
            // Like the comment
            comment.likes.push({ user: userId });
        }

        await comment.save();

        res.json({
            success: true,
            data: comment,
            message: existingLike ? 'Comment unliked' : 'Comment liked',
        });
    } catch (error) {
        console.error('Like comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to like/unlike comment',
        });
    }
};

// @desc    Reply to a comment
// @route   POST /api/comments/:commentId/reply
// @access  Private
const replyToComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { comment: replyText } = req.body;

        if (!replyText || replyText.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Reply cannot be empty',
            });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found',
            });
        }

        comment.replies.push({
            user: req.user.id,
            comment: replyText.trim(),
        });

        await comment.save();
        await comment.populate('replies.user', 'name avatar');

        res.status(201).json({
            success: true,
            data: comment,
            message: 'Reply added successfully',
        });
    } catch (error) {
        console.error('Reply to comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add reply',
        });
    }
};

module.exports = {
    getComments,
    addComment,
    deleteComment,
    likeComment,
    replyToComment,
};
