const express = require('express');
const router = express.Router();
const {
    getComments,
    addComment,
    deleteComment,
    likeComment,
    replyToComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// @route   GET /api/comments/:productId
// @desc    Get all comments for a product
// @access  Public
router.get('/:productId', getComments);

// @route   POST /api/comments/:productId
// @desc    Add a comment to a product
// @access  Private
router.post('/:productId', protect, addComment);

// @route   DELETE /api/comments/:commentId
// @desc    Delete a comment
// @access  Private (only comment owner or admin)
router.delete('/:commentId', protect, deleteComment);

// @route   PUT /api/comments/:commentId/like
// @desc    Like/Unlike a comment
// @access  Private
router.put('/:commentId/like', protect, likeComment);

// @route   POST /api/comments/:commentId/reply
// @desc    Reply to a comment
// @access  Private
router.post('/:commentId/reply', protect, replyToComment);

module.exports = router;
