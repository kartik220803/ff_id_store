const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Order',
        required: true,
    },
    transactionId: {
        type: String,
        unique: true,
        required: true,
    },
    payerUserId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    payeeUserId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: [1, 'Amount must be at least ₹1'],
    },
    currency: {
        type: String,
        default: 'INR',
    },
    paymentMethod: {
        type: String,
        enum: ['paytm', 'card', 'netbanking', 'upi', 'wallet'],
        default: 'paytm',
    },
    status: {
        type: String,
        enum: ['pending', 'initiated', 'completed', 'failed', 'cancelled', 'refunded'],
        default: 'pending',
    },
    paytmOrderId: {
        type: String,
        unique: true,
        sparse: true, // Allow null values but ensure uniqueness when present
    },
    paytmTransactionToken: {
        type: String,
    },
    paytmPaymentLink: {
        type: String,
    },
    paytmTransactionId: {
        type: String,
    },
    paytmBankTxnId: {
        type: String,
    },
    gatewayResponse: {
        type: mongoose.Schema.Types.Mixed, // Store full gateway response
    },
    failureReason: {
        type: String,
    },
    refundId: {
        type: String,
    },
    refundAmount: {
        type: Number,
    },
    refundReason: {
        type: String,
    },
    // Metadata
    initiatedAt: {
        type: Date,
        default: Date.now,
    },
    completedAt: {
        type: Date,
    },
    failedAt: {
        type: Date,
    },
    refundedAt: {
        type: Date,
    },
    expiresAt: {
        type: Date,
        default: function () {
            // Payment links expire after 24 hours
            return new Date(Date.now() + 24 * 60 * 60 * 1000);
        },
    },
    // Additional metadata for tracking
    userAgent: String,
    ipAddress: String,
    notes: String,
}, {
    timestamps: true,
});

// Indexes for efficient querying
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ payerUserId: 1, status: 1 });
PaymentSchema.index({ payeeUserId: 1, status: 1 });
PaymentSchema.index({ paytmOrderId: 1 });
PaymentSchema.index({ status: 1, expiresAt: 1 });

// Automatically remove expired payment records
PaymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Payment', PaymentSchema);
