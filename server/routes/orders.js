const express = require('express');
const {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    markPaymentReceived
} = require('../controllers/orderController');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
    .post(createOrder)
    .get(getOrders);

router.route('/:id')
    .get(getOrder);

router.route('/:id/status')
    .put(updateOrderStatus);

router.route('/:id/payment-received')
    .put(markPaymentReceived);

module.exports = router;
