const Offer = require('../models/Offer');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create new offer
// @route   POST /api/offers
// @access  Private
exports.createOffer = asyncHandler(async (req, res, next) => {
    const { productId, amount, message } = req.body;

    // Check if product exists and is not sold
    const product = await Product.findById(productId).populate('user', 'name email');

    if (!product) {
        return next(new ErrorResponse('Product not found', 404));
    }

    if (product.sold) {
        return next(new ErrorResponse('This account has already been sold', 400));
    }

    // Check if user is trying to make offer on their own product
    if (product.user._id.toString() === req.user.id) {
        return next(new ErrorResponse('You cannot make an offer on your own listing', 400));
    }

    // Check if user already has a pending offer for this product
    const existingOffer = await Offer.findOne({
        product: productId,
        buyer: req.user.id,
        status: 'pending'
    });

    if (existingOffer) {
        return next(new ErrorResponse('You already have a pending offer for this account', 400));
    }

    // Validate offer amount
    if (amount <= 0) {
        return next(new ErrorResponse('Offer amount must be greater than 0', 400));
    }

    if (amount >= product.price) {
        return next(new ErrorResponse('Offer amount should be less than the listing price. Consider purchasing directly instead.', 400));
    }

    // Create offer
    const offer = await Offer.create({
        product: productId,
        buyer: req.user.id,
        seller: product.user._id,
        amount,
        message: message || ''
    });

    // Create notification for seller
    await Notification.create({
        user: product.user._id,
        type: 'offer_received',
        title: 'New Offer Received',
        message: `You received an offer of ₹${amount.toLocaleString()} for your ${product.title}`,
        relatedProduct: productId,
        relatedOffer: offer._id,
        actionUrl: `/dashboard?tab=notifications`
    });

    // Populate the offer before sending response
    await offer.populate([
        { path: 'product', select: 'title price images' },
        { path: 'buyer', select: 'name email' },
        { path: 'seller', select: 'name email' }
    ]);

    res.status(201).json({
        success: true,
        data: offer
    });
});

// @desc    Get offers (buyer's sent offers or seller's received offers)
// @route   GET /api/offers
// @access  Private
exports.getOffers = asyncHandler(async (req, res, next) => {
    const { type } = req.query; // 'sent' or 'received'

    let query = {};

    if (type === 'sent') {
        query.buyer = req.user.id;
    } else if (type === 'received') {
        query.seller = req.user.id;
    } else {
        // Get both sent and received offers
        query = {
            $or: [
                { buyer: req.user.id },
                { seller: req.user.id }
            ]
        };
    }

    const offers = await Offer.find(query)
        .populate('product', 'title price images sold')
        .populate('buyer', 'name email')
        .populate('seller', 'name email')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: offers.length,
        data: offers
    });
});

// @desc    Respond to offer (accept/reject)
// @route   PUT /api/offers/:id/respond
// @access  Private
exports.respondToOffer = asyncHandler(async (req, res, next) => {
    const { status, responseMessage } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
        return next(new ErrorResponse('Invalid response status', 400));
    }

    const offer = await Offer.findById(req.params.id)
        .populate('product')
        .populate('buyer', 'name email')
        .populate('seller', 'name email');

    if (!offer) {
        return next(new ErrorResponse('Offer not found', 404));
    }

    // Check if user is the seller
    if (offer.seller._id.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to respond to this offer', 403));
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
        return next(new ErrorResponse('This offer has already been responded to', 400));
    }

    // Check if product is still available
    if (offer.product.sold) {
        return next(new ErrorResponse('This account has already been sold', 400));
    }

    // Update offer
    offer.status = status;
    offer.responseMessage = responseMessage || '';
    offer.respondedAt = new Date();
    await offer.save();

    if (status === 'accepted') {
        // Create order
        const order = await Order.create({
            product: offer.product._id,
            buyer: offer.buyer._id,
            seller: offer.seller._id,
            amount: offer.amount,
            type: 'accepted_offer',
            relatedOffer: offer._id
        });

        // Mark product as sold
        offer.product.sold = true;
        await offer.product.save();

        // Create notifications
        await Notification.create({
            user: offer.buyer._id,
            type: 'offer_accepted',
            title: 'Offer Accepted!',
            message: `Your offer of ₹${offer.amount.toLocaleString()} for ${offer.product.title} has been accepted!`,
            relatedProduct: offer.product._id,
            relatedOffer: offer._id,
            relatedOrder: order._id,
            actionUrl: `/orders/${order._id}`
        });

        await Notification.create({
            user: offer.seller._id,
            type: 'account_sold',
            title: 'Account Sold!',
            message: `Your ${offer.product.title} has been sold for ₹${offer.amount.toLocaleString()}`,
            relatedProduct: offer.product._id,
            relatedOrder: order._id,
            actionUrl: `/orders/${order._id}`
        });
    } else {
        // Create notification for rejected offer
        await Notification.create({
            user: offer.buyer._id,
            type: 'offer_rejected',
            title: 'Offer Rejected',
            message: `Your offer of ₹${offer.amount.toLocaleString()} for ${offer.product.title} has been rejected.`,
            relatedProduct: offer.product._id,
            relatedOffer: offer._id,
            actionUrl: `/products/${offer.product._id}`
        });
    }

    res.status(200).json({
        success: true,
        data: offer
    });
});

// @desc    Cancel offer
// @route   DELETE /api/offers/:id
// @access  Private
exports.cancelOffer = asyncHandler(async (req, res, next) => {
    const offer = await Offer.findById(req.params.id).populate('product');

    if (!offer) {
        return next(new ErrorResponse('Offer not found', 404));
    }

    // Check if user is the buyer
    if (offer.buyer.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to cancel this offer', 403));
    }

    // Check if offer is still pending
    if (offer.status !== 'pending') {
        return next(new ErrorResponse('Cannot cancel an offer that has already been responded to', 400));
    }

    offer.status = 'cancelled';
    await offer.save();

    res.status(200).json({
        success: true,
        data: {}
    });
});
