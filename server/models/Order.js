const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
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
        required: [true, 'Please add the purchase amount'],
        min: [1, 'Purchase amount must be at least ₹1'],
    },
    type: {
        type: String,
        enum: ['direct_purchase', 'accepted_offer'],
        default: 'direct_purchase',
    },
    relatedOffer: {
        type: mongoose.Schema.ObjectId,
        ref: 'Offer',
        // Only required if type is 'accepted_offer'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'disputed'],
        default: 'pending',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending',
    },
    accountDetails: {
        // This will store the actual account login details once payment is confirmed
        gameId: String,
        email: String,
        password: String,
        additionalInfo: String,
    },
    accountDelivered: {
        type: Boolean,
        default: false,
    },
    accountDeliveredAt: Date,
    buyerNotes: String,
    sellerNotes: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    completedAt: Date,
});

module.exports = mongoose.model('Order', OrderSchema);
