import axios from 'axios';

// Create axios instance with baseURL and default headers
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include auth token in headers
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('API request with token:', config.method?.toUpperCase(), config.url, 'Token exists:', !!token);
    } else {
      console.log('API request without token:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.error('API Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);

      // Handle authentication errors
      if (error.response.status === 401) {
        console.log('401 Unauthorized error detected, clearing token and dispatching auth-error event');
        // Clear token and redirect to login
        localStorage.removeItem('token');
        // Dispatch a custom event to notify the auth context
        window.dispatchEvent(new CustomEvent('auth-error'));
      }
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth APIs
const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (userData) => api.post('/auth/login', userData),
  socialLogin: (socialData) => api.post('/auth/social-login', socialData),
  getCurrentUser: () => api.get('/auth/me'),
  sendEmailVerificationOTP: (email) => api.post('/auth/send-verification-otp', { email }),
  verifyEmail: (email, otp) => api.post('/auth/verify-email', { email, otp }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetOTP: (email, otp) => api.post('/auth/verify-reset-otp', { email, otp }),
  resetPassword: (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }),
  updateProfile: (userData) => api.put('/users/profile', userData),
  changePassword: (passwordData) => api.put('/users/password', passwordData),
  deleteAccount: () => api.delete('/users')
};

// Product APIs
const productAPI = {
  getAllProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getUserProducts: () => api.get('/products/user'),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  markAsSold: (id) => api.patch(`/products/${id}`, { sold: true }),
  getFeaturedProducts: () => api.get('/products?featured=true&limit=4'),
  getRecentProducts: () => api.get('/products?sort=-createdAt&limit=8')
};

// Upload APIs
const uploadAPI = {
  uploadImages: (formData) => api.post('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  uploadVideos: (formData) => api.post('/upload/videos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
};

// User APIs
const userAPI = {
  getUser: (id) => api.get(`/users/${id}`),
  getUserProducts: (id) => api.get(`/users/${id}/products`)
};

// Offer APIs
const offerAPI = {
  createOffer: (offerData) => api.post('/offers', offerData),
  getOffers: (type) => api.get(`/offers?type=${type}`),
  respondToOffer: (id, responseData) => api.put(`/offers/${id}/respond`, responseData),
  cancelOffer: (id) => api.delete(`/offers/${id}`)
};

// Order APIs
const orderAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: (type) => api.get(`/orders?type=${type}`),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, statusData) => api.put(`/orders/${id}/status`, statusData),
  markPaymentReceived: (id) => api.put(`/orders/${id}/payment-received`)
};

// Notification APIs
const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getNotificationStats: () => api.get('/notifications/stats')
};

// Comment APIs
const commentAPI = {
  getComments: (productId, params) => api.get(`/comments/${productId}`, { params }),
  addComment: (productId, commentData) => api.post(`/comments/${productId}`, commentData),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
  likeComment: (commentId) => api.put(`/comments/${commentId}/like`),
  replyToComment: (commentId, replyData) => api.post(`/comments/${commentId}/reply`, replyData)
};

// Payment APIs
const paymentAPI = {
  createPaymentLink: (orderData) => api.post('/payments/create-link', orderData),
  getPayment: (paymentId) => api.get(`/payments/${paymentId}`),
  checkPaymentStatus: (paymentId) => api.get(`/payments/${paymentId}/status`),
  getUserPayments: (params) => api.get('/payments', { params })
};

// Social interaction APIs
const socialAPI = {
  likeProduct: (productId) => api.put(`/products/${productId}/like`),
  viewProduct: (productId) => api.post(`/products/${productId}/view`),
};

export { api, authAPI, productAPI, uploadAPI, userAPI, offerAPI, orderAPI, notificationAPI, commentAPI, paymentAPI, socialAPI };

export default api;
