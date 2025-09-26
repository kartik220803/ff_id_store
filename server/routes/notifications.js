const express = require('express');
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationStats
} = require('../controllers/notificationController');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Test endpoint for debugging notifications
router.route('/test')
    .post(async (req, res) => {
        try {
            const Notification = require('../models/Notification');
            console.log('Test notification endpoint called');
            console.log('User:', req.user);

            const testNotification = await Notification.create({
                user: req.user.id,
                type: 'general',
                title: 'Test Notification',
                message: 'This is a test notification to verify the system is working.'
            });

            console.log('Test notification created:', testNotification);

            res.status(201).json({
                success: true,
                data: testNotification
            });
        } catch (error) {
            console.error('Test notification error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

router.route('/')
    .get(getNotifications);

router.route('/stats')
    .get(getNotificationStats);

router.route('/read-all')
    .put(markAllAsRead);

router.route('/:id')
    .delete(deleteNotification);

router.route('/:id/read')
    .put(markAsRead);

module.exports = router;
