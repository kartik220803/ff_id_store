import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        try {
            setLoading(true);
            await authAPI.forgotPassword(email);
            toast.success('Password reset OTP sent to your email');
            setEmailSent(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <section className="auth-section">
                <div className="container">
                    <div className="auth-container">
                        <div className="auth-image">
                            <img src="/images/email-sent-illustration.svg" alt="Email Sent" />
                        </div>

                        <div className="auth-form-container">
                            <div className="success-message">
                                <i className="fas fa-check-circle success-icon"></i>
                                <h2>Check Your Email</h2>
                                <p>We've sent a password reset OTP to</p>
                                <p className="email-display">{email}</p>
                                <p>Please check your email and follow the instructions to reset your password.</p>

                                <div className="auth-footer">
                                    <Link to="/reset-password" state={{ email }} className="btn btn-primary">
                                        Enter Reset Code
                                    </Link>
                                    <p>
                                        Remember your password? <Link to="/login">Sign In</Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="auth-section">
            <div className="container">
                <div className="auth-container">
                    <div className="auth-image">
                        <img src="/images/forgot-password-illustration.svg" alt="Forgot Password" />
                    </div>

                    <div className="auth-form-container">
                        <h2>Forgot Password?</h2>
                        <p>No worries! Enter your email address and we'll send you a code to reset your password.</p>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="form-control"
                                    placeholder="Enter your email address"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block"
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send Reset Code'}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                Remember your password? <Link to="/login">Sign In</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ForgotPasswordPage;
