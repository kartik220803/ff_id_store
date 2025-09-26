import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { productAPI } from '../../services';

const MyProductCard = ({ product, onUpdate, onDelete }) => {
    const navigate = useNavigate();
    const [showActions, setShowActions] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleEdit = (e) => {
        e.preventDefault();
        navigate(`/products/edit/${product._id}`);
    };

    const handleDelete = async (e) => {
        e.preventDefault();

        if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            await productAPI.deleteProduct(product._id);
            toast.success('Product deleted successfully');
            if (onDelete) {
                onDelete(product._id);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSold = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            const response = await productAPI.updateProduct(product._id, {
                sold: !product.sold
            });

            toast.success(`Product marked as ${!product.sold ? 'sold' : 'available'}`);
            if (onUpdate) {
                onUpdate(response.data.data);
            }
        } catch (error) {
            console.error('Error updating product status:', error);
            toast.error('Failed to update product status');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (e) => {
        e.preventDefault();
        navigate(`/products/${product._id}`);
    };

    return (
        <div className={`product-card my-product-card ${product.sold ? 'product-sold' : ''}`}>
            <div className="product-card-link">
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

                    {/* Owner Actions Menu */}
                    <div className="owner-actions">
                        <button
                            className="actions-toggle"
                            onClick={() => setShowActions(!showActions)}
                            disabled={loading}
                        >
                            <i className="fas fa-ellipsis-v"></i>
                        </button>

                        {showActions && (
                            <div className="actions-menu">
                                <button onClick={handleEdit} className="action-item edit">
                                    <i className="fas fa-edit"></i> Edit
                                </button>
                                <button
                                    onClick={handleToggleSold}
                                    className={`action-item ${product.sold ? 'mark-available' : 'mark-sold'}`}
                                    disabled={loading}
                                >
                                    <i className={`fas ${product.sold ? 'fa-redo' : 'fa-check'}`}></i>
                                    {product.sold ? 'Mark Available' : 'Mark Sold'}
                                </button>
                                <button onClick={handleDelete} className="action-item delete" disabled={loading}>
                                    <i className="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        )}
                    </div>
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
                        <span className="account-level">
                            <i className="fas fa-trophy"></i> Level {product.level}
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
            </div>

            {/* Owner Action Buttons */}
            <div className="product-actions owner-actions-bar">
                <button
                    className="btn btn-edit"
                    onClick={handleEdit}
                    disabled={loading}
                >
                    <i className="fas fa-edit"></i>
                    Edit
                </button>
                <button
                    className="btn btn-view"
                    onClick={handleViewDetails}
                >
                    <i className="fas fa-eye"></i>
                    View
                </button>
                <button
                    className={`btn ${product.sold ? 'btn-available' : 'btn-sold'}`}
                    onClick={handleToggleSold}
                    disabled={loading}
                >
                    <i className={`fas ${product.sold ? 'fa-redo' : 'fa-check'}`}></i>
                    {product.sold ? 'Available' : 'Sold'}
                </button>
            </div>
        </div>
    );
};

export default MyProductCard;
