import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/products/ProductCard';
import Spinner from '../components/layout/Spinner';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch featured products
        const featuredRes = await axios.get('/api/products?featured=true&limit=4');
        
        // Fetch recent products
        const recentRes = await axios.get('/api/products?sort=-createdAt&limit=8');
        
        setFeaturedProducts(featuredRes.data.data);
        setRecentProducts(recentRes.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Buy and Sell Mobile Phones with Confidence</h1>
            <p>Find the perfect second-hand smartphone or sell your old one at the best price</p>
            <div className="hero-buttons">
              <Link to="/products" className="btn btn-primary btn-lg">Browse Phones</Link>
              <Link to="/products/add" className="btn btn-secondary btn-lg">Sell Your Phone</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section featured-section">
        <div className="container">
          <div className="section-title">
            <h2>Featured Deals</h2>
            <p>Handpicked phones with the best value</p>
          </div>

          {error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="product-grid">
              {featuredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-2">
            <Link to="/products?featured=true" className="btn btn-outline">View All Featured</Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section how-it-works">
        <div className="container">
          <div className="section-title">
            <h2>How It Works</h2>
            <p>Simple steps to buy or sell your smartphone</p>
          </div>

          <div className="steps-container">
            <div className="step">
              <div className="step-icon">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h3>List Your Phone</h3>
              <p>Create an account and list your smartphone with photos and details</p>
            </div>
            
            <div className="step">
              <div className="step-icon">
                <i className="fas fa-comments"></i>
              </div>
              <h3>Connect with Buyers</h3>
              <p>Receive inquiries and negotiate directly with potential buyers</p>
            </div>
            
            <div className="step">
              <div className="step-icon">
                <i className="fas fa-handshake"></i>
              </div>
              <h3>Sell with Confidence</h3>
              <p>Complete the transaction safely and get paid for your device</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="section recent-section">
        <div className="container">
          <div className="section-title">
            <h2>Recent Listings</h2>
            <p>Latest smartphones added to our marketplace</p>
          </div>

          {error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="product-grid">
              {recentProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-2">
            <Link to="/products" className="btn btn-outline">View All Listings</Link>
          </div>
        </div>
      </section>

      {/* Testimonials/Trust Section */}
      <section className="section trust-section">
        <div className="container">
          <div className="section-title">
            <h2>Why Choose Us</h2>
            <p>Join thousands of satisfied users who buy and sell on our platform</p>
          </div>

          <div className="trust-points">
            <div className="trust-point">
              <i className="fas fa-shield-alt"></i>
              <h3>Secure Transactions</h3>
              <p>Our platform ensures safety and security for all transactions</p>
            </div>
            
            <div className="trust-point">
              <i className="fas fa-check-circle"></i>
              <h3>Verified Listings</h3>
              <p>All our listings are verified for authenticity</p>
            </div>
            
            <div className="trust-point">
              <i className="fas fa-tag"></i>
              <h3>Best Prices</h3>
              <p>Get the best value for your money when buying or selling</p>
            </div>
            
            <div className="trust-point">
              <i className="fas fa-headset"></i>
              <h3>Customer Support</h3>
              <p>Our team is always ready to assist you with any issues</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Buy or Sell Your Smartphone?</h2>
            <p>Join our community of buyers and sellers today!</p>
            <Link to="/register" className="btn btn-primary btn-lg">Get Started Now</Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
