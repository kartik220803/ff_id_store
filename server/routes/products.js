const express = require('express');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getUserProducts
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Base route /api/products
router.route('/')
  .get(getProducts)
  .post(protect, createProduct);

router.route('/:id')
  .get(getProduct)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

router.get('/user/:userId', getUserProducts);

module.exports = router;
