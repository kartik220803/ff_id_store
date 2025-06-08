import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const { email, password } = formData;
  
  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      await login(formData);
      toast.success('Login successful!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
            <img src="/images/login-illustration.svg" alt="Login" />
          </div>
          
          <div className="auth-form-container">
            <h2>Welcome Back</h2>
            <p>Sign in to access your account</p>
            
            <form className="auth-form" onSubmit={handleSubmit}>
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
