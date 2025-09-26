const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create direct purchase order
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
    console.log('=== CREATE ORDER CALLED ===');
    console.log('Creating order with request body:', req.body);
    console.log('User making request:', req.user);

    const { productId, buyerNotes } = req.body;

    if (!productId) {
        console.log('ERROR: No product ID provided');
        return next(new ErrorResponse('Product ID is required', 400));
    }

    // Check if product exists and is not sold
    console.log('Fetching product with ID:', productId);
    const product = await Product.findById(productId).populate('seller', 'name email');
    console.log('Product found:', product ? 'YES' : 'NO');
    console.log('Product seller:', product?.seller);

    if (!product) {
        console.log('ERROR: Product not found');
        return next(new ErrorResponse('Product not found', 404));
    }

    if (product.sold) {
        console.log('ERROR: Product already sold');
        return next(new ErrorResponse('This account has already been sold', 400));
    }

    // Check if user is trying to buy their own product
    if (product.seller._id.toString() === req.user.id) {
        console.log('ERROR: User trying to buy own product');
        return next(new ErrorResponse('You cannot purchase your own listing', 400));
    }

    console.log('Creating order object...');
    // Create order with pending status
    const order = await Order.create({
        product: productId,
        buyer: req.user.id,
        seller: product.seller._id,
        amount: product.price,
        type: 'direct_purchase',
        status: 'pending',
        buyerNotes: buyerNotes || ''
    });
    console.log('Order created:', order._id);

    // Don't mark product as sold yet - wait for owner acceptance
    // product.sold = true;
    // await product.save();

    // Create notifications
    console.log('Creating notification for seller:', product.seller._id);
    console.log('Creating notification for buyer:', req.user.id);
    console.log('Buyer user data:', req.user);
    console.log('Seller data:', product.seller);

    try {
        const sellerNotification = await Notification.create({
            user: product.seller._id,
            type: 'purchase_request',
            title: 'New Purchase Request!',
            message: `${req.user.name || 'Someone'} wants to purchase your ${product.title} for ₹${product.price.toLocaleString()}. Accept or decline this request.`,
            relatedProduct: productId,
            relatedOrder: order._id,
            actionUrl: `/profile?tab=notifications`
        });
        console.log('Seller notification created successfully:', sellerNotification._id);
    } catch (error) {
        console.error('Error creating seller notification:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        // Continue execution even if notification fails
    }

    try {
        const buyerNotification = await Notification.create({
            user: req.user.id,
            type: 'purchase_request',
            title: 'Purchase Request Sent!',
            message: `Your purchase request for ${product.title} has been sent to the seller. Wait for their response.`,
            relatedProduct: productId,
            relatedOrder: order._id,
            actionUrl: `/products/${productId}`
        });
        console.log('Buyer notification created successfully:', buyerNotification._id);
    } catch (error) {
        console.error('Error creating buyer notification:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        // Continue execution even if notification fails
    }

    // Populate the order before sending response
    await order.populate([
        { path: 'product', select: 'title price images' },
        { path: 'buyer', select: 'name email' },
        { path: 'seller', select: 'name email' }
    ]);

    res.status(201).json({
        success: true,
        data: order
    });
});

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = asyncHandler(async (req, res, next) => {
    const { type } = req.query; // 'purchases' or 'sales'

    let query = {};

    if (type === 'purchases') {
        query.buyer = req.user.id;
    } else if (type === 'sales') {
        query.seller = req.user.id;
    } else {
        // Get both purchases and sales
        query = {
            $or: [
                { buyer: req.user.id },
                { seller: req.user.id }
            ]
        };
    }

    const orders = await Order.find(query)
        .populate('product', 'title price images')
        .populate('buyer', 'name email')
        .populate('seller', 'name email')
        .populate('relatedOffer')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: orders.length,
        data: orders
    });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
        .populate('product')
        .populate('buyer', 'name email phone')
        .populate('seller', 'name email phone')
        .populate('relatedOffer');

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    // Check if user is involved in this order
    if (order.buyer._id.toString() !== req.user.id && order.seller._id.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to view this order', 403));
    }

    res.status(200).json({
        success: true,
        data: order
    });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
    const { status, sellerNotes, accountDetails } = req.body;

    const order = await Order.findById(req.params.id)
        .populate('product')
        .populate('buyer', 'name email')
        .populate('seller', 'name email');

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    // Check if user is the seller
    if (order.seller._id.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to update this order', 403));
    }

    // Update order
    if (status) {
        order.status = status;

        // Handle purchase request acceptance
        if (status === 'accepted' && order.type === 'direct_purchase') {
            // Create notification for buyer
            await Notification.create({
                user: order.buyer._id,
                type: 'purchase_accepted',
                title: 'Purchase Request Accepted!',
                message: `Great news! ${order.seller.name} has accepted your purchase request for ${order.product.title}. A payment link will be created for you.`,
                relatedProduct: order.product._id,
                relatedOrder: order._id,
                actionUrl: `/orders/${order._id}`
            });

            // Auto-create payment link when deal is accepted
            try {
                const Payment = require('../models/Payment');
                const paytmService = require('../services/paytmService');

                // Check if payment link already exists
                const existingPayment = await Payment.findOne({
                    orderId: order._id,
                    status: { $in: ['pending', 'initiated', 'completed'] }
                });

                if (!existingPayment) {
                    // Create payment record
                    const payment = await Payment.create({
                        orderId: order._id,
                        transactionId: `TXN_${Date.now()}_${order._id}`,
                        payerUserId: order.buyer._id,
                        payeeUserId: order.seller._id,
                        amount: order.amount,
                        status: 'pending',
                        notes: `Payment for ${order.product.title}`
                    });

                    // Create Paytm payment order
                    const paytmOrderData = {
                        orderId: order._id.toString(),
                        amount: order.amount,
                        customerId: order.buyer._id.toString(),
                        customerEmail: order.buyer.email,
                        customerPhone: order.buyer.phone || '9999999999',
                        productTitle: order.product.title,
                        callbackUrl: `${process.env.PAYTM_CALLBACK_URL}?paymentId=${payment._id}`
                    };

                    const paytmResult = await paytmService.createPaymentOrder(paytmOrderData);

                    if (paytmResult.success) {
                        // Update payment with Paytm details
                        payment.status = 'initiated';
                        payment.paytmOrderId = paytmResult.paytmOrderId;
                        payment.paytmTransactionToken = paytmResult.transactionToken;
                        payment.paytmPaymentLink = paytmResult.paymentLink;
                        payment.gatewayResponse = paytmResult.gatewayResponse;
                        await payment.save();

                        // Create payment link notifications
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
                    }
                }
            } catch (paymentError) {
                console.error('Error creating payment link:', paymentError);
                // Continue execution even if payment link creation fails
            }
        }

        // Handle purchase request rejection
        if (status === 'rejected' && order.type === 'direct_purchase') {
            // Create notification for buyer
            await Notification.create({
                user: order.buyer._id,
                type: 'purchase_rejected',
                title: 'Purchase Request Declined',
                message: `Unfortunately, ${order.seller.name} has declined your purchase request for ${order.product.title}. You can try making an offer instead.`,
                relatedProduct: order.product._id,
                relatedOrder: order._id,
                actionUrl: `/products/${order.product._id}`
            });
        }
    }

    if (sellerNotes) {
        order.sellerNotes = sellerNotes;
    }

    if (accountDetails && status === 'completed') {
        order.accountDetails = accountDetails;
        order.accountDelivered = true;
        order.accountDeliveredAt = new Date();
        order.completedAt = new Date();
        order.paymentStatus = 'paid';

        // Create notification for buyer
        await Notification.create({
            user: order.buyer._id,
            type: 'account_delivered',
            title: 'Account Details Delivered!',
            message: `The account details for ${order.product.title} have been delivered. Check your order details.`,
            relatedProduct: order.product._id,
            relatedOrder: order._id,
            actionUrl: `/orders/${order._id}`
        });
    }

    await order.save();

    res.status(200).json({
        success: true,
        data: order
    });
});

// @desc    Mark payment as received (for sellers)
// @route   PUT /api/orders/:id/payment-received
// @access  Private
exports.markPaymentReceived = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('buyer seller product');

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    // Check if user is the seller
    if (order.seller._id.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to update this order', 403));
    }

    order.paymentStatus = 'paid';
    await order.save();

    // Create notification for buyer
    await Notification.create({
        user: order.buyer._id,
        type: 'payment_received',
        title: 'Payment Confirmed',
        message: `Payment for ${order.product.title} has been confirmed. Account details will be shared soon.`,
        relatedProduct: order.product._id,
        relatedOrder: order._id,
        actionUrl: `/orders/${order._id}`
    });

    res.status(200).json({
        success: true,
        data: order
    });
});
