const Product = require('../models/Product');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Offer = require('../models/Offer');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

// User Management
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { search, role, isVerified, sort } = req.query;

        // Build filter object
        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) filter.role = role;
        if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

        // Build sort object
        let sortObj = { createdAt: -1 };
        if (sort) {
            const [field, order] = sort.split(':');
            sortObj = { [field]: order === 'desc' ? -1 : 1 };
        }

        const users = await User.find(filter)
            .select('+role +isVerified +lastLogin +createdAt')
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .populate('avatar');

        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
};

const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .select('+role +isVerified +lastLogin +createdAt')
            .populate('avatar');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user statistics
        const stats = await Promise.all([
            Product.countDocuments({ seller: userId }),
            Comment.countDocuments({ user: userId }),
            Offer.countDocuments({ buyer: userId }),
            Order.countDocuments({ buyer: userId }),
            Order.countDocuments({ seller: userId })
        ]);

        const userStats = {
            productsListed: stats[0],
            commentsPosted: stats[1],
            offersMade: stats[2],
            ordersBought: stats[3],
            ordersSold: stats[4]
        };

        res.json({
            success: true,
            data: {
                user,
                stats: userStats
            }
        });
    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user details'
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deleting themselves
        if (userId === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Delete user's products
        await Product.deleteMany({ seller: userId });

        // Delete user's comments
        await Comment.deleteMany({ user: userId });

        // Delete user's offers
        await Offer.deleteMany({ buyer: userId });

        // Delete user's orders (both as buyer and seller)
        await Order.deleteMany({ $or: [{ buyer: userId }, { seller: userId }] });

        // Delete user's notifications
        await Notification.deleteMany({ user: userId });

        // Delete the user
        await User.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: 'User and all associated data deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
};

// Product Management
const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { search, status, seller, sort } = req.query;

        // Build filter object
        const filter = {};
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { uid: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) filter.sold = status === 'sold';
        if (seller) filter.seller = seller;

        // Build sort object
        let sortObj = { createdAt: -1 };
        if (sort) {
            const [field, order] = sort.split(':');
            sortObj = { [field]: order === 'desc' ? -1 : 1 };
        }

        const products = await Product.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .populate('seller', 'name email username avatar')
            .populate('images');

        const total = await Product.countDocuments(filter);

        res.json({
            success: true,
            data: products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updateData = req.body;

        const product = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true, runValidators: true }
        ).populate('seller', 'name email username avatar');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product'
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete associated comments
        await Comment.deleteMany({ product: productId });

        // Delete associated offers
        await Offer.deleteMany({ product: productId });

        // Delete the product
        await Product.findByIdAndDelete(productId);

        res.json({
            success: true,
            message: 'Product and associated data deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product'
        });
    }
};

const updateProductLikes = async (req, res) => {
    try {
        const { productId } = req.params;
        const { likesCount } = req.body;

        if (typeof likesCount !== 'number' || likesCount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Likes count must be a non-negative number'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Update social stats
        product.socialStats = product.socialStats || {};
        product.socialStats.likesCount = likesCount;
        await product.save();

        res.json({
            success: true,
            message: 'Product likes updated successfully',
            data: product
        });
    } catch (error) {
        console.error('Update product likes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product likes'
        });
    }
};

// Comment Management
const getAllComments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { search, productId, userId, sort } = req.query;

        // Build filter object
        const filter = {};
        if (search) {
            filter.content = { $regex: search, $options: 'i' };
        }
        if (productId) filter.product = productId;
        if (userId) filter.user = userId;

        // Build sort object
        let sortObj = { createdAt: -1 };
        if (sort) {
            const [field, order] = sort.split(':');
            sortObj = { [field]: order === 'desc' ? -1 : 1 };
        }

        const comments = await Comment.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .populate('user', 'name email username avatar')
            .populate('product', 'title uid')
            .populate('replies.user', 'name username avatar');

        const total = await Comment.countDocuments(filter);

        res.json({
            success: true,
            data: comments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch comments'
        });
    }
};

const createComment = async (req, res) => {
    try {
        const { productId, content, userId } = req.body;

        if (!productId || !content || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID, content, and user ID are required'
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const comment = new Comment({
            product: productId,
            user: userId,
            content,
            isAdminComment: true
        });

        await comment.save();
        await comment.populate([
            { path: 'user', select: 'name username avatar' },
            { path: 'product', select: 'title' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Admin comment created successfully',
            data: comment
        });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create comment'
        });
    }
};

const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }

        const comment = await Comment.findByIdAndUpdate(
            commentId,
            { content, isEdited: true },
            { new: true }
        ).populate([
            { path: 'user', select: 'name username avatar' },
            { path: 'product', select: 'title' }
        ]);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        res.json({
            success: true,
            message: 'Comment updated successfully',
            data: comment
        });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update comment'
        });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findByIdAndDelete(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete comment'
        });
    }
};

// Offer Management
const getProductOffers = async (req, res) => {
    try {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { status, sort } = req.query;

        // Build filter object
        const filter = { product: productId };
        if (status) filter.status = status;

        // Build sort object
        let sortObj = { createdAt: -1 };
        if (sort) {
            const [field, order] = sort.split(':');
            sortObj = { [field]: order === 'desc' ? -1 : 1 };
        }

        const offers = await Offer.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .populate('buyer', 'name email username avatar')
            .populate('product', 'title price uid seller')
            .populate('product.seller', 'name username');

        const total = await Offer.countDocuments(filter);

        res.json({
            success: true,
            data: offers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get product offers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product offers'
        });
    }
};

const getAllOffers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { status, buyerId, sellerId, productId, sort } = req.query;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (buyerId) filter.buyer = buyerId;
        if (productId) filter.product = productId;

        // Build sort object
        let sortObj = { createdAt: -1 };
        if (sort) {
            const [field, order] = sort.split(':');
            sortObj = { [field]: order === 'desc' ? -1 : 1 };
        }

        const offers = await Offer.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .populate('buyer', 'name email username avatar')
            .populate('product', 'title price uid seller')
            .populate('product.seller', 'name username');

        const total = await Offer.countDocuments(filter);

        res.json({
            success: true,
            data: offers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all offers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch offers'
        });
    }
};

// Transaction Management
const getAllTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { status, buyerId, sellerId, productId, sort } = req.query;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (buyerId) filter.buyer = buyerId;
        if (sellerId) filter.seller = sellerId;
        if (productId) filter.product = productId;

        // Build sort object
        let sortObj = { createdAt: -1 };
        if (sort) {
            const [field, order] = sort.split(':');
            sortObj = { [field]: order === 'desc' ? -1 : 1 };
        }

        const orders = await Order.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .populate('buyer', 'name email username avatar')
            .populate('seller', 'name email username avatar')
            .populate('product', 'title price uid')
            .populate('payment');

        const total = await Order.countDocuments(filter);

        // Get payment statistics
        const paymentStats = await Payment.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        res.json({
            success: true,
            data: orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            stats: {
                payments: paymentStats
            }
        });
    } catch (error) {
        console.error('Get all transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions'
        });
    }
};

// Dashboard Stats
const getDashboardStats = async (req, res) => {
    try {
        const stats = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Product.countDocuments({ sold: true }),
            Order.countDocuments(),
            Offer.countDocuments(),
            Comment.countDocuments(),
            Payment.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$amount' },
                        successfulPayments: {
                            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
                        }
                    }
                }
            ])
        ]);

        const dashboardStats = {
            totalUsers: stats[0],
            totalProducts: stats[1],
            soldProducts: stats[2],
            totalOrders: stats[3],
            totalOffers: stats[4],
            totalComments: stats[5],
            revenue: stats[6][0] || { totalRevenue: 0, successfulPayments: 0 }
        };

        // Get recent activity
        const recentActivity = await Promise.all([
            User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
            Product.find().sort({ createdAt: -1 }).limit(5).populate('seller', 'name').select('title seller createdAt'),
            Order.find().sort({ createdAt: -1 }).limit(5).populate('buyer seller', 'name').select('buyer seller totalAmount createdAt')
        ]);

        res.json({
            success: true,
            data: {
                stats: dashboardStats,
                recentUsers: recentActivity[0],
                recentProducts: recentActivity[1],
                recentOrders: recentActivity[2]
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics'
        });
    }
};

module.exports = {
    // User Management
    getAllUsers,
    getUserDetails,
    deleteUser,

    // Product Management
    getAllProducts,
    updateProduct,
    deleteProduct,
    updateProductLikes,

    // Comment Management
    getAllComments,
    createComment,
    updateComment,
    deleteComment,

    // Offer Management
    getProductOffers,
    getAllOffers,

    // Transaction Management
    getAllTransactions,

    // Dashboard
    getDashboardStats
};
