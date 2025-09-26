const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const { updateUsersWithoutCreatedAt } = require('./utils/userMigration');
const { addUIDToExistingProducts } = require('./utils/uidMigration');
const { addSocialFieldsToProducts } = require('./utils/socialMigration');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const offerRoutes = require('./routes/offers');
const orderRoutes = require('./routes/orders');
const notificationRoutes = require('./routes/notifications');
const commentRoutes = require('./routes/comments');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to Database
connectDB();

// Run user migration to fix missing createdAt timestamps
updateUsersWithoutCreatedAt();

// Run UID migration for products
addUIDToExistingProducts().catch(console.error);

// Run phone number migration to clean invalid phone numbers
require('./utils/phoneNumberMigration');

// Run social fields migration for products
addSocialFieldsToProducts().catch(console.error);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error middleware caught:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
});

// Default route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Port configuration
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://0.0.0.0:${PORT}`);
});
