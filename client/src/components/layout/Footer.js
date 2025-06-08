import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo">
            <h2>Mobile Market</h2>
            <p>Buy and sell second-hand smartphones with ease</p>
          </div>
          
          <div className="footer-links">
            <div className="footer-link-group">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/products">Browse Phones</Link></li>
                <li><Link to="/products/add">Sell Phone</Link></li>
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
              <h4>Popular Brands</h4>
              <ul>
                <li><Link to="/products?brand=Apple">Apple</Link></li>
                <li><Link to="/products?brand=Samsung">Samsung</Link></li>
                <li><Link to="/products?brand=Google">Google</Link></li>
                <li><Link to="/products?brand=OnePlus">OnePlus</Link></li>
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
          <p>&copy; {new Date().getFullYear()} Mobile Market. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
