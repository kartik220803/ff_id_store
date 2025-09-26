const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    let query = { user: req.user.id };

    if (unreadOnly === 'true') {
        query.isRead = false;
    }

    const notifications = await Notification.find(query)
        .populate('relatedProduct', 'title images')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
        user: req.user.id,
        isRead: false
    });

    res.status(200).json({
        success: true,
        count: notifications.length,
        total,
        unreadCount,
        data: notifications
    });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        return next(new ErrorResponse('Notification not found', 404));
    }

    // Check if notification belongs to user
    if (notification.user.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to update this notification', 403));
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
        success: true,
        data: notification
    });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
    await Notification.updateMany(
        { user: req.user.id, isRead: false },
        {
            isRead: true,
            readAt: new Date()
        }
    );

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        return next(new ErrorResponse('Notification not found', 404));
    }

    // Check if notification belongs to user
    if (notification.user.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to delete this notification', 403));
    }

    await notification.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Get notification stats
// @route   GET /api/notifications/stats
// @access  Private
exports.getNotificationStats = asyncHandler(async (req, res, next) => {
    const stats = await Notification.aggregate([
        { $match: { user: req.user._id } },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                unreadCount: {
                    $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
                }
            }
        }
    ]);

    const totalUnread = await Notification.countDocuments({
        user: req.user._id,
        isRead: false
    });

    res.status(200).json({
        success: true,
        data: {
            totalUnread,
            byType: stats
        }
    });
});
