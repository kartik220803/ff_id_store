import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [dashboardStats, setDashboardStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [comments, setComments] = useState([]);
    const [offers, setOffers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchDashboardStats();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'products') {
            fetchProducts();
        } else if (activeTab === 'comments') {
            fetchComments();
        } else if (activeTab === 'offers') {
            fetchOffers();
        } else if (activeTab === 'transactions') {
            fetchTransactions();
        }
    }, [activeTab]);

    // Check if user is admin
    if (user?.role !== 'admin') {
        return (
            <div className="admin-access-denied">
                <h2>Access Denied</h2>
                <p>You don't have permission to access this page.</p>
            </div>
        );
    }

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/dashboard/stats');
            setDashboardStats(response.data.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users');
            setUsers(response.data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/products');
            setProducts(response.data.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/comments');
            setComments(response.data.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/offers');
            setOffers(response.data.data);
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/transactions');
            setTransactions(response.data.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/admin/users/${userId}`);
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const deleteProduct = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/admin/products/${productId}`);
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };

    const updateProductLikes = async (productId, likesCount) => {
        try {
            await api.patch(`/admin/products/${productId}/likes`, { likesCount });
            fetchProducts();
        } catch (error) {
            console.error('Error updating product likes:', error);
        }
    };

    const deleteComment = async (commentId) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                await api.delete(`/admin/comments/${commentId}`);
                fetchComments();
            } catch (error) {
                console.error('Error deleting comment:', error);
            }
        }
    };

    const renderDashboard = () => (
        <div className="admin-dashboard-stats">
            <h3>Dashboard Overview</h3>
            {dashboardStats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <h4>Total Users</h4>
                        <p>{dashboardStats.stats.totalUsers}</p>
                    </div>
                    <div className="stat-card">
                        <h4>Total Products</h4>
                        <p>{dashboardStats.stats.totalProducts}</p>
                    </div>
                    <div className="stat-card">
                        <h4>Sold Products</h4>
                        <p>{dashboardStats.stats.soldProducts}</p>
                    </div>
                    <div className="stat-card">
                        <h4>Total Orders</h4>
                        <p>{dashboardStats.stats.totalOrders}</p>
                    </div>
                    <div className="stat-card">
                        <h4>Total Revenue</h4>
                        <p>₹{dashboardStats.stats.revenue.totalRevenue}</p>
                    </div>
                </div>
            )}
        </div>
    );

    const renderUsers = () => (
        <div className="admin-users">
            <h3>User Management</h3>
            <div className="users-table">
                {users.map(user => (
                    <div key={user._id} className="user-item">
                        <div className="user-info">
                            <h4>{user.name}</h4>
                            <p>{user.email}</p>
                            <p>Role: {user.role}</p>
                            <p>Verified: {user.isVerified ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="user-actions">
                            <button
                                onClick={() => deleteUser(user._id)}
                                className="btn btn-danger"
                                disabled={user.role === 'admin'}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderProducts = () => (
        <div className="admin-products">
            <h3>Product Management</h3>
            <div className="products-table">
                {products.map(product => (
                    <div key={product._id} className="product-item">
                        <div className="product-info">
                            <h4>{product.title}</h4>
                            <p>Price: ₹{product.price}</p>
                            <p>Seller: {product.seller?.name}</p>
                            <p>Likes: {product.socialStats?.likesCount || 0}</p>
                            <p>Status: {product.sold ? 'Sold' : 'Available'}</p>
                        </div>
                        <div className="product-actions">
                            <input
                                type="number"
                                placeholder="New likes count"
                                onBlur={(e) => {
                                    if (e.target.value) {
                                        updateProductLikes(product._id, parseInt(e.target.value));
                                    }
                                }}
                            />
                            <button
                                onClick={() => deleteProduct(product._id)}
                                className="btn btn-danger"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderComments = () => (
        <div className="admin-comments">
            <h3>Comment Management</h3>
            <div className="comments-table">
                {comments.map(comment => (
                    <div key={comment._id} className="comment-item">
                        <div className="comment-info">
                            <h4>User: {comment.user?.name}</h4>
                            <p>Product: {comment.product?.title}</p>
                            <p>Content: {comment.content || comment.comment}</p>
                            <p>Admin Comment: {comment.isAdminComment ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="comment-actions">
                            <button
                                onClick={() => deleteComment(comment._id)}
                                className="btn btn-danger"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderOffers = () => (
        <div className="admin-offers">
            <h3>Offers Management</h3>
            <div className="offers-table">
                {offers.map(offer => (
                    <div key={offer._id} className="offer-item">
                        <div className="offer-info">
                            <h4>Product: {offer.product?.title}</h4>
                            <p>Buyer: {offer.buyer?.name}</p>
                            <p>Amount: ₹{offer.amount}</p>
                            <p>Status: {offer.status}</p>
                            <p>Date: {new Date(offer.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderTransactions = () => (
        <div className="admin-transactions">
            <h3>Transaction Management</h3>
            <div className="transactions-table">
                {transactions.map(transaction => (
                    <div key={transaction._id} className="transaction-item">
                        <div className="transaction-info">
                            <h4>Order ID: {transaction._id.slice(-8)}</h4>
                            <p>Product: {transaction.product?.title}</p>
                            <p>Buyer: {transaction.buyer?.name}</p>
                            <p>Seller: {transaction.seller?.name}</p>
                            <p>Amount: ₹{transaction.totalAmount}</p>
                            <p>Status: {transaction.status}</p>
                            <p>Date: {new Date(transaction.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h2>Admin Dashboard</h2>
                <p>Welcome, {user?.name}</p>
            </div>

            <div className="admin-nav">
                <button
                    className={activeTab === 'dashboard' ? 'active' : ''}
                    onClick={() => setActiveTab('dashboard')}
                >
                    Dashboard
                </button>
                <button
                    className={activeTab === 'users' ? 'active' : ''}
                    onClick={() => setActiveTab('users')}
                >
                    Users
                </button>
                <button
                    className={activeTab === 'products' ? 'active' : ''}
                    onClick={() => setActiveTab('products')}
                >
                    Products
                </button>
                <button
                    className={activeTab === 'comments' ? 'active' : ''}
                    onClick={() => setActiveTab('comments')}
                >
                    Comments
                </button>
                <button
                    className={activeTab === 'offers' ? 'active' : ''}
                    onClick={() => setActiveTab('offers')}
                >
                    Offers
                </button>
                <button
                    className={activeTab === 'transactions' ? 'active' : ''}
                    onClick={() => setActiveTab('transactions')}
                >
                    Transactions
                </button>
            </div>

            <div className="admin-content">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <>
                        {activeTab === 'dashboard' && renderDashboard()}
                        {activeTab === 'users' && renderUsers()}
                        {activeTab === 'products' && renderProducts()}
                        {activeTab === 'comments' && renderComments()}
                        {activeTab === 'offers' && renderOffers()}
                        {activeTab === 'transactions' && renderTransactions()}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
