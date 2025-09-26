import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { gapi } from 'gapi-script';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  const { email, password } = formData;

  // Debug social login credentials
  useEffect(() => {
    console.log('=== Social Login Debug ===');
    console.log('Facebook App ID:', process.env.REACT_APP_FACEBOOK_APP_ID);
    console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
    console.log('Current URL:', window.location.href);
    console.log('Current domain:', window.location.hostname);

    // Check for potential extension conflicts
    if (window.chrome && window.chrome.runtime) {
      console.warn('Chrome extensions detected - may cause social login issues');
    }

    console.log('=========================');
  }, []);

  // Initialize Google API
  useEffect(() => {
    const initGapi = async () => {
      try {
        console.log('Initializing Google API...');

        // Check if gapi is loaded
        if (typeof gapi === 'undefined') {
          console.warn('Google API not loaded yet, retrying...');
          return;
        }

        console.log('Google API found, loading auth2...');

        await new Promise((resolve, reject) => {
          gapi.load('auth2', {
            callback: resolve,
            onerror: reject
          });
        });

        console.log('Auth2 loaded, checking existing instance...');

        let authInstance = gapi.auth2.getAuthInstance();

        if (!authInstance) {
          console.log('No existing auth instance, initializing new one...');

          const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
          if (!clientId || clientId === 'your_actual_google_client_id_here') {
            console.error('Google Client ID not configured properly');
            return;
          }

          authInstance = await gapi.auth2.init({
            client_id: clientId,
            scope: 'profile email'
          });

          console.log('Google auth instance initialized successfully');
        } else {
          console.log('Using existing Google auth instance');
        }

      } catch (error) {
        console.error('Google API initialization error:', error);
        if (error.details) {
          console.error('Error details:', error.details);
        }
      }
    };

    // Try multiple times with increasing delays
    const tryInit = (attempt = 1) => {
      const delay = attempt * 1000; // 1s, 2s, 3s delays

      setTimeout(() => {
        initGapi().catch((error) => {
          console.error(`Google API init attempt ${attempt} failed:`, error);
          if (attempt < 3) {
            tryInit(attempt + 1);
          }
        });
      }, delay);
    };

    tryInit();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setLockoutInfo(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (lockoutInfo && countdown > 0) {
      toast.error(`Please wait ${formatTime(countdown)} before trying again`);
      return;
    }

    try {
      setLoading(true);
      await login(formData);
      toast.success('Login successful!');
      navigate('/');
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.isLocked) {
        setLockoutInfo({
          message: errorData.message,
          isLocked: true
        });
        setCountdown(errorData.lockRemaining || 0);
        toast.error(errorData.message);
      } else if (errorData?.requiresEmailVerification) {
        toast.error('Please verify your email before logging in');
        navigate('/verify-email', { state: { email: errorData.email } });
      } else if (errorData?.attemptsRemaining !== undefined) {
        toast.error(errorData.message);
      } else {
        toast.error(errorData?.message || 'Login failed');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log('=== Google Login Started ===');

    try {
      // Check if Google API is available
      if (typeof gapi === 'undefined' || !gapi.auth2) {
        console.error('Google API not available:', { gapi: typeof gapi, auth2: gapi?.auth2 });
        toast.error('Google API not loaded. Please refresh the page.');
        return;
      }

      console.log('Google API available, getting auth instance...');
      const authInstance = gapi.auth2.getAuthInstance();

      if (!authInstance) {
        console.error('Google auth instance not available');
        toast.error('Google authentication not initialized. Please refresh the page.');
        return;
      }

      console.log('Attempting Google sign-in...');
      setLoading(true);

      const googleUser = await authInstance.signIn();
      console.log('Google sign-in successful, getting profile...');

      const profile = googleUser.getBasicProfile();
      const idToken = googleUser.getAuthResponse().id_token;

      const socialLoginData = {
        provider: 'google',
        token: idToken,
        name: profile.getName(),
        email: profile.getEmail(),
        avatar: profile.getImageUrl()
      };

      console.log('Sending social login data to backend:', socialLoginData);
      const result = await login(null, null, socialLoginData);

      if (result.success) {
        console.log('Google login successful!');
        toast.success('Successfully logged in with Google!');
        navigate('/');
      } else {
        console.error('Backend login failed:', result);
        toast.error(result.message || 'Google login failed');
      }
    } catch (error) {
      console.error('=== Google Login Error ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      console.error('========================');

      if (error.message && error.message.includes('popup_closed_by_user')) {
        toast.info('Google login cancelled');
      } else {
        toast.error('Google login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async (response) => {
    console.log('=== Facebook Login Response ===');
    console.log('Full response:', response);
    console.log('==============================');

    if (response.accessToken) {
      try {
        const socialLoginData = {
          provider: 'facebook',
          token: response.accessToken,
          name: response.name,
          email: response.email,
          avatar: response.picture?.data?.url
        };

        console.log('Facebook login data:', socialLoginData);
        setLoading(true);

        const result = await login(null, null, socialLoginData);

        if (result.success) {
          console.log('Facebook login successful!');
          toast.success('Successfully logged in with Facebook!');
          navigate('/');
        } else {
          console.error('Backend Facebook login failed:', result);
          toast.error(result.message || 'Facebook login failed');
        }
      } catch (error) {
        console.error('=== Facebook Login Error ===');
        console.error('Error:', error);
        console.error('============================');
        toast.error('Facebook login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      console.log('Facebook login cancelled or no access token:', response);
      if (response.status && response.status !== 'unknown') {
        toast.error('Facebook login failed. Please try again.');
      }
    }
  };

  const handleFacebookError = (error) => {
    console.error('=== Facebook Login Error Handler ===');
    console.error('Error:', error);
    console.error('===================================');
    toast.error('Facebook login failed. Please try again.');
  };

  return (
    <section className="auth-section">
      <div className="container">
        <div className="auth-container">
          <div className="auth-image">
            <img src="/images/login-illustration.svg" alt="Login" />
          </div>

          <div className="auth-form-container">
            <h2>Welcome Back</h2>
            <p>Sign in to access your account</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              {/* Lockout Warning */}
              {lockoutInfo && countdown > 0 && (
                <div className="lockout-warning">
                  <div className="lockout-icon">
                    <i className="fas fa-lock"></i>
                  </div>
                  <div className="lockout-content">
                    <h4>Account Temporarily Locked</h4>
                    <p>{lockoutInfo.message}</p>
                    <div className="countdown-timer">
                      <span>Time remaining: </span>
                      <strong className="countdown-time">{formatTime(countdown)}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="form-group remember-forgot">
                <div className="remember-me">
                  <input type="checkbox" id="remember" />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <div className="forgot-password">
                  <Link to="/forgot-password">Forgot Password?</Link>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="auth-social">
              <p>Or sign in with</p>
              <div className="social-buttons">
                <button
                  className="btn btn-social google"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <i className="fab fa-google"></i> Google
                </button>

                {/* Temporarily disable Facebook login to isolate Google issue */}
                {process.env.REACT_APP_FACEBOOK_APP_ID && process.env.REACT_APP_FACEBOOK_APP_ID !== 'your_facebook_app_id_here' ? (
                  <FacebookLogin
                    appId={process.env.REACT_APP_FACEBOOK_APP_ID}
                    autoLoad={false}
                    fields="name,email,picture"
                    callback={handleFacebookLogin}
                    onFailure={handleFacebookError}
                    disableMobileRedirect={true}
                    isMobile={false}
                    version="18.0"
                    render={renderProps => (
                      <button
                        className="btn btn-social facebook"
                        onClick={renderProps.onClick}
                        disabled={renderProps.disabled || loading}
                      >
                        <i className="fab fa-facebook-f"></i> Facebook
                      </button>
                    )}
                  />
                ) : (
                  <button
                    className="btn btn-social facebook"
                    disabled
                    title="Facebook App ID not configured"
                  >
                    <i className="fab fa-facebook-f"></i> Facebook (Not Configured)
                  </button>
                )}
              </div>
            </div>

            <div className="auth-footer">
              <p>
                Don't have an account? <Link to="/register">Sign Up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
