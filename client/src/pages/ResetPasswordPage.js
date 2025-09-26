import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ResetPasswordPage = () => {
    const [formData, setFormData] = useState({
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [email, setEmail] = useState('');
    const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes
    const [lockoutInfo, setLockoutInfo] = useState(null);
    const [lockoutCountdown, setLockoutCountdown] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const { otp, newPassword, confirmPassword } = formData;

    useEffect(() => {
        const emailFromState = location.state?.email;
        if (emailFromState) {
            setEmail(emailFromState);
        } else {
            toast.error('Please start the password reset process from the beginning');
            navigate('/forgot-password');
        }
    }, [location.state, navigate]);

    useEffect(() => {
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 6) {
            setFormData({ ...formData, otp: value });
        }
    };

    const handleVerifyOTP = async (e) => {
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
            await authAPI.verifyResetOTP(email, otp);
            toast.success('OTP verified! Now set your new password.');
            setOtpVerified(true);
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
                toast.error(errorData?.message || 'Invalid or expired OTP');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (lockoutInfo && lockoutCountdown > 0) {
            toast.error(`Please wait ${formatTime(lockoutCountdown)} before trying again`);
            return;
        }

        try {
            setLoading(true);
            const response = await authAPI.resetPassword(email, otp, newPassword);

            // Auto-login after successful password reset
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                login(response.data.user, response.data.token);
                toast.success('Password reset successfully! You are now logged in.');
                navigate('/');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            setLoading(true);
            await authAPI.forgotPassword(email);
            toast.success('New OTP sent to your email');
            setTimeLeft(1200);
            setFormData({ otp: '', newPassword: '', confirmPassword: '' });
            setOtpVerified(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-section">
            <div className="container">
                <div className="auth-container">
                    <div className="auth-image">
                        <img src="/images/reset-password-illustration.svg" alt="Reset Password" />
                    </div>

                    <div className="auth-form-container">
                        {!otpVerified ? (
                            <>
                                <div className="verification-header">
                                    <i className="fas fa-shield-alt verification-icon"></i>
                                    <h2>Verify Reset Code</h2>
                                    <p>Enter the 6-digit code sent to</p>
                                    <p className="email-display">{email}</p>
                                </div>

                                <form className="auth-form" onSubmit={handleVerifyOTP}>
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
                                        <label htmlFor="otp">Reset Code</label>
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
                                        {loading ? 'Verifying...' : 'Verify Code'}
                                    </button>
                                </form>

                                <div className="auth-footer">
                                    <p>Didn't receive the code?</p>
                                    <button
                                        onClick={handleResendOTP}
                                        disabled={loading}
                                        className="btn btn-outline btn-sm"
                                    >
                                        {loading ? 'Sending...' : 'Resend Code'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2>Set New Password</h2>
                                <p>Create a strong password for your account</p>

                                <form className="auth-form" onSubmit={handleResetPassword}>
                                    <div className="form-group">
                                        <label htmlFor="newPassword">New Password</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            name="newPassword"
                                            value={newPassword}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Enter new password"
                                            minLength="6"
                                            required
                                        />
                                        <small className="form-text">Password must be at least 6 characters</small>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="confirmPassword">Confirm New Password</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={confirmPassword}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Confirm new password"
                                            minLength="6"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-block"
                                        disabled={loading}
                                    >
                                        {loading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </form>
                            </>
                        )}

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

export default ResetPasswordPage;
