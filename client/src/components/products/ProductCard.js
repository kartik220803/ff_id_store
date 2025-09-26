import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ProductCard = ({ product, onUpdate }) => {
  const navigate = useNavigate();

  const handlePurchase = (e) => {
    e.preventDefault();
    navigate(`/products/${product._id}`);
  };

  const handleMakeOffer = (e) => {
    e.preventDefault();
    navigate(`/products/${product._id}`);
  };

  return (
    <div className={`product-card ${product.sold ? 'product-sold' : ''}`}>
      <Link to={`/products/${product._id}`} className="product-card-link">
        <div className="product-image">
          {product.images && product.images.length > 0 ? (
            <img src={product.images[0].url} alt={product.title} />
          ) : (
            <div className="no-image">
              <i className="fas fa-gamepad"></i>
              <p>No image</p>
            </div>
          )}

          {/* Status Badge - Available/Sold */}
          <div className={`status-badge ${product.sold ? 'status-sold' : 'status-available'}`}>
            {product.sold ? 'SOLD' : 'AVAILABLE'}
          </div>

          {product.featured && <div className="featured-badge">FEATURED</div>}
        </div>

        <div className="product-info">
          <h3 className="product-title">{product.title}</h3>
          <p className="product-price">₹{product.price.toLocaleString()}</p>
          <div className="product-meta">
            <span className="account-level">
              <i className="fas fa-trophy"></i> Level {product.level}
            </span>
            <span className="account-diamonds">
              <i className="fas fa-gem"></i> {product.diamonds?.toLocaleString()} Diamonds
            </span>
          </div>
          <div className="account-details">
            <span className="account-uid">
              <i className="fas fa-id-card"></i> UID: {product.uid}
            </span>
            <span className="account-verification">
              <i className={`fas ${product.twoStepVerification === 'Enabled' ? 'fa-shield-alt' : 'fa-shield'}`}></i>
              2FA: {product.twoStepVerification}
            </span>
          </div>

          {/* Social Stats */}
          <div className="social-stats">
            <span className="stat-item">
              <i className="fas fa-heart"></i> {product.socialStats?.likesCount || product.likes?.length || 0}
            </span>
            <span className="stat-item">
              <i className="fas fa-eye"></i> {product.socialStats?.viewsCount || product.views || 0}
            </span>
            <span className="stat-item">
              <i className="fas fa-comment"></i> {product.socialStats?.commentsCount || product.commentsCount || 0}
            </span>
          </div>
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="product-actions">
        <button
          className="btn btn-purchase"
          onClick={handlePurchase}
          disabled={product.sold}
        >
          <i className="fas fa-shopping-cart"></i>
          Purchase
        </button>
        <button
          className="btn btn-offer"
          onClick={handleMakeOffer}
          disabled={product.sold}
        >
          <i className="fas fa-handshake"></i>
          Make Offer
        </button>
        <Link
          to={`/products/${product._id}`}
          className="btn btn-details"
        >
          <i className="fas fa-info-circle"></i>
          Show Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
