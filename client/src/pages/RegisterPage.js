import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

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
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const { name, email, phone, location, password, confirmPassword } = formData;
  
  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async e => {
    e.preventDefault();
    
    // Validate form
    if (!name || !email || !phone || !location || !password) {
      toast.error('Please fill in all fields');
      return;
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
      toast.success('Registration successful!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
            <p>Join our marketplace to buy and sell phones</p>
            
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
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter your phone number"
                  required
                />
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
                <button className="btn btn-outline btn-social">
                  <i className="fab fa-google"></i> Google
                </button>
                <button className="btn btn-outline btn-social">
                  <i className="fab fa-facebook-f"></i> Facebook
                </button>
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
