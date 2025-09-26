import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const EmailVerificationPage = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
    const [lockoutInfo, setLockoutInfo] = useState(null);
    const [lockoutCountdown, setLockoutCountdown] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Get email from navigation state or redirect if not available
        const emailFromState = location.state?.email;
        if (emailFromState) {
            setEmail(emailFromState);
        } else {
            toast.error('Please register first');
            navigate('/register');
        }
    }, [location.state, navigate]);

    useEffect(() => {
        // Countdown timer for OTP expiry
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    // Lockout countdown timer
    useEffect(() => {
        let timer;
        if (lockoutCountdown > 0) {
            timer = setInterval(() => {
                setLockoutCountdown(prev => {
                    if (prev <= 1) {
                        setLockoutInfo(null);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [lockoutCountdown]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        if (lockoutInfo && lockoutCountdown > 0) {
            toast.error(`Please wait ${formatTime(lockoutCountdown)} before trying again`);
            return;
        }

        try {
            setLoading(true);
            await authAPI.verifyEmail(email, otp);
            toast.success('Email verified successfully! You can now login.');
            navigate('/login');
        } catch (err) {
            const errorData = err.response?.data;

            if (errorData?.isLocked) {
                setLockoutInfo({
                    message: errorData.message,
                    isLocked: true
                });
                setLockoutCountdown(errorData.lockRemaining || 0);
                toast.error(errorData.message);
            } else if (errorData?.attemptsRemaining !== undefined) {
                toast.error(errorData.message);
            } else {
                toast.error(errorData?.message || 'Invalid OTP');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            setResendLoading(true);
            await authAPI.sendEmailVerificationOTP(email);
            toast.success('New OTP sent to your email');
            setTimeLeft(1200); // Reset timer to 20 minutes
            setOtp(''); // Clear current OTP
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setResendLoading(false);
        }
    };

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
        if (value.length <= 6) {
            setOtp(value);
        }
    };

    return (
        <section className="auth-section">
            <div className="container">
                <div className="auth-container">
                    <div className="auth-image">
                        <img src="/images/email-verification-illustration.svg" alt="Email Verification" />
                    </div>

                    <div className="auth-form-container">
                        <div className="verification-header">
                            <i className="fas fa-envelope-open verification-icon"></i>
                            <h2>Verify Your Email</h2>
                            <p>We've sent a 6-digit verification code to</p>
                            <p className="email-display">{email}</p>
                        </div>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            {/* Lockout Warning */}
                            {lockoutInfo && lockoutCountdown > 0 && (
                                <div className="lockout-warning">
                                    <div className="lockout-icon">
                                        <i className="fas fa-exclamation-triangle"></i>
                                    </div>
                                    <div className="lockout-content">
                                        <h4>Too Many Failed Attempts</h4>
                                        <p>{lockoutInfo.message}</p>
                                        <div className="countdown-timer">
                                            <span>Time remaining: </span>
                                            <strong className="countdown-time">{formatTime(lockoutCountdown)}</strong>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="otp">Verification Code</label>
                                <input
                                    type="text"
                                    id="otp"
                                    name="otp"
                                    value={otp}
                                    onChange={handleOtpChange}
                                    className="form-control otp-input"
                                    placeholder="Enter 6-digit code"
                                    maxLength="6"
                                    required
                                />
                                <small className="form-text">
                                    {timeLeft > 0 ? (
                                        <>Code expires in: <span className="timer">{formatTime(timeLeft)}</span></>
                                    ) : (
                                        <span className="expired">Code has expired</span>
                                    )}
                                </small>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block"
                                disabled={loading || timeLeft === 0}
                            >
                                {loading ? 'Verifying...' : 'Verify Email'}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>Didn't receive the code?</p>
                            <button
                                onClick={handleResendOTP}
                                disabled={resendLoading || timeLeft > 1140} // Allow resend after 1 minute
                                className="btn btn-outline btn-sm"
                            >
                                {resendLoading ? 'Sending...' : 'Resend Code'}
                            </button>
                            {timeLeft > 1140 && (
                                <small className="form-text">
                                    You can resend in {formatTime(timeLeft - 1140)}
                                </small>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EmailVerificationPage;
