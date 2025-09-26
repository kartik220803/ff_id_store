const paytmService = require('./services/paytmService');

// Simple test function to verify Paytm integration
async function testPaytmIntegration() {
    console.log('Testing Paytm Integration...');
    
    try {
        // Test payment order creation
        const testOrderData = {
            orderId: 'TEST_ORDER_' + Date.now(),
            amount: 100, // Test with ₹100
            customerId: 'TEST_CUSTOMER_123',
            customerEmail: 'test@example.com',
            customerPhone: '9999999999',
            productTitle: 'Test Product',
            callbackUrl: process.env.PAYTM_CALLBACK_URL
        };

        console.log('Creating test payment order...');
        const result = await paytmService.createPaymentOrder(testOrderData);
        
        if (result.success) {
            console.log('✅ SUCCESS: Paytm integration working!');
            console.log('Payment Link:', result.paymentLink);
            console.log('Order ID:', result.paytmOrderId);
            console.log('Transaction Token:', result.transactionToken);
        } else {
            console.log('❌ FAILED: Paytm integration not working');
            console.log('Error:', result.error);
            console.log('Details:', result.details);
        }
        
    } catch (error) {
        console.log('❌ ERROR: Exception occurred');
        console.error('Error details:', error.message);
    }
}

// Run the test
testPaytmIntegration();
