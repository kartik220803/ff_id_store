const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class PaytmService {
    constructor() {
        this.merchantId = process.env.PAYTM_MERCHANT_ID;
        this.merchantKey = process.env.PAYTM_MERCHANT_KEY;
        this.website = process.env.PAYTM_WEBSITE || 'WEBSTAGING';
        this.industryType = process.env.PAYTM_INDUSTRY_TYPE || 'Retail';
        this.callbackUrl = process.env.PAYTM_CALLBACK_URL;
        this.gatewayUrl = process.env.PAYTM_PAYMENT_GATEWAY_URL || 'https://securegw-stage.paytm.in';
    }

    // Generate checksum for Paytm API requests
    generateChecksum(params, key) {
        try {
            const data = Object.keys(params)
                .sort()
                .map(k => `${k}=${params[k]}`)
                .join('&');

            const salt = this.generateSalt();
            const finalString = `${data}|${salt}`;

            const hash = crypto.createHmac('sha256', key).update(finalString).digest('hex');
            return `${hash}|${salt}`;
        } catch (error) {
            console.error('Error generating checksum:', error);
            throw new Error('Failed to generate payment checksum');
        }
    }

    // Verify checksum for callback validation
    verifyChecksum(params, receivedChecksum, key) {
        try {
            const [hash, salt] = receivedChecksum.split('|');
            const data = Object.keys(params)
                .filter(k => k !== 'CHECKSUMHASH')
                .sort()
                .map(k => `${k}=${params[k]}`)
                .join('&');

            const finalString = `${data}|${salt}`;
            const expectedHash = crypto.createHmac('sha256', key).update(finalString).digest('hex');

            return hash === expectedHash;
        } catch (error) {
            console.error('Error verifying checksum:', error);
            return false;
        }
    }

    // Generate random salt
    generateSalt(length = 4) {
        return crypto.randomBytes(length).toString('hex');
    }

    // Create payment order and get transaction token
    async createPaymentOrder(orderData) {
        try {
            const {
                orderId,
                amount,
                customerId,
                customerEmail,
                customerPhone,
                productTitle,
                callbackUrl
            } = orderData;

            // Generate unique Paytm order ID
            const paytmOrderId = `ORDER_${orderId}_${Date.now()}`;

            // Prepare request body for Paytm
            const requestBody = {
                requestType: 'Payment',
                mid: this.merchantId,
                websiteName: this.website,
                orderId: paytmOrderId,
                callbackUrl: callbackUrl || this.callbackUrl,
                txnAmount: {
                    value: amount.toString(),
                    currency: 'INR'
                },
                userInfo: {
                    custId: customerId,
                    email: customerEmail,
                    mobile: customerPhone
                },
                enablePaymentMode: [
                    {
                        mode: 'UPI',
                        channels: ['UPI']
                    },
                    {
                        mode: 'CARD',
                        channels: ['CREDIT', 'DEBIT']
                    },
                    {
                        mode: 'NET_BANKING',
                        channels: ['ALL']
                    },
                    {
                        mode: 'WALLET',
                        channels: ['PAYTM']
                    }
                ]
            };

            // Generate checksum
            const checksum = this.generateChecksum({
                mid: this.merchantId,
                orderId: paytmOrderId,
                amount: amount.toString()
            }, this.merchantKey);

            // Make API call to Paytm
            const response = await axios.post(
                `${this.gatewayUrl}/theia/api/v1/initiateTransaction?mid=${this.merchantId}&orderId=${paytmOrderId}`,
                {
                    body: requestBody,
                    head: {
                        signature: checksum
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.body && response.data.body.resultInfo.resultStatus === 'S') {
                const transactionToken = response.data.body.txnToken;
                const paymentLink = `${this.gatewayUrl}/theia/api/v1/showPaymentPage?mid=${this.merchantId}&orderId=${paytmOrderId}`;

                return {
                    success: true,
                    paytmOrderId,
                    transactionToken,
                    paymentLink,
                    amount,
                    currency: 'INR',
                    gatewayResponse: response.data
                };
            } else {
                throw new Error(response.data?.body?.resultInfo?.resultMsg || 'Payment order creation failed');
            }

        } catch (error) {
            console.error('Paytm order creation error:', error);
            return {
                success: false,
                error: error.message || 'Failed to create payment order',
                details: error.response?.data || null
            };
        }
    }

    // Check payment status
    async checkPaymentStatus(paytmOrderId) {
        try {
            const requestBody = {
                mid: this.merchantId,
                orderId: paytmOrderId
            };

            const checksum = this.generateChecksum(requestBody, this.merchantKey);

            const response = await axios.post(
                `${this.gatewayUrl}/v3/order/status`,
                {
                    body: requestBody,
                    head: {
                        signature: checksum
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.body) {
                return {
                    success: true,
                    status: response.data.body.resultInfo.resultStatus,
                    statusMessage: response.data.body.resultInfo.resultMsg,
                    transactionId: response.data.body.txnId,
                    bankTxnId: response.data.body.bankTxnId,
                    amount: response.data.body.txnAmount,
                    gatewayResponse: response.data
                };
            } else {
                throw new Error('Invalid response from payment gateway');
            }

        } catch (error) {
            console.error('Payment status check error:', error);
            return {
                success: false,
                error: error.message || 'Failed to check payment status',
                details: error.response?.data || null
            };
        }
    }

    // Process refund
    async processRefund(refundData) {
        try {
            const {
                paytmOrderId,
                paytmTransactionId,
                amount,
                reason
            } = refundData;

            const refundId = `REFUND_${paytmOrderId}_${Date.now()}`;

            const requestBody = {
                mid: this.merchantId,
                orderId: paytmOrderId,
                txnId: paytmTransactionId,
                refId: refundId,
                refundAmount: amount.toString(),
                reason: reason || 'Order cancellation'
            };

            const checksum = this.generateChecksum(requestBody, this.merchantKey);

            const response = await axios.post(
                `${this.gatewayUrl}/refund/apply`,
                {
                    body: requestBody,
                    head: {
                        signature: checksum
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.body) {
                return {
                    success: true,
                    refundId,
                    status: response.data.body.resultInfo.resultStatus,
                    statusMessage: response.data.body.resultInfo.resultMsg,
                    gatewayResponse: response.data
                };
            } else {
                throw new Error('Invalid response from payment gateway');
            }

        } catch (error) {
            console.error('Refund processing error:', error);
            return {
                success: false,
                error: error.message || 'Failed to process refund',
                details: error.response?.data || null
            };
        }
    }

    // Validate callback from Paytm
    validateCallback(callbackData) {
        try {
            const { CHECKSUMHASH, ...params } = callbackData;

            if (!CHECKSUMHASH) {
                return { valid: false, error: 'Missing checksum in callback' };
            }

            const isValid = this.verifyChecksum(params, CHECKSUMHASH, this.merchantKey);

            return {
                valid: isValid,
                transactionData: isValid ? params : null,
                error: isValid ? null : 'Invalid checksum'
            };

        } catch (error) {
            console.error('Callback validation error:', error);
            return {
                valid: false,
                error: error.message || 'Callback validation failed'
            };
        }
    }
}

module.exports = new PaytmService();
