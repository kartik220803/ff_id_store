import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { gapi } from 'gapi-script';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const { register, login } = useAuth();
  const navigate = useNavigate();

  const { name, email, phone, location, password, confirmPassword } = formData;

  // Debug Facebook App ID
  useEffect(() => {
    console.log('Facebook App ID:', process.env.REACT_APP_FACEBOOK_APP_ID);
    console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
  }, []);

  // Initialize Google API
  useEffect(() => {
    const initGapi = async () => {
      try {
        // Check if gapi is loaded
        if (typeof gapi === 'undefined') {
          console.warn('Google API not loaded yet');
          return;
        }

        await new Promise((resolve) => {
          gapi.load('auth2', resolve);
        });

        const authInstance = gapi.auth2.getAuthInstance();
        if (!authInstance) {
          await gapi.auth2.init({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID
          });
        }
      } catch (error) {
        console.error('Google API initialization error:', error);
      }
    };

    // Delay initialization to ensure gapi is loaded
    const timer = setTimeout(initGapi, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;

    // Phone number validation
    if (name === 'phone') {
      // Remove any non-digit characters for validation
      const digitsOnly = value.replace(/\D/g, '');

      // Clear previous error when user starts typing
      if (phoneError) {
        setPhoneError('');
      }

      // Allow empty phone (optional field) or validate 10 digits
      if (value && digitsOnly.length !== 10) {
        setPhoneError('Please enter a valid 10-digit phone number');
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Validate form
    if (!name || !email || !location || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Phone validation - if provided, must be 10 digits
    if (phone) {
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      // Remove confirmPassword before sending to API
      const registerData = { ...formData };
      delete registerData.confirmPassword;

      await register(registerData);
      toast.success('Registration successful! Please verify your email.');
      navigate('/verify-email', { state: { email: registerData.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      // Check if Google API is available
      if (typeof gapi === 'undefined' || !gapi.auth2) {
        toast.error('Google API not loaded. Please refresh the page.');
        return;
      }

      const authInstance = gapi.auth2.getAuthInstance();
      if (!authInstance) {
        toast.error('Google authentication not initialized. Please refresh the page.');
        return;
      }

      const googleUser = await authInstance.signIn();
      const profile = googleUser.getBasicProfile();
      const idToken = googleUser.getAuthResponse().id_token;

      const socialLoginData = {
        provider: 'google',
        token: idToken,
        name: profile.getName(),
        email: profile.getEmail(),
        avatar: profile.getImageUrl()
      };

      setLoading(true);
      const result = await login(null, null, socialLoginData);

      if (result.success) {
        toast.success('Successfully registered with Google!');
        navigate('/');
      } else {
        toast.error(result.message || 'Google registration failed');
      }
    } catch (error) {
      console.error('Google registration error:', error);
      toast.error('Google registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookRegister = async (response) => {
    console.log('Facebook response:', response); // Debug log

    if (response.accessToken) {
      try {
        const socialLoginData = {
          provider: 'facebook',
          token: response.accessToken,
          name: response.name,
          email: response.email,
          avatar: response.picture?.data?.url
        };

        console.log('Facebook login data:', socialLoginData); // Debug log

        setLoading(true);
        const result = await login(null, null, socialLoginData);

        if (result.success) {
          toast.success('Successfully registered with Facebook!');
          navigate('/');
        } else {
          toast.error(result.message || 'Facebook registration failed');
        }
      } catch (error) {
        console.error('Facebook registration error:', error);
        toast.error('Facebook registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      console.log('Facebook registration cancelled or failed:', response);
      if (response.status && response.status !== 'unknown') {
        toast.error('Facebook registration failed. Please try again.');
      }
    }
  };

  const handleFacebookError = (error) => {
    console.error('Facebook registration error:', error);
    toast.error('Facebook registration failed. Please try again.');
  };

  return (
    <section className="auth-section">
      <div className="container">
        <div className="auth-container">
          <div className="auth-image">
            <img src="/images/register-illustration.svg" alt="Register" />
          </div>

          <div className="auth-form-container">
            <h2>Create Account</h2>
            <p>Join our marketplace to buy and sell Free Fire accounts</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter your full name"
                  required
                />
              </div>

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
                <label htmlFor="phone">Phone Number (Optional)</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={handleChange}
                  className={`form-control ${phoneError ? 'error' : ''}`}
                  placeholder="Enter your 10-digit phone number"
                  maxLength="10"
                />
                {phoneError && <small className="error-text">{phoneError}</small>}
                <small className="form-text">Optional: 10 digits only</small>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={location}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Your city/town"
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
                  placeholder="Create a password"
                  minLength="6"
                  required
                />
                <small className="form-text">Password must be at least 6 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Confirm your password"
                  minLength="6"
                  required
                />
              </div>

              <div className="form-group terms">
                <input type="checkbox" id="terms" required />
                <label htmlFor="terms">
                  I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="auth-social">
              <p>Or sign up with</p>
              <div className="social-buttons">
                <button className="btn btn-social google" onClick={handleGoogleRegister}>
                  <i className="fab fa-google"></i> Google
                </button>
                <FacebookLogin
                  appId={process.env.REACT_APP_FACEBOOK_APP_ID}
                  autoLoad={false}
                  fields="name,email,picture"
                  callback={handleFacebookRegister}
                  onFailure={handleFacebookError}
                  disableMobileRedirect={true}
                  isMobile={false}
                  render={renderProps => (
                    <button
                      className="btn btn-social facebook"
                      onClick={renderProps.onClick}
                      disabled={renderProps.disabled || !process.env.REACT_APP_FACEBOOK_APP_ID}
                    >
                      <i className="fab fa-facebook-f"></i> Facebook
                    </button>
                  )}
                />
              </div>
            </div>

            <div className="auth-footer">
              <p>
                Already have an account? <Link to="/login">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterPage;
