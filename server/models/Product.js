const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be a positive number'],
  },
  level: {
    type: Number,
    required: [true, 'Please specify the account level'],
    min: [1, 'Level must be at least 1'],
    max: [100, 'Level cannot exceed 100'],
  },
  diamonds: {
    type: Number,
    required: [true, 'Please specify the number of diamonds'],
    min: [0, 'Diamonds cannot be negative'],
  },
  gold: {
    type: Number,
    required: [true, 'Please specify the amount of gold'],
    min: [0, 'Gold cannot be negative'],
  },
  loginMethod: {
    type: String,
    required: [true, 'Please specify the login method'],
    enum: ['Facebook', 'Google', 'X/Twitter', 'Guest'],
  },
  twoStepVerification: {
    type: String,
    required: [true, 'Please specify 2-step verification status'],
    enum: ['Enabled', 'Not Enabled'],
  },
  uid: {
    type: String,
    required: [true, 'Please provide the account UID'],
    trim: true,
    unique: true,
    minlength: [8, 'UID must be at least 8 characters'],
    maxlength: [15, 'UID cannot exceed 15 characters'],
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  videos: [
    {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
  ],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sold: {
    type: Boolean,
    default: false,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  // Social interaction fields
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  views: {
    type: Number,
    default: 0,
  },
  viewedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  commentsCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for search
ProductSchema.index({ title: 'text', description: 'text', loginMethod: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
