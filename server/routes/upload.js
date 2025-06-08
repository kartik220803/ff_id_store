const express = require('express');
const multer = require('multer');
const {
  uploadImages,
  uploadVideos,
  deleteMedia
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB limit
  }
});

// Routes
router.post('/images', protect, upload.array('images', 5), uploadImages);
router.post('/videos', protect, upload.array('videos', 3), uploadVideos);
router.delete('/media/:id', protect, deleteMedia);

module.exports = router;
