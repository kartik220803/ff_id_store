import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <Link to="/">
              <h1>Mobile Market</h1>
            </Link>
          </div>
          
          <div className="navbar-search">
            <form>
              <input 
                type="text" 
                placeholder="Search for smartphones..."
                className="form-control"
              />
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-search"></i>
              </button>
            </form>
          </div>

          <div className="navbar-menu-toggle">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>

          <nav className={`navbar-nav ${mobileMenuOpen ? 'active' : ''}`}>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/products">Browse Phones</Link>
              </li>
              
              {isAuthenticated ? (
                <>
                  <li>
                    <Link to="/products/add" className="btn btn-accent">
                      <i className="fas fa-plus"></i> Sell Phone
                    </Link>
                  </li>
                  <li className="dropdown">
                    <button className="dropdown-toggle">
                      <span className="user-name">{user?.name}</span>
                      <i className="fas fa-chevron-down"></i>
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <Link to="/profile">
                          <i className="fas fa-user"></i> My Profile
                        </Link>
                      </li>
                      <li>
                        <button onClick={handleLogout}>
                          <i className="fas fa-sign-out-alt"></i> Logout
                        </button>
                      </li>
                    </ul>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login">Login</Link>
                  </li>
                  <li>
                    <Link to="/register" className="btn btn-primary">Sign Up</Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
