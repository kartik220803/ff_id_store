import axios from 'axios';

// Create axios instance with baseURL and default headers
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Auth APIs
const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (userData) => api.post('/users/login', userData),
  getCurrentUser: () => api.get('/users/me'),
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

export { api, authAPI, productAPI, uploadAPI, userAPI };
