const express = require('express');
const {
    createPaymentLink,
    getPayment,
    handlePaymentCallback,
    checkPaymentStatus,
    getUserPayments
} = require('../controllers/paymentController');

const router = express.Router();
const { protect } = require('../middleware/auth');

// Public route for Paytm callback
router.route('/callback')
    .post(handlePaymentCallback);

// Protected routes
router.use(protect);

router.route('/')
    .get(getUserPayments);

router.route('/create-link')
    .post(createPaymentLink);

router.route('/:id')
    .get(getPayment);

router.route('/:id/status')
    .get(checkPaymentStatus);

module.exports = router;
