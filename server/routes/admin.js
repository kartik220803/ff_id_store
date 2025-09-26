const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/admin');
const {
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
} = require('../controllers/adminController');

// Apply admin auth middleware to all routes
router.use(adminAuth);

// Dashboard Routes
router.get('/dashboard/stats', getDashboardStats);

// User Management Routes
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.delete('/users/:userId', deleteUser);

// Product Management Routes
router.get('/products', getAllProducts);
router.put('/products/:productId', updateProduct);
router.delete('/products/:productId', deleteProduct);
router.patch('/products/:productId/likes', updateProductLikes);

// Comment Management Routes
router.get('/comments', getAllComments);
router.post('/comments', createComment);
router.put('/comments/:commentId', updateComment);
router.delete('/comments/:commentId', deleteComment);

// Offer Management Routes
router.get('/offers', getAllOffers);
router.get('/products/:productId/offers', getProductOffers);

// Transaction Management Routes
router.get('/transactions', getAllTransactions);

module.exports = router;
