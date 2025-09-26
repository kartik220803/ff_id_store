import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo">
            <h2>FF-ID-STORE</h2>
            <p>Buy and sell Free Fire accounts with ease</p>
          </div>

          <div className="footer-links">
            <div className="footer-link-group">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/products">Browse Accounts</Link></li>
                <li><Link to="/products/add">Sell Account</Link></li>
                <li><Link to="/login">Login</Link></li>
              </ul>
            </div>

            <div className="footer-link-group">
              <h4>Support</h4>
              <ul>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>

            <div className="footer-link-group">
              <h4>Popular Ranks</h4>
              <ul>
                <li><Link to="/products?rank=Diamond">Diamond</Link></li>
                <li><Link to="/products?rank=Crown">Crown</Link></li>
                <li><Link to="/products?rank=Ace">Ace</Link></li>
                <li><Link to="/products?rank=Conqueror">Conqueror</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-social">
            <h4>Connect With Us</h4>
            <div className="social-icons">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} FF-ID-STORE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
