const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: [
            'offer_received',
            'offer_accepted',
            'offer_rejected',
            'offer_expired',
            'purchase_request',
            'purchase_accepted',
            'purchase_rejected',
            'purchase_made',
            'account_sold',
            'payment_received',
            'payment_link_created',
            'payment_completed',
            'payment_failed',
            'account_delivered',
            'general'
        ],
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Please add a notification title'],
        maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    message: {
        type: String,
        required: [true, 'Please add a notification message'],
        maxlength: [500, 'Message cannot be more than 500 characters'],
    },
    relatedProduct: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
    },
    relatedOffer: {
        type: mongoose.Schema.ObjectId,
        ref: 'Offer',
    },
    relatedOrder: {
        type: mongoose.Schema.ObjectId,
        ref: 'Order',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    actionUrl: {
        type: String,
        // URL to redirect user when they click the notification
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    readAt: Date,
});

// Index for efficient querying
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
