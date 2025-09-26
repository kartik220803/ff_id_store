const express = require('express');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
  likeProduct,
  viewProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Base route /api/products
router.route('/')
  .get(getProducts)
  .post(protect, createProduct);

// Get current user's products
router.get('/user', protect, getUserProducts);

router.route('/:id')
  .get(optionalAuth, getProduct)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

// Get products by specific user ID
router.get('/user/:userId', getUserProducts);

// Social interaction routes
router.put('/:id/like', protect, likeProduct);
router.post('/:id/view', optionalAuth, viewProduct);

module.exports = router;
