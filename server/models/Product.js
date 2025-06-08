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
  brand: {
    type: String,
    required: [true, 'Please specify the brand'],
  },
  model: {
    type: String,
    required: [true, 'Please specify the model'],
  },
  condition: {
    type: String,
    required: [true, 'Please specify the condition'],
    enum: ['Brand New', 'Like New', 'Very Good', 'Good', 'Acceptable', 'For Parts'],
  },
  age: {
    type: String,
    required: [true, 'Please specify the age of the device'],
  },
  storage: {
    type: String,
    required: [true, 'Please specify the storage capacity'],
  },
  color: {
    type: String,
    required: [true, 'Please specify the color'],
  },
  warranty: {
    type: String,
    default: 'No warranty',
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
  location: {
    type: String,
    required: [true, 'Please add your location'],
  },
  sold: {
    type: Boolean,
    default: false,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for search
ProductSchema.index({ title: 'text', description: 'text', brand: 'text', model: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
