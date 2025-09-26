import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productAPI } from '../services';
import api from '../services/api';
import Spinner from '../components/layout/Spinner';
import Avatar from '../components/common/Avatar';
import SocialActions from '../components/products/SocialActions';
import Comments from '../components/products/Comments';
import { toast } from 'react-toastify';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching product with ID:', id);

        if (!id) {
          throw new Error('No product ID provided');
        }

        const response = await productAPI.getProduct(id);
        console.log('Product API response:', response);

        if (!response || !response.data) {
          throw new Error('Invalid response: no data received');
        }

        if (!response.data.success) {
          throw new Error(response.data.message || 'API returned success: false');
        }

        if (!response.data.data) {
          throw new Error('No product data in response');
        }

        const productData = response.data.data;
        console.log('Product data:', productData);

        setProduct(productData);

        // Check if seller info is populated
        if (productData.seller) {
          setSeller(productData.seller);
          console.log('Seller data:', productData.seller);
        } else {
          console.warn('No seller data found in product');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching product:', err);

        let errorMessage = 'Failed to load product. Please try again later.';

        if (err.response) {
          console.error('API Error Response:', err.response.data);
          console.error('API Error Status:', err.response.status);
          errorMessage = err.response.data?.message || `API Error: ${err.response.status}`;
        } else if (err.request) {
          console.error('Network Error:', err.request);
          errorMessage = 'Network error. Please check your connection.';
        } else {
          console.error('Error:', err.message);
          errorMessage = err.message;
        }

        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleImageClick = (index) => {
    setActiveImage(index);
  }; const handlePurchase = async () => {
    const token = localStorage.getItem('token');
    console.log('Purchase clicked - token exists:', !!token, 'isAuthenticated:', isAuthenticated, 'user:', !!user);

    if (!token) {
      console.log('No token found, redirecting to login');
      toast.error('Please log in to make a purchase');
      navigate('/login');
      return;
    }

    if (window.confirm(`Are you sure you want to purchase ${product.title} for ₹${product.price.toLocaleString()}?`)) {
      try {
        setActionLoading(true);
        console.log('Making purchase API call...');
        await api.post('/orders', {
          productId: product._id,
          buyerNotes: 'Direct purchase'
        });

        toast.success('Purchase request successful! Wait for owner to accept.');
        // Refresh product data
        const response = await productAPI.getProduct(id);
        if (response.data && response.data.data) {
          setProduct(response.data.data);
        }

      } catch (error) {
        console.error('Purchase error:', error);
        if (error.response?.status === 401) {
          toast.error('Your session has expired. Please log in again.');
          navigate('/login');
        } else {
          const errorMessage = error.response?.data?.message || error.message || 'Purchase failed. Please try again.';
          toast.error(errorMessage);
        }
      } finally {
        setActionLoading(false);
      }
    }
  }; const handleMakeOffer = () => {
    const token = localStorage.getItem('token');
    console.log('Make offer clicked - token exists:', !!token, 'isAuthenticated:', isAuthenticated, 'user:', !!user);

    if (!token) {
      console.log('No token found, redirecting to login');
      toast.error('Please log in to make an offer');
      navigate('/login');
      return;
    }

    setShowOfferModal(true);
  };

  const submitOffer = async () => {
    if (!offerAmount || offerAmount <= 0) {
      toast.error('Please enter a valid offer amount');
      return;
    }

    if (offerAmount >= product.price) {
      toast.error('Offer amount should be less than the listing price. Consider purchasing directly instead.');
      return;
    }

    try {
      setActionLoading(true);
      await api.post('/offers', {
        productId: product._id,
        amount: parseInt(offerAmount),
        message: offerMessage
      });

      toast.success('Offer submitted successfully! The seller will be notified.');
      setShowOfferModal(false);
      setOfferAmount('');
      setOfferMessage('');

    } catch (error) {
      console.error('Offer error:', error);
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.error || 'Failed to submit offer. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productAPI.deleteProduct(id);
      toast.success('Product deleted successfully');
      navigate('/products');
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Failed to delete product');
    }
  };

  // Handle offer amount change with validation
  const handleOfferAmountChange = (value) => {
    const numValue = parseInt(value);
    if (numValue > product.price - 1) {
      setOfferAmount(product.price - 1);
      toast.warning(`Offer amount cannot exceed ₹${(product.price - 1).toLocaleString()}`);
    } else if (numValue < 1) {
      setOfferAmount(1);
    } else {
      setOfferAmount(value);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (error || !product) {
    return (
      <div className="container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'Product not found'}</p>
          <Link to="/products" className="btn btn-primary">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user && seller && user._id === seller._id;

  return (
    <section className="product-detail-page">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/products">Products</Link> / {product.title}
        </div>

        <div className="product-detail">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[activeImage].url}
                  alt={product.title}
                />
              ) : (
                <div className="no-image large">
                  <i className="fas fa-mobile-alt"></i>
                  <p>No image available</p>
                </div>
              )}

              {/* Status Badge - Available/Sold */}
              <div className={`status-badge large ${product.sold ? 'status-sold' : 'status-available'}`}>
                {product.sold ? 'SOLD' : 'AVAILABLE'}
              </div>

              {product.featured && <div className="featured-badge large">FEATURED</div>}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="image-thumbnails">
                {product.images.map((image, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${activeImage === index ? 'active' : ''}`}
                    onClick={() => handleImageClick(index)}
                  >
                    <img src={image.url} alt={`${product.title} ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}

            {product.videos && product.videos.length > 0 && (
              <div className="product-videos">
                <h3>Product Videos</h3>
                <div className="video-container">
                  {product.videos.map((video, index) => (
                    <div key={index} className="video-player">
                      <video controls>
                        <source src={video.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info-container">
            <div className="product-header">
              <h1>{product.title}</h1>
              <p className="product-price">₹{product.price.toLocaleString()}</p>
            </div>

            <div className="product-meta">
              <div className="meta-item">
                <span className="meta-label">UID:</span>
                <span className="meta-value account-uid-detail">{product.uid}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Level:</span>
                <span className="meta-value">{product.level}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Diamonds:</span>
                <span className="meta-value">{product.diamonds?.toLocaleString()}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Level:</span>
                <span className="meta-value">{product.level}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Login Method:</span>
                <span className="meta-value">{product.loginMethod}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">2-Step Verification:</span>
                <span className="meta-value">{product.twoStepVerification}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Status:</span>
                <span className={`meta-value status-indicator ${product.sold ? 'status-sold' : 'status-available'}`}>
                  {product.sold ? 'SOLD' : 'AVAILABLE'}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Listed on:</span>
                <span className="meta-value">{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            {/* Seller Information */}
            {seller && (
              <div className="seller-info">
                <h3>Seller Information</h3>
                <div className="seller-details">
                  <Avatar
                    src={seller.avatar}
                    alt={seller.name}
                    size="medium"
                    className="seller-avatar gaming-glow"
                  />
                  <div className="seller-meta">
                    <h4>{seller.name}</h4>
                    <p>Location: {seller.location}</p>
                    <p>Member since: {(() => {
                      if (!seller.createdAt) return 'Unknown';

                      try {
                        const date = new Date(seller.createdAt);
                        if (isNaN(date.getTime())) return 'Unknown';

                        return date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      } catch (error) {
                        console.error('Error formatting seller date:', error);
                        return 'Unknown';
                      }
                    })()}</p>
                  </div>
                </div>

                <div className="product-actions-detail">
                  {!isOwner && !product.sold && (
                    <>
                      <h4>Interested in this account?</h4>
                      <div className="action-buttons">
                        <button
                          className="btn btn-purchase"
                          onClick={handlePurchase}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-shopping-cart"></i>
                          {actionLoading ? 'Processing...' : 'Purchase'}
                        </button>
                        <button
                          className="btn btn-offer"
                          onClick={handleMakeOffer}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-handshake"></i>
                          Make Offer
                        </button>
                        <Link
                          to="/products"
                          className="btn btn-details"
                        >
                          <i className="fas fa-list"></i>
                          Browse More
                        </Link>
                      </div>
                    </>
                  )}
                  {product.sold && (
                    <div className="sold-notice">
                      <h4>This account has been sold</h4>
                      <Link to="/products" className="btn btn-details">
                        <i className="fas fa-list"></i>
                        Browse Other Accounts
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Owner Actions */}
            {isOwner && !product.sold && (
              <div className="owner-actions">
                <h3>Manage Your Listing</h3>
                <div className="action-buttons">
                  <Link to={`/products/edit/${product._id}`} className="btn btn-primary">
                    <i className="fas fa-edit"></i> Edit Listing
                  </Link>
                  <button
                    onClick={handleDeleteProduct}
                    className="btn btn-danger"
                  >
                    <i className="fas fa-trash"></i> Delete Listing
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await productAPI.updateProduct(product._id, { sold: true });
                        setProduct({ ...product, sold: true });
                        toast.success('Product marked as sold');
                      } catch (err) {
                        toast.error('Failed to update product status');
                      }
                    }}
                    className="btn btn-success"
                  >
                    <i className="fas fa-check-circle"></i> Mark as Sold
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Social Features */}
        <SocialActions product={product} onUpdate={setProduct} />
        <Comments productId={product._id} />

        {/* Related Products Section */}
        {/* This would require an additional API call to fetch related products */}
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="modal-overlay" onClick={() => setShowOfferModal(false)}>
          <div className="modal-content offer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Make an Offer</h3>
              <button
                className="modal-close"
                onClick={() => setShowOfferModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body scrollable-modal-body">
              <div className="offer-product-info">
                <h4>{product.title}</h4>
                <p className="listing-price">Listed Price: ₹{product.price.toLocaleString()}</p>
              </div>

              <div className="form-group">
                <label htmlFor="offerAmount">Your Offer Amount (₹)</label>
                <div className="offer-amount-controls">
                  <input
                    type="number"
                    id="offerAmount"
                    className="form-control offer-amount-input"
                    value={offerAmount}
                    onChange={(e) => handleOfferAmountChange(e.target.value)}
                    placeholder="Enter your offer amount"
                    min="1"
                    max={product.price - 1}
                  />
                  <div className="slider-container">
                    <input
                      type="range"
                      className="offer-amount-slider"
                      value={offerAmount || 0}
                      onChange={(e) => handleOfferAmountChange(e.target.value)}
                      min="1"
                      max={product.price - 1}
                      step="10"
                    />
                    <div className="slider-labels">
                      <span>₹1</span>
                      <span>₹{Math.floor((product.price - 1) / 2).toLocaleString()}</span>
                      <span>₹{(product.price - 1).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <small className="form-text">
                  Offer should be less than ₹{product.price.toLocaleString()}
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="offerMessage">Message (Optional)</label>
                <textarea
                  id="offerMessage"
                  className="form-control offer-message-textarea"
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Add a message to the seller..."
                  rows="2"
                  maxLength="500"
                  style={{
                    minHeight: '60px',
                    resize: 'none',
                    overflow: 'hidden'
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.max(60, e.target.scrollHeight) + 'px';
                  }}
                />
                <small className="form-text">
                  {offerMessage.length}/500 characters
                </small>
              </div>
            </div>

            <div className="modal-footer fixed-modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowOfferModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={submitOffer}
                disabled={actionLoading || !offerAmount}
              >
                {actionLoading ? 'Submitting...' : 'Submit Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductDetailPage;
