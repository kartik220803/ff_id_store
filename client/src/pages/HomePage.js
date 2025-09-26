import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services';
import ProductCard from '../components/products/ProductCard';
import Spinner from '../components/layout/Spinner';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  // Temporary test: force notification count for debugging
  const displayCount = isAuthenticated ? (unreadCount > 0 ? unreadCount : 3) : 0;

  const [availableProducts, setAvailableProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        // Fetch available products (not sold)
        const availableRes = await productAPI.getAllProducts({
          status: 'available',
          limit: 12,
          sort: '-createdAt'
        });

        // Fetch featured products
        const featuredRes = await productAPI.getAllProducts({
          featured: true,
          limit: 4
        });

        // Fetch recent products
        const recentRes = await productAPI.getAllProducts({
          sort: '-createdAt',
          limit: 8
        });

        setAvailableProducts(availableRes.data.data);
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
      {/* Available Accounts Section */}
      <section className="section available-accounts-section">
        <div className="container">
          <div className="section-title">
            <h1>Available Free Fire Accounts</h1>
            <p>Discover premium Free Fire accounts ready for purchase</p>
          </div>

          {loading ? (
            <Spinner />
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              <div className="product-grid">
                {availableProducts.length > 0 ? (
                  availableProducts.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))
                ) : (
                  <div className="no-products">
                    <h3>No accounts available</h3>
                    <p>Be the first to list your Free Fire account!</p>
                  </div>
                )}
              </div>

              {availableProducts.length > 0 && (
                <div className="text-center mt-2">
                  <Link to="/products" className="btn btn-outline">View All Accounts</Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="section featured-section">
        <div className="container">
          <div className="section-title">
            <h2>Featured Deals</h2>
            <p>Premium Free Fire accounts with the best value</p>
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
            <p>Simple steps to buy or sell your Free Fire account</p>
          </div>

          <div className="steps-container">
            <div className="step">
              <div className="step-icon">
                <i className="fas fa-gamepad"></i>
              </div>
              <h3>List Your Account</h3>
              <p>Create an account and list your Free Fire account with screenshots and details</p>
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
              <h3>Complete the Sale</h3>
              <p>Finalize the transaction safely and securely transfer your account</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="section recent-section">
        <div className="container">
          <div className="section-title">
            <h2>Recent Listings</h2>
            <p>Latest Free Fire accounts added to our marketplace</p>
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
            <h2>Ready to Buy or Sell Your Free Fire Account?</h2>
            <p>Join our community of buyers and sellers today!</p>
            <Link to="/register" className="btn btn-primary btn-lg">Get Started Now</Link>
          </div>
        </div>
      </section>

      {/* Fixed Circular Sell Button */}
      <Link to="/products/add" className="fixed-sell-btn" title="Sell Your Account">
        <i className="fas fa-plus"></i>
        <span>Sell</span>
        {displayCount > 0 && (
          <span className="notification-dot">{displayCount > 9 ? '9+' : displayCount}</span>
        )}
      </Link>
    </>
  );
};

export default HomePage;
