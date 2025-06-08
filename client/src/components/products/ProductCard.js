import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <Link to={`/products/${product._id}`}>
        <div className="product-image">
          {product.images && product.images.length > 0 ? (
            <img src={product.images[0].url} alt={product.title} />
          ) : (
            <div className="no-image">
              <i className="fas fa-mobile-alt"></i>
              <p>No image</p>
            </div>
          )}
          {product.sold && <div className="sold-badge">SOLD</div>}
          {product.featured && <div className="featured-badge">FEATURED</div>}
        </div>
        
        <div className="product-info">
          <h3 className="product-title">{product.title}</h3>
          <p className="product-price">₹{product.price.toLocaleString()}</p>
          <div className="product-meta">
            <span className="product-brand">{product.brand}</span>
            <span className="product-condition">{product.condition}</span>
          </div>
          <div className="product-location">
            <i className="fas fa-map-marker-alt"></i> {product.location}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
