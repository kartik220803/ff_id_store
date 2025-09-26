# Paytm Business API Integration Guide

## Overview

This guide covers the complete integration of Paytm Business API for creating custom payment links when both buyer and seller accept a deal in your FF-ID Store marketplace.

## Setup Instructions

### 1. Paytm Business Account Setup

1. **Create Paytm Business Account**:
   - Visit [Paytm Business](https://business.paytm.com/)
   - Complete KYC verification
   - Get your Merchant ID and Merchant Key

2. **Configure Environment Variables**:
   ```env
   # Paytm Configuration
   PAYTM_MERCHANT_ID=your_merchant_id
   PAYTM_MERCHANT_KEY=your_merchant_key
   PAYTM_WEBSITE=WEBSTAGING  # Change to WEBSITE for production
   PAYTM_INDUSTRY_TYPE=Retail
   PAYTM_CALLBACK_URL=http://localhost:5000/api/payments/callback
   PAYTM_PAYMENT_GATEWAY_URL=https://securegw-stage.paytm.in  # Change to production URL for live
   CLIENT_URL=http://localhost:3000
   ```

### 2. Testing Configuration

For testing, use these Paytm staging credentials:
- **Merchant ID**: `your_test_merchant_id`
- **Merchant Key**: `your_test_merchant_key`
- **Gateway URL**: `https://securegw-stage.paytm.in`
- **Website**: `WEBSTAGING`

### 3. Production Configuration

For production:
- **Gateway URL**: `https://securegw.paytm.in`
- **Website**: `DEFAULT` or your registered website name
- Use your live merchant credentials

## Implementation Flow

### 1. Deal Acceptance Triggers Payment Link

When a seller accepts a purchase request or offer:
1. Order status is updated to 'accepted'
2. Payment record is created automatically
3. Paytm payment order is generated
4. Payment link is created
5. Notifications are sent to both parties

### 2. Payment Process

1. **Buyer receives notification** with payment link
2. **Buyer clicks "Pay Now"** and is redirected to Paytm
3. **Buyer completes payment** on Paytm gateway
4. **Paytm sends callback** to your server
5. **Payment status is updated** in your database
6. **Order is marked as paid**
7. **Notifications are sent** to both parties
8. **Product is marked as sold**

### 3. Payment States

- **Pending**: Payment link created but not initiated
- **Initiated**: Payment link accessed, waiting for completion
- **Completed**: Payment successful
- **Failed**: Payment failed or cancelled
- **Refunded**: Payment refunded (future feature)

## API Endpoints

### Payment Endpoints

1. **Create Payment Link**
   ```
   POST /api/payments/create-link
   Body: { orderId: "order_id" }
   ```

2. **Get Payment Details**
   ```
   GET /api/payments/:paymentId
   ```

3. **Check Payment Status**
   ```
   GET /api/payments/:paymentId/status
   ```

4. **Get User Payments**
   ```
   GET /api/payments?status=completed&page=1&limit=10
   ```

5. **Payment Callback** (Paytm webhook)
   ```
   POST /api/payments/callback?paymentId=payment_id
   ```

## Frontend Integration

### 1. Payment Page Routes

- `/payment/:paymentId` - Payment details and actions
- `/payment/success` - Payment success page
- `/payment/failed` - Payment failure page

### 2. Notification Integration

Payment-related notifications appear in the user's profile:
- `payment_link_created` - Payment link ready
- `payment_completed` - Payment successful
- `payment_failed` - Payment failed

### 3. Payment Components

The `PaymentPage` component handles:
- Display payment details
- Show payment status
- Redirect to Paytm gateway
- Handle success/failure states
- Check payment status

## Security Features

### 1. Checksum Verification

All Paytm API calls use HMAC-SHA256 checksums for security:
- Request checksum generation
- Response checksum verification
- Callback validation

### 2. Order Validation

- Verify order exists and is accepted
- Check user authorization
- Validate payment amounts
- Prevent duplicate payments

### 3. Transaction Tracking

- Unique transaction IDs
- Payment status tracking
- Audit trail maintenance
- Error logging

## Notification System Integration

### 1. Notification Types

Payment-related notification types:
- `payment_link_created`
- `payment_completed`
- `payment_failed`
- `payment_received`

### 2. Notification Flow

1. **Payment Link Created**:
   - Buyer: "Payment link ready - pay now"
   - Seller: "Payment link sent to buyer"

2. **Payment Completed**:
   - Buyer: "Payment successful"
   - Seller: "Payment received - share account details"

3. **Payment Failed**:
   - Buyer: "Payment failed - try again"

## Error Handling

### 1. Payment Creation Errors

- Invalid order status
- Paytm API failures
- Network connectivity issues
- Invalid merchant configuration

### 2. Payment Processing Errors

- Gateway timeouts
- Invalid checksums
- Transaction failures
- Bank declinations

### 3. Recovery Mechanisms

- Automatic payment status checks
- Manual retry options
- Payment link regeneration
- Error notifications

## Testing

### 1. Test Cards

Use Paytm test cards for staging:
- **Credit Card**: 4111 1111 1111 1111
- **CVV**: 123
- **Expiry**: Any future date

### 2. Test Scenarios

1. **Successful Payment**:
   - Create order → Accept → Pay → Success

2. **Failed Payment**:
   - Create order → Accept → Pay → Decline

3. **Abandoned Payment**:
   - Create order → Accept → Start payment → Abandon

### 3. Status Verification

- Check payment status updates
- Verify notification delivery
- Confirm order state changes
- Validate product sold status

## Monitoring and Analytics

### 1. Payment Metrics

Track important metrics:
- Payment success rate
- Average transaction value
- Payment method preferences
- Failure reasons

### 2. Database Queries

```javascript
// Get payment success rate
const successRate = await Payment.aggregate([
  {
    $group: {
      _id: '$status',
      count: { $sum: 1 }
    }
  }
]);

// Get daily payment volume
const dailyVolume = await Payment.aggregate([
  {
    $match: {
      status: 'completed',
      completedAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  },
  {
    $group: {
      _id: {
        $dateToString: {
          format: '%Y-%m-%d',
          date: '$completedAt'
        }
      },
      totalAmount: { $sum: '$amount' },
      count: { $sum: 1 }
    }
  }
]);
```

## Troubleshooting

### 1. Common Issues

1. **Checksum Mismatch**:
   - Verify merchant key
   - Check parameter order
   - Validate character encoding

2. **Callback Not Received**:
   - Check callback URL accessibility
   - Verify webhook endpoint
   - Check firewall settings

3. **Payment Link Not Working**:
   - Verify merchant credentials
   - Check gateway URL
   - Validate request parameters

### 2. Debug Tools

Enable detailed logging for debugging:
```javascript
// In payment controller
console.log('Payment creation request:', req.body);
console.log('Paytm API response:', paytmResult);
console.log('Callback data:', callbackData);
```

## Production Deployment

### 1. Environment Setup

1. Update environment variables for production
2. Configure production Paytm credentials
3. Set up SSL certificates for callbacks
4. Configure production database

### 2. Security Checklist

- [ ] Use HTTPS for all endpoints
- [ ] Validate all user inputs
- [ ] Implement rate limiting
- [ ] Set up monitoring alerts
- [ ] Configure backup systems
- [ ] Test disaster recovery

### 3. Performance Optimization

- Database indexing for payment queries
- Caching for frequent operations
- Connection pooling for external APIs
- Asynchronous payment processing

## Support and Maintenance

### 1. Regular Tasks

- Monitor payment success rates
- Update expired payment links
- Clean up old payment records
- Review failed transactions

### 2. Paytm API Updates

Stay updated with Paytm API changes:
- Subscribe to developer notifications
- Test staging environment regularly
- Update integration as needed

This integration provides a complete payment solution that automatically creates payment links when deals are accepted, handles the entire payment flow, and integrates seamlessly with your existing notification system.
