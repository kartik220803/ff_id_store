const { uploadImage, deleteImage } = require('../utils/cloudinary');
const Product = require('../models/Product');

// @desc    Upload product images
// @route   POST /api/upload/images
// @access  Private
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image',
      });
    }

    // Upload each image to Cloudinary
    const uploadPromises = req.files.map(file => {
      // Create a base64 string from the file buffer
      const fileString = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      // Upload to Cloudinary
      return uploadImage(fileString, 'ff-id-store/accounts');
    });

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);

    // Format the results
    const images = results.map(result => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));

    res.status(200).json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: error.message,
    });
  }
};

// @desc    Upload product videos
// @route   POST /api/upload/videos
// @access  Private
exports.uploadVideos = async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one video',
      });
    }

    // Upload each video to Cloudinary
    const uploadPromises = req.files.map(file => {
      // Create a base64 string from the file buffer
      const fileString = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      // Upload to Cloudinary with resource_type as video
      return uploadImage(fileString, 'ff-id-store/videos');
    });

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);

    // Format the results
    const videos = results.map(result => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during video upload',
      error: error.message,
    });
  }
};

// @desc    Delete media (image/video) from Cloudinary
// @route   DELETE /api/upload/media/:id
// @access  Private
exports.deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete from Cloudinary
    await deleteImage(id);

    res.status(200).json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during media deletion',
      error: error.message,
    });
  }
};
