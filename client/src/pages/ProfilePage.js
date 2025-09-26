import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { toast } from 'react-toastify';
import { authAPI, productAPI, uploadAPI, notificationAPI, orderAPI } from '../services';
import ProductCard from '../components/products/ProductCard';
import Spinner from '../components/layout/Spinner';
import Avatar from '../components/common/Avatar';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const { unreadCount, refreshNotifications } = useNotifications();

  // Temporary test: force notification count for debugging
  const displayCount = unreadCount > 0 ? unreadCount : 3;

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    avatar: '',
    createdAt: null,
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [products, setProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'sold', 'notifications', 'settings'
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch user data and products
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Fetch full user details
        const userRes = await authAPI.getCurrentUser();

        setProfileData({
          name: userRes.data.user.name,
          email: userRes.data.user.email,
          phone: userRes.data.user.phone,
          location: userRes.data.user.location,
          avatar: userRes.data.user.avatar,
          createdAt: userRes.data.user.createdAt,
        });

        // Fetch user's products
        const productsRes = await productAPI.getUserProducts();
        setProducts(productsRes.data.data);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        toast.error('Failed to load profile data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      const response = await notificationAPI.getNotifications();
      console.log('Notifications response:', response);
      console.log('Notifications data:', response.data.data);
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    }
  };

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      if (displayCount > 0) {
        await notificationAPI.markAllAsRead();
        refreshNotifications(); // Refresh the notification count
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [displayCount, refreshNotifications]);

  // Fetch notifications when notifications tab is active
  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
      // Mark all notifications as read when user views the notifications tab
      markAllNotificationsAsRead();
    }
  }, [activeTab, markAllNotificationsAsRead]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPassword({
      ...password,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file type and size
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validImageTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPG or PNG image.');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Image size is too large. Maximum size is 2MB.');
      return;
    }

    try {
      setUploadingAvatar(true);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await uploadAPI.uploadAvatar(formData);

      setProfileData({
        ...profileData,
        avatar: response.data.avatar
      });

      // Update user in auth context
      updateUser({
        ...user,
        avatar: response.data.avatar
      });

      toast.success('Profile picture updated successfully');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast.error('Failed to update profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfileChanges = async () => {
    try {
      const response = await authAPI.updateProfile(profileData);

      // Update user in auth context
      updateUser(response.data.data);

      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = password;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      await authAPI.changePassword({
        currentPassword,
        newPassword
      });

      toast.success('Password changed successfully');

      // Clear password fields
      setPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
      return;
    }

    try {
      await authAPI.deleteAccount();
      toast.success('Your account has been deleted');
      logout();
    } catch (err) {
      console.error('Error deleting account:', err);
      toast.error('Failed to delete account');
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      // Seller notifications (receiving offers)
      offer_received: 'fa-handshake',
      purchase_request: 'fa-shopping-cart',
      new_offer: 'fa-handshake',
      purchase_offer: 'fa-shopping-cart',

      // Buyer notifications (offer responses)
      offer_sent: 'fa-paper-plane',
      offer_accepted: 'fa-check-circle',
      offer_rejected: 'fa-times-circle',
      purchase_sent: 'fa-paper-plane',
      purchase_accepted: 'fa-check-circle',
      purchase_rejected: 'fa-times-circle',

      // General notifications
      offer_expired: 'fa-clock',
      account_sold: 'fa-money-bill-wave',
      payment_received: 'fa-credit-card',
      account_delivered: 'fa-box',
      general: 'fa-bell'
    };
    return iconMap[type] || 'fa-bell';
  };

  const handleOrderAction = async (orderId, action) => {
    try {
      await orderAPI.updateOrderStatus(orderId, { status: action });

      toast.success(`Purchase request ${action} successfully`);

      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(`Failed to ${action} purchase request`);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  const activeProducts = products ? products.filter(product => !product.sold) : [];
  const soldProducts = products ? products.filter(product => product.sold) : [];

  return (
    <section className="profile-page">
      <div className="container">
        <div className="profile-header">
          <div className="profile-avatar">
            {uploadingAvatar ? (
              <div className="avatar-loading">
                <Spinner small />
              </div>
            ) : (
              <>
                <Avatar
                  src={profileData.avatar}
                  alt={profileData.name}
                  size="large"
                  className="gaming-glow"
                />
                <div className="avatar-upload">
                  <label htmlFor="avatar-input">
                    <i className="fas fa-camera"></i>
                  </label>
                  <input
                    type="file"
                    id="avatar-input"
                    onChange={handleAvatarChange}
                    accept="image/jpeg, image/png, image/jpg"
                    style={{ display: 'none' }}
                  />
                </div>
              </>
            )}
          </div>

          <div className="profile-info">
            <h1>{profileData.name}</h1>
            <p className="profile-location"><i className="fas fa-map-marker-alt"></i> {profileData.location}</p>
            <p className="profile-stats">
              <span>{activeProducts.length} Listings</span>
              <span>{soldProducts.length} Sold</span>
              <span>Member since {(() => {
                if (!profileData.createdAt) return 'Unknown';

                try {
                  const date = new Date(profileData.createdAt);
                  // Check if date is valid
                  if (isNaN(date.getTime())) return 'Unknown';

                  return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                } catch (error) {
                  console.error('Error formatting date:', error);
                  return 'Unknown';
                }
              })()}</span>
            </p>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            Active Listings ({activeProducts.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'sold' ? 'active' : ''}`}
            onClick={() => setActiveTab('sold')}
          >
            Sold Items ({soldProducts.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
            {displayCount > 0 && (
              <span className="notification-dot">{displayCount > 9 ? '9+' : displayCount}</span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Account Settings
          </button>
        </div>

        {activeTab === 'listings' && (
          <div className="profile-content">
            <div className="section-header">
              <h2>Active Listings</h2>
              <Link to="/products/add" className="btn btn-primary">
                <i className="fas fa-plus"></i> Add New Listing
              </Link>
            </div>

            {activeProducts.length === 0 ? (
              <div className="no-products">
                <div className="empty-state">
                  <i className="fas fa-mobile-alt"></i>
                  <h3>No active listings</h3>
                  <p>You don't have any active products for sale</p>
                  <Link to="/products/add" className="btn btn-primary">
                    Add Your First Product
                  </Link>
                </div>
              </div>
            ) : (
              <div className="product-grid">
                {activeProducts.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sold' && (
          <div className="profile-content">
            <div className="section-header">
              <h2>Sold Items</h2>
            </div>

            {soldProducts.length === 0 ? (
              <div className="no-products">
                <div className="empty-state">
                  <i className="fas fa-check-circle"></i>
                  <h3>No sold items yet</h3>
                  <p>Items you've marked as sold will appear here</p>
                </div>
              </div>
            ) : (
              <div className="product-grid">
                {soldProducts.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="profile-content">
            <div className="section-header">
              <h2>Notifications</h2>
            </div>
            <div className="notifications-list">
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-bell-slash"></i>
                  <h3>No notifications</h3>
                  <p>You don't have any notifications yet</p>
                </div>
              ) : (
                notifications.map(notification => {
                  console.log('Rendering notification:', notification);
                  console.log('Notification type:', notification.type);
                  console.log('Related order:', notification.relatedOrder);
                  console.log('Order status:', notification.relatedOrder?.status);

                  return (
                    <div key={notification._id} className={`notification-item ${!notification.isRead ? 'unread' : ''}`}>
                      <div className="notification-icon">
                        <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
                      </div>
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <small>{new Date(notification.createdAt).toLocaleDateString()}</small>
                      </div>
                      {/* Show Accept/Reject buttons ONLY for sellers who received offers */}
                      {(() => {
                        console.log('=== NOTIFICATION DEBUG ===');
                        console.log('Notification ID:', notification._id);
                        console.log('Notification type:', notification.type);
                        console.log('Has relatedOrder:', !!notification.relatedOrder);
                        console.log('Related order:', notification.relatedOrder);
                        console.log('Order status:', notification.relatedOrder?.status);
                        console.log('Current user ID:', user?._id);

                        // Check if notification has product info
                        console.log('Product in notification:', notification.product);
                        console.log('Product seller:', notification.product?.seller);
                        console.log('Product owner:', notification.product?.owner);
                        console.log('Product user:', notification.product?.user);

                        // Check the order details to determine buyer vs seller
                        console.log('Order buyer:', notification.relatedOrder?.buyer);
                        console.log('Order seller:', notification.relatedOrder?.seller);
                        console.log('Order user:', notification.relatedOrder?.user);

                        // Check if current user is the seller/owner of the product
                        const isProductSeller = notification.product?.seller === user?._id ||
                          notification.product?.owner === user?._id ||
                          notification.product?.user === user?._id;

                        // IMPORTANT: Check if current user is NOT the buyer who sent the offer
                        const isNotTheBuyer = notification.relatedOrder?.buyer !== user?._id &&
                          notification.relatedOrder?.user !== user?._id;

                        console.log('Is current user the product seller?', isProductSeller);
                        console.log('Is current user NOT the buyer?', isNotTheBuyer);

                        // Check if this is a notification for a seller who received an offer
                        const isOfferNotification = [
                          'offer_received',
                          'purchase_request',
                          'offer_made',
                          'purchase_offer',
                          'new_offer'
                        ].includes(notification.type);

                        const hasRelatedOrder = !!notification.relatedOrder;
                        const isPendingOrder = !notification.relatedOrder?.status || notification.relatedOrder?.status === 'pending';

                        console.log('isOfferNotification:', isOfferNotification);
                        console.log('hasRelatedOrder:', hasRelatedOrder);
                        console.log('isPendingOrder:', isPendingOrder);

                        // Show buttons ONLY if:
                        // 1. It's an offer notification AND
                        // 2. Has related order AND 
                        // 3. Order is pending AND
                        // 4. Current user is the product seller AND
                        // 5. Current user is NOT the buyer who sent the offer
                        const shouldShowButtons = isOfferNotification &&
                          hasRelatedOrder &&
                          isPendingOrder &&
                          isProductSeller &&
                          isNotTheBuyer;

                        console.log('shouldShowButtons:', shouldShowButtons);
                        console.log('=== END DEBUG ===');

                        return shouldShowButtons;
                      })() && (
                          <div className="notification-actions">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => {
                                console.log('Accept button clicked for order:', notification.relatedOrder);
                                handleOrderAction(notification.relatedOrder, 'accepted');
                              }}
                            >
                              Accept
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                console.log('Reject button clicked for order:', notification.relatedOrder);
                                handleOrderAction(notification.relatedOrder, 'rejected');
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}

                      {/* Show Payment Link for payment_link_created notifications */}
                      {notification.type === 'payment_link_created' && notification.relatedOrder && (
                        <div className="notification-actions">
                          <Link
                            to={`/payment/${notification.relatedOrder}`}
                            className="btn btn-primary btn-sm"
                          >
                            <i className="fas fa-credit-card"></i>
                            {notification.message.includes('sent to the buyer') ? 'View Payment' : 'Pay Now'}
                          </Link>
                        </div>
                      )}
                      {/* Show status for buyers who sent offers or sellers with completed transactions */}
                      {(notification.type === 'offer_accepted' || notification.type === 'offer_rejected' || notification.type === 'purchase_accepted' || notification.type === 'purchase_rejected') && (
                        <div className="notification-status">
                          <span className={`status-badge ${notification.type.includes('accepted') ? 'success' : 'danger'}`}>
                            {notification.type.includes('accepted') ? 'Accepted' : 'Rejected'}
                          </span>
                        </div>
                      )}

                      {/* Show "Offer Sent" status for buyers who sent offers */}
                      {(notification.type === 'offer_sent' || notification.type === 'purchase_sent') && (
                        <div className="notification-status">
                          <span className="status-badge pending">
                            Sent
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="profile-content">
            <div className="section-header">
              <h2>Account Settings</h2>
              {!editMode && (
                <button
                  className="btn btn-primary"
                  onClick={() => setEditMode(true)}
                >
                  <i className="fas fa-edit"></i> Edit Profile
                </button>
              )}
            </div>

            <div className="settings-container">
              {/* Profile Information */}
              <div className="settings-section">
                <h3>Profile Information</h3>

                <div className="form-group">
                  <label>Full Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      className="form-control"
                    />
                  ) : (
                    <p className="profile-data">{profileData.name}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  {editMode ? (
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className="form-control"
                      disabled={true} // Email changes often require verification, so keeping disabled
                    />
                  ) : (
                    <p className="profile-data">{profileData.email}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  {editMode ? (
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      className="form-control"
                    />
                  ) : (
                    <p className="profile-data">{profileData.phone}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Location</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="location"
                      value={profileData.location}
                      onChange={handleProfileChange}
                      className="form-control"
                    />
                  ) : (
                    <p className="profile-data">{profileData.location}</p>
                  )}
                </div>

                {editMode && (
                  <div className="form-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={saveProfileChanges}
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              {/* Change Password */}
              <div className="settings-section">
                <h3>Change Password</h3>

                <form onSubmit={changePassword}>
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={password.currentPassword}
                      onChange={handlePasswordChange}
                      className="form-control"
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={password.newPassword}
                      onChange={handlePasswordChange}
                      className="form-control"
                      placeholder="Enter your new password"
                      minLength="6"
                    />
                    <small className="form-text">Password must be at least 6 characters</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={password.confirmPassword}
                      onChange={handlePasswordChange}
                      className="form-control"
                      placeholder="Confirm your new password"
                      minLength="6"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      Change Password
                    </button>
                  </div>
                </form>
              </div>

              {/* Account Deletion */}
              <div className="settings-section danger-zone">
                <h3>Danger Zone</h3>
                <p>This action cannot be undone. All your products will be removed.</p>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProfilePage;
