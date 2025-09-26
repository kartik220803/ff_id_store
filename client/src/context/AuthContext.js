import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Get user data from API
          const res = await authAPI.getCurrentUser();

          setUser(res.data.user);
          setIsAuthenticated(true);
          setError(null);
        } catch (err) {
          console.error('Auth error:', err.response?.data || err.message);
          localStorage.removeItem('token');
          setToken(null);
          setIsAuthenticated(false);
          setUser(null);
          setError(err.response?.data?.message || 'Authentication failed');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Listen for auth errors from API interceptor
  useEffect(() => {
    const handleAuthError = () => {
      console.log('Auth error event received, logging out user');
      logout();
    };

    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  // Debug authentication state
  useEffect(() => {
    console.log('Auth state changed:', {
      isAuthenticated,
      hasUser: !!user,
      hasToken: !!token,
      tokenFromStorage: !!localStorage.getItem('token')
    });
  }, [isAuthenticated, user, token]);

  // Register user
  const register = async (userData) => {
    try {
      const res = await authAPI.register(userData);

      // Don't auto-login after registration, email verification required
      setError(null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  // Login user
  const login = async (userData, isEmail = true, socialData = null) => {
    try {
      let res;

      if (socialData) {
        // Social login
        res = await authAPI.socialLogin(socialData);
      } else {
        // Regular email/password login
        res = await authAPI.login(userData);
      }

      // Store token and update state
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      setError(null);

      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  // Update user in context (used after profile updates)
  const updateUser = (userData) => {
    setUser(userData);
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const res = await authAPI.updateProfile(userData);
      setUser(res.data.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
      throw err;
    }
  };

  // Change user password
  const changePassword = async (passwordData) => {
    try {
      const res = await authAPI.changePassword(passwordData);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Password change failed');
      throw err;
    }
  };

  // Delete user account
  const deleteAccount = async () => {
    try {
      await authAPI.deleteAccount();
      logout();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        updateUser,
        updateProfile,
        changePassword,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
