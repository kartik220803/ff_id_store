import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/layout/Spinner';
import { toast } from 'react-toastify';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/products/${id}`);
        setProduct(response.data.data);
        
        // Fetch seller info
        const sellerResponse = await axios.get(`/api/users/${response.data.data.seller}`);
        setSeller(sellerResponse.data.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product. Please try again later.');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleImageClick = (index) => {
    setActiveImage(index);
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await axios.delete(`/api/products/${id}`);
      toast.success('Product deleted successfully');
      navigate('/products');
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Failed to delete product');
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
              
              {product.sold && <div className="sold-badge large">SOLD</div>}
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
                <span className="meta-label">Brand:</span>
                <span className="meta-value">{product.brand}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Model:</span>
                <span className="meta-value">{product.model}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Condition:</span>
                <span className="meta-value">{product.condition}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Age:</span>
                <span className="meta-value">{product.age}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Storage:</span>
                <span className="meta-value">{product.storage}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Color:</span>
                <span className="meta-value">{product.color}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Warranty:</span>
                <span className="meta-value">{product.warranty}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Location:</span>
                <span className="meta-value">{product.location}</span>
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
                  <div className="seller-avatar">
                    <img src={seller.avatar} alt={seller.name} />
                  </div>
                  <div className="seller-meta">
                    <h4>{seller.name}</h4>
                    <p>Location: {seller.location}</p>
                    <p>Member since: {new Date(seller.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="contact-seller">
                  {!isOwner && (
                    <>
                      <h4>Interested in this phone?</h4>
                      <div className="contact-buttons">
                        <a 
                          href={`tel:${seller.phone}`}
                          className="btn btn-primary btn-contact"
                        >
                          <i className="fas fa-phone"></i> Call Seller
                        </a>
                        <a 
                          href={`mailto:${seller.email}?subject=Inquiry about ${product.title}`}
                          className="btn btn-outline btn-contact"
                        >
                          <i className="fas fa-envelope"></i> Email Seller
                        </a>
                        <a 
                          href={`https://wa.me/${seller.phone.replace(/\D/g,'')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-success btn-contact"
                        >
                          <i className="fab fa-whatsapp"></i> WhatsApp
                        </a>
                      </div>
                    </>
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
                        await axios.patch(`/api/products/${product._id}`, { sold: true });
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
        
        {/* Related Products Section */}
        {/* This would require an additional API call to fetch related products */}
      </div>
    </section>
  );
};

export default ProductDetailPage;
