const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true,
    },
    buyer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    seller: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: [true, 'Please add an offer amount'],
        min: [1, 'Offer amount must be at least ₹1'],
    },
    message: {
        type: String,
        maxlength: [500, 'Message cannot be more than 500 characters'],
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending',
    },
    responseMessage: {
        type: String,
        maxlength: [500, 'Response message cannot be more than 500 characters'],
    },
    expiresAt: {
        type: Date,
        default: function () {
            // Offers expire after 7 days
            return Date.now() + 7 * 24 * 60 * 60 * 1000;
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    respondedAt: Date,
});

// Index to automatically remove expired offers
OfferSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Prevent multiple offers from the same buyer for the same product
OfferSchema.index({ product: 1, buyer: 1 }, { unique: true });

module.exports = mongoose.model('Offer', OfferSchema);
