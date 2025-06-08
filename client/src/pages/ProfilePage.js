import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import ProductCard from '../components/products/ProductCard';
import Spinner from '../components/layout/Spinner';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    avatar: '',
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'sold', 'settings'
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
        const userRes = await axios.get('/api/users/me');
        
        setProfileData({
          name: userRes.data.data.name,
          email: userRes.data.data.email,
          phone: userRes.data.data.phone,
          location: userRes.data.data.location,
          avatar: userRes.data.data.avatar,
        });
        
        // Fetch user's products
        const productsRes = await axios.get('/api/products/user');
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
      
      const response = await axios.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
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
      const response = await axios.put('/api/users/profile', profileData);
      
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
      await axios.put('/api/users/password', { 
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
      await axios.delete('/api/users');
      toast.success('Your account has been deleted');
      logout();
    } catch (err) {
      console.error('Error deleting account:', err);
      toast.error('Failed to delete account');
    }
  };

  if (loading) {
    return <Spinner />;
  }

  const activeProducts = products.filter(product => !product.sold);
  const soldProducts = products.filter(product => product.sold);

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
                <img 
                  src={profileData.avatar || '/images/default-avatar.jpg'} 
                  alt={profileData.name} 
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
              <span>{products.length} Listings</span>
              <span>{soldProducts.length} Sold</span>
              <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
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
