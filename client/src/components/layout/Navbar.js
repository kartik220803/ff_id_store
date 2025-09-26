import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  // Temporary test: force notification count for debugging
  const testUnreadCount = isAuthenticated ? 3 : 0;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Debug logging
  console.log('Navbar - isAuthenticated:', isAuthenticated);
  console.log('Navbar - unreadCount:', unreadCount);
  console.log('Navbar - testUnreadCount:', testUnreadCount);
  console.log('Navbar - user:', user);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Close overlays when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't close if clicking on the navbar controls (search button, hamburger menu)
      if (e.target.closest('.navbar-controls')) {
        return;
      }

      // Don't close search overlay if clicking inside the search container
      if (searchOpen && e.target.closest('.search-container')) {
        return;
      }

      setMobileMenuOpen(false);
      setSearchOpen(false);
    };

    if (mobileMenuOpen || searchOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mobileMenuOpen, searchOpen]);

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Brand Logo */}
          <div className="navbar-brand">
            <Link to="/" onClick={closeMobileMenu}>
              <h1>FF-ID-STORE</h1>
            </Link>
          </div>

          {/* Right Side Controls */}
          <div className="navbar-controls">
            {/* Search Button */}
            <button
              className="search-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleSearch();
              }}
              aria-label="Toggle search"
            >
              <i className="fas fa-search"></i>
            </button>

            {/* Hamburger Menu Button */}
            <button
              className="hamburger-menu"
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              aria-label="Toggle menu"
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
              {isAuthenticated && testUnreadCount > 0 && (
                <span className="hamburger-notification">
                  {testUnreadCount > 9 ? '9+' : testUnreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Overlay */}
        <div
          className={`search-overlay ${searchOpen ? 'open' : ''}`}
          onClick={(e) => {
            // Only close if clicking directly on the overlay background (not on children)
            if (e.target === e.currentTarget) {
              setSearchOpen(false);
            }
          }}
        >
          <div className="search-container" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearchSubmit} className="search-form">
              <div className="search-input-container">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control"
                  placeholder="Search by UID, Level, Price, etc."
                  autoFocus
                />
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-search"></i>
                </button>
              </div>
            </form>
            <button
              className="search-close-below"
              onClick={(e) => {
                e.stopPropagation();
                setSearchOpen(false);
              }}
              aria-label="Close search"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu Backdrop */}
        <div
          className={`mobile-menu-backdrop ${mobileMenuOpen ? 'open' : ''}`}
          onClick={closeMobileMenu}
        ></div>

        {/* Mobile Menu */}
        <nav className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <ul>
            <li className="menu-item">
              <Link to="/" onClick={closeMobileMenu} className="home-link">
                <i className="fas fa-home"></i>
                <span>Home</span>
                {isAuthenticated && testUnreadCount > 0 && (
                  <span className="notification-dot">{testUnreadCount > 9 ? '9+' : testUnreadCount}</span>
                )}
              </Link>
            </li>
            <li className="menu-item">
              <Link to="/products" onClick={closeMobileMenu}>
                <i className="fas fa-gamepad"></i> Browse Accounts
              </Link>
            </li>

            {/* Support Button - Opens WhatsApp Chat */}
            <li className="menu-item">
              <a
                href="https://wa.me/917982947213?text=Hello%2C%20I%20need%20support%20with%20FF-ID-STORE"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobileMenu}
              >
                <i className="fab fa-whatsapp"></i> Support
              </a>
            </li>

            {isAuthenticated ? (
              <>
                <li className="menu-item">
                  <Link to="/products/add" onClick={closeMobileMenu}>
                    <i className="fas fa-plus"></i> Sell Account
                  </Link>
                </li>
                {user?.role === 'admin' && (
                  <li className="menu-item">
                    <Link to="/admin" onClick={closeMobileMenu}>
                      <i className="fas fa-cog"></i> Admin Dashboard
                    </Link>
                  </li>
                )}
                <li className="menu-item">
                  <Link to="/profile" onClick={closeMobileMenu} className="profile-link">
                    <i className="fas fa-user"></i>
                    <span>My Profile</span>
                    {testUnreadCount > 0 && (
                      <span className="notification-dot">{testUnreadCount > 9 ? '9+' : testUnreadCount}</span>
                    )}
                  </Link>
                </li>
                <li className="menu-item">
                  <span className="user-greeting">Hello, {user?.name}!</span>
                </li>
                <li className="menu-item">
                  <button onClick={handleLogout} className="logout-btn">
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="menu-item">
                  <Link to="/login" onClick={closeMobileMenu}>
                    <i className="fas fa-sign-in-alt"></i> Login
                  </Link>
                </li>
                <li className="menu-item">
                  <Link to="/register" onClick={closeMobileMenu}>
                    <i className="fas fa-user-plus"></i> Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
