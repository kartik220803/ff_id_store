const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { uploadImage } = require('../utils/cloudinary');

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Make sure user is looking at their own profile or is admin
    if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view this profile'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Make sure user is updating their own profile or is admin
    if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    // Don't allow password updates through this route
    if (req.body.password) {
      delete req.body.password;
    }

    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Upload user avatar
// @route   PUT /api/users/:id/avatar
// @access  Private
router.put('/:id/avatar', protect, async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Make sure user is updating their own avatar or is admin
    if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this avatar'
      });
    }

    // Check if image was uploaded
    if (!req.body.avatar) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image'
      });
    }

    // Upload to cloudinary
    const result = await uploadImage(req.body.avatar, 'second-hand-mobiles/users');

    // Update user avatar
    user = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: result.secure_url },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

module.exports = router;
