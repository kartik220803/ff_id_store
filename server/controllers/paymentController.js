const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Product = require('../models/Product');
const paytmService = require('../services/paytmService');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create payment link when both parties accept deal
// @route   POST /api/payments/create-link
// @access  Private
exports.createPaymentLink = asyncHandler(async (req, res, next) => {
    const { orderId } = req.body;

    if (!orderId) {
        return next(new ErrorResponse('Order ID is required', 400));
    }

    // Get order details with populated data
    const order = await Order.findById(orderId)
        .populate('buyer', 'name email phone')
        .populate('seller', 'name email phone')
        .populate('product', 'title price images');

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    // Verify that order is accepted by seller
    if (order.status !== 'accepted') {
        return next(new ErrorResponse('Payment link can only be created for accepted orders', 400));
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({
        orderId: orderId,
        status: { $in: ['pending', 'initiated', 'completed'] }
    });

    if (existingPayment) {
        if (existingPayment.status === 'completed') {
            return next(new ErrorResponse('Payment already completed for this order', 400));
        } else if (existingPayment.status === 'initiated' && existingPayment.paytmPaymentLink) {
            // Return existing payment link if still valid
            return res.status(200).json({
                success: true,
                data: {
                    paymentId: existingPayment._id,
                    paymentLink: existingPayment.paytmPaymentLink,
                    amount: existingPayment.amount,
                    expiresAt: existingPayment.expiresAt,
                    message: 'Using existing payment link'
                }
            });
        }
    }

    try {
        // Create payment record
        const payment = await Payment.create({
            orderId: order._id,
            transactionId: `TXN_${Date.now()}_${order._id}`,
            payerUserId: order.buyer._id,
            payeeUserId: order.seller._id,
            amount: order.amount,
            status: 'pending',
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip || req.connection.remoteAddress,
            notes: `Payment for ${order.product.title}`
        });

        // Create Paytm payment order
        const paytmOrderData = {
            orderId: order._id.toString(),
            amount: order.amount,
            customerId: order.buyer._id.toString(),
            customerEmail: order.buyer.email,
            customerPhone: order.buyer.phone || '9999999999', // Default if phone not available
            productTitle: order.product.title,
            callbackUrl: `${process.env.PAYTM_CALLBACK_URL}?paymentId=${payment._id}`
        };

        const paytmResult = await paytmService.createPaymentOrder(paytmOrderData);

        if (!paytmResult.success) {
            // Update payment status to failed
            payment.status = 'failed';
            payment.failureReason = paytmResult.error;
            payment.failedAt = new Date();
            await payment.save();

            return next(new ErrorResponse(`Payment link creation failed: ${paytmResult.error}`, 500));
        }

        // Update payment with Paytm details
        payment.status = 'initiated';
        payment.paytmOrderId = paytmResult.paytmOrderId;
        payment.paytmTransactionToken = paytmResult.transactionToken;
        payment.paytmPaymentLink = paytmResult.paymentLink;
        payment.gatewayResponse = paytmResult.gatewayResponse;
        await payment.save();

        // Create notifications for both parties
        await Notification.create({
            user: order.buyer._id,
            type: 'payment_link_created',
            title: 'Payment Link Ready!',
            message: `Payment link has been created for your purchase of ${order.product.title}. Click to complete payment of ₹${order.amount.toLocaleString()}.`,
            relatedProduct: order.product._id,
            relatedOrder: order._id,
            actionUrl: `/payment/${payment._id}`
        });

        await Notification.create({
            user: order.seller._id,
            type: 'payment_link_created',
            title: 'Payment Link Sent to Buyer',
            message: `Payment link for ₹${order.amount.toLocaleString()} has been sent to the buyer for ${order.product.title}.`,
            relatedProduct: order.product._id,
            relatedOrder: order._id,
            actionUrl: `/orders/${order._id}`
        });

        res.status(201).json({
            success: true,
            data: {
                paymentId: payment._id,
                paymentLink: payment.paytmPaymentLink,
                amount: payment.amount,
                expiresAt: payment.expiresAt,
                message: 'Payment link created successfully'
            }
        });

    } catch (error) {
        console.error('Payment link creation error:', error);
        return next(new ErrorResponse('Failed to create payment link', 500));
    }
});

// @desc    Get payment details
// @route   GET /api/payments/:id
// @access  Private
exports.getPayment = asyncHandler(async (req, res, next) => {
    const payment = await Payment.findById(req.params.id)
        .populate({
            path: 'orderId',
            populate: [
                { path: 'buyer', select: 'name email' },
                { path: 'seller', select: 'name email' },
                { path: 'product', select: 'title price images' }
            ]
        });

    if (!payment) {
        return next(new ErrorResponse('Payment not found', 404));
    }

    // Check if user is authorized to view this payment
    if (payment.payerUserId.toString() !== req.user.id &&
        payment.payeeUserId.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to view this payment', 403));
    }

    res.status(200).json({
        success: true,
        data: payment
    });
});

// @desc    Handle Paytm callback
// @route   POST /api/payments/callback
// @access  Public (Paytm callback)
exports.handlePaymentCallback = asyncHandler(async (req, res, next) => {
    const { paymentId } = req.query;
    const callbackData = req.body;

    console.log('Payment callback received:', { paymentId, callbackData });

    if (!paymentId) {
        return res.status(400).json({
            success: false,
            error: 'Payment ID is required in callback'
        });
    }

    // Get payment record
    const payment = await Payment.findById(paymentId)
        .populate('orderId')
        .populate('payerUserId', 'name email')
        .populate('payeeUserId', 'name email');

    if (!payment) {
        return res.status(404).json({
            success: false,
            error: 'Payment record not found'
        });
    }

    try {
        // Validate callback from Paytm
        const validation = paytmService.validateCallback(callbackData);

        if (!validation.valid) {
            console.error('Invalid callback received:', validation.error);

            payment.status = 'failed';
            payment.failureReason = `Callback validation failed: ${validation.error}`;
            payment.failedAt = new Date();
            payment.gatewayResponse = { ...payment.gatewayResponse, callback: callbackData };
            await payment.save();

            return res.status(400).json({
                success: false,
                error: 'Invalid payment callback'
            });
        }

        const transactionData = validation.transactionData;

        // Update payment with transaction details
        payment.paytmTransactionId = transactionData.TXNID;
        payment.paytmBankTxnId = transactionData.BANKTXNID;
        payment.gatewayResponse = { ...payment.gatewayResponse, callback: transactionData };

        // Determine payment status based on Paytm response
        if (transactionData.STATUS === 'TXN_SUCCESS') {
            payment.status = 'completed';
            payment.completedAt = new Date();

            // Update order payment status
            const order = await Order.findById(payment.orderId);
            if (order) {
                order.paymentStatus = 'paid';
                await order.save();

                // Mark product as sold
                await Product.findByIdAndUpdate(order.product, { sold: true });

                // Create success notifications
                await Notification.create({
                    user: payment.payerUserId._id,
                    type: 'payment_completed',
                    title: 'Payment Successful!',
                    message: `Your payment of ₹${payment.amount.toLocaleString()} has been completed successfully. The seller will share account details soon.`,
                    relatedProduct: order.product,
                    relatedOrder: order._id,
                    actionUrl: `/orders/${order._id}`
                });

                await Notification.create({
                    user: payment.payeeUserId._id,
                    type: 'payment_received',
                    title: 'Payment Received!',
                    message: `Payment of ₹${payment.amount.toLocaleString()} has been received from the buyer. Please share the account details now.`,
                    relatedProduct: order.product,
                    relatedOrder: order._id,
                    actionUrl: `/orders/${order._id}`
                });
            }

        } else {
            payment.status = 'failed';
            payment.failureReason = transactionData.RESPMSG || 'Transaction failed';
            payment.failedAt = new Date();

            // Create failure notification
            await Notification.create({
                user: payment.payerUserId._id,
                type: 'payment_failed',
                title: 'Payment Failed',
                message: `Your payment of ₹${payment.amount.toLocaleString()} could not be processed. Please try again or contact support.`,
                relatedProduct: payment.orderId.product,
                relatedOrder: payment.orderId._id,
                actionUrl: `/payment/${payment._id}`
            });
        }

        await payment.save();

        // Redirect user based on payment status
        const redirectUrl = transactionData.STATUS === 'TXN_SUCCESS'
            ? `${process.env.CLIENT_URL}/payment/success?paymentId=${payment._id}`
            : `${process.env.CLIENT_URL}/payment/failed?paymentId=${payment._id}`;

        res.redirect(redirectUrl);

    } catch (error) {
        console.error('Callback processing error:', error);

        payment.status = 'failed';
        payment.failureReason = `Callback processing error: ${error.message}`;
        payment.failedAt = new Date();
        await payment.save();

        res.status(500).json({
            success: false,
            error: 'Failed to process payment callback'
        });
    }
});

// @desc    Check payment status
// @route   GET /api/payments/:id/status
// @access  Private
exports.checkPaymentStatus = asyncHandler(async (req, res, next) => {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
        return next(new ErrorResponse('Payment not found', 404));
    }

    // Check authorization
    if (payment.payerUserId.toString() !== req.user.id &&
        payment.payeeUserId.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to check this payment status', 403));
    }

    // If payment is still pending/initiated, check with Paytm
    if (['pending', 'initiated'].includes(payment.status) && payment.paytmOrderId) {
        try {
            const statusResult = await paytmService.checkPaymentStatus(payment.paytmOrderId);

            if (statusResult.success && statusResult.status === 'TXN_SUCCESS') {
                // Update payment status
                payment.status = 'completed';
                payment.completedAt = new Date();
                payment.paytmTransactionId = statusResult.transactionId;
                payment.paytmBankTxnId = statusResult.bankTxnId;
                payment.gatewayResponse = { ...payment.gatewayResponse, statusCheck: statusResult.gatewayResponse };
                await payment.save();

                // Update order
                await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: 'paid' });
            }
        } catch (error) {
            console.error('Status check error:', error);
        }
    }

    res.status(200).json({
        success: true,
        data: {
            paymentId: payment._id,
            status: payment.status,
            amount: payment.amount,
            completedAt: payment.completedAt,
            failureReason: payment.failureReason
        }
    });
});

// @desc    Get user's payments
// @route   GET /api/payments
// @access  Private
exports.getUserPayments = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 10, status } = req.query;

    let query = {
        $or: [
            { payerUserId: req.user.id },
            { payeeUserId: req.user.id }
        ]
    };

    if (status) {
        query.status = status;
    }

    const payments = await Payment.find(query)
        .populate({
            path: 'orderId',
            populate: [
                { path: 'product', select: 'title price images' },
                { path: 'buyer', select: 'name email' },
                { path: 'seller', select: 'name email' }
            ]
        })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
        success: true,
        count: payments.length,
        total,
        data: payments
    });
});
