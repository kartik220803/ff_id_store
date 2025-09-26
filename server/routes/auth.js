const express = require('express');
const {
    register,
    login,
    socialLogin,
    getMe,
    sendEmailVerificationOTP,
    verifyEmail,
    forgotPassword,
    verifyResetOTP,
    resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.get('/me', protect, getMe);
router.post('/send-verification-otp', sendEmailVerificationOTP);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
