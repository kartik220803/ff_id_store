import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import Spinner from '../components/layout/Spinner';
import { toast } from 'react-toastify';

const PaymentPage = () => {
    const { paymentId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSuccess] = useState(searchParams.get('status') === 'success');
    const [isFailed] = useState(searchParams.get('status') === 'failed');

    useEffect(() => {
        if (paymentId) {
            fetchPaymentDetails();
        }
    }, [paymentId]);

    const fetchPaymentDetails = async () => {
        try {
            setLoading(true);
            const response = await paymentAPI.getPayment(paymentId);

            if (response.data && response.data.success) {
                setPayment(response.data.data);
            } else {
                setError('Payment details not found');
            }
        } catch (error) {
            console.error('Error fetching payment details:', error);
            setError(error.response?.data?.message || 'Failed to load payment details');
        } finally {
            setLoading(false);
        }
    };

    const checkPaymentStatus = async () => {
        try {
            const response = await paymentAPI.checkPaymentStatus(paymentId);

            if (response.data && response.data.success) {
                const statusData = response.data.data;

                if (statusData.status === 'completed') {
                    toast.success('Payment completed successfully!');
                    setPayment(prev => ({ ...prev, status: 'completed' }));
                } else if (statusData.status === 'failed') {
                    toast.error('Payment failed. Please try again.');
                    setPayment(prev => ({ ...prev, status: 'failed' }));
                }
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
            toast.error('Failed to check payment status');
        }
    };

    const proceedToPayment = () => {
        if (payment && payment.paytmPaymentLink) {
            window.open(payment.paytmPaymentLink, '_blank');
        }
    };

    if (loading) {
        return <Spinner />;
    }

    if (error || !payment) {
        return (
            <div className="container">
                <div className="error-container">
                    <h2>Error</h2>
                    <p>{error || 'Payment not found'}</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/profile?tab=orders')}
                    >
                        Go to Orders
                    </button>
                </div>
            </div>
        );
    }

    return (
        <section className="section payment-section">
            <div className="container">
                <div className="payment-container">
                    {/* Success State */}
                    {(isSuccess || payment.status === 'completed') && (
                        <div className="payment-status success">
                            <div className="status-icon">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <h2>Payment Successful!</h2>
                            <p>Your payment of ₹{payment.amount.toLocaleString()} has been completed successfully.</p>

                            <div className="payment-details">
                                <h3>Payment Details</h3>
                                <div className="detail-row">
                                    <span>Amount:</span>
                                    <span>₹{payment.amount.toLocaleString()}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Transaction ID:</span>
                                    <span>{payment.paytmTransactionId || payment.transactionId}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Status:</span>
                                    <span className="status-badge success">Completed</span>
                                </div>
                                {payment.completedAt && (
                                    <div className="detail-row">
                                        <span>Completed At:</span>
                                        <span>{new Date(payment.completedAt).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            {payment.orderId && (
                                <div className="order-info">
                                    <h3>Order Information</h3>
                                    <div className="product-info">
                                        {payment.orderId.product?.images?.[0] && (
                                            <img
                                                src={payment.orderId.product.images[0].url}
                                                alt={payment.orderId.product.title}
                                            />
                                        )}
                                        <div>
                                            <h4>{payment.orderId.product?.title}</h4>
                                            <p>The seller will share account details soon.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="action-buttons">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate(`/orders/${payment.orderId._id}`)}
                                >
                                    View Order Details
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/profile?tab=orders')}
                                >
                                    My Orders
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Failed State */}
                    {(isFailed || payment.status === 'failed') && (
                        <div className="payment-status failed">
                            <div className="status-icon">
                                <i className="fas fa-times-circle"></i>
                            </div>
                            <h2>Payment Failed</h2>
                            <p>Unfortunately, your payment could not be processed.</p>

                            {payment.failureReason && (
                                <div className="failure-reason">
                                    <strong>Reason:</strong> {payment.failureReason}
                                </div>
                            )}

                            <div className="action-buttons">
                                <button
                                    className="btn btn-primary"
                                    onClick={proceedToPayment}
                                    disabled={!payment.paytmPaymentLink}
                                >
                                    Try Payment Again
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/profile?tab=orders')}
                                >
                                    My Orders
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pending/Initiated State */}
                    {(['pending', 'initiated'].includes(payment.status)) && (
                        <div className="payment-status pending">
                            <div className="status-icon">
                                <i className="fas fa-credit-card"></i>
                            </div>
                            <h2>Complete Your Payment</h2>
                            <p>Please complete your payment to secure this account.</p>

                            <div className="payment-details">
                                <h3>Payment Details</h3>
                                <div className="detail-row">
                                    <span>Amount:</span>
                                    <span>₹{payment.amount.toLocaleString()}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Expires At:</span>
                                    <span>{new Date(payment.expiresAt).toLocaleString()}</span>
                                </div>
                            </div>

                            {payment.orderId && (
                                <div className="order-info">
                                    <h3>Product Information</h3>
                                    <div className="product-info">
                                        {payment.orderId.product?.images?.[0] && (
                                            <img
                                                src={payment.orderId.product.images[0].url}
                                                alt={payment.orderId.product.title}
                                            />
                                        )}
                                        <div>
                                            <h4>{payment.orderId.product?.title}</h4>
                                            <p>Level {payment.orderId.product?.level} • ₹{payment.orderId.product?.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="action-buttons">
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={proceedToPayment}
                                    disabled={!payment.paytmPaymentLink}
                                >
                                    <i className="fas fa-credit-card"></i>
                                    Pay Now - ₹{payment.amount.toLocaleString()}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={checkPaymentStatus}
                                >
                                    <i className="fas fa-sync-alt"></i>
                                    Check Status
                                </button>
                            </div>

                            <div className="payment-security">
                                <p>
                                    <i className="fas fa-lock"></i>
                                    Secured by Paytm • Your payment is safe and encrypted
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default PaymentPage;
