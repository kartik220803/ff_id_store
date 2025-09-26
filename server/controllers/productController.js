const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Create a new product
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res) => {
  try {
    req.body.seller = req.user.id;

    // Validate seller's phone number before allowing product creation
    const seller = await User.findById(req.user.id);
    if (!seller.phone || !/^\d{10}$/.test(seller.phone)) {
      return res.status(400).json({
        success: false,
        message: 'Valid phone number is required to sell products. Please update your profile with a 10-digit phone number.',
      });
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search', 'status', 'minLevel', 'maxLevel', 'minDiamonds', 'maxDiamonds', 'minPrice', 'maxPrice'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Build query object
    let queryObj = JSON.parse(queryStr);

    // Handle status filter (available/sold)
    if (req.query.status === 'available') {
      queryObj.sold = false;
    } else if (req.query.status === 'sold') {
      queryObj.sold = true;
    }

    // Handle level range
    if (req.query.minLevel || req.query.maxLevel) {
      queryObj.level = {};
      if (req.query.minLevel) {
        queryObj.level.$gte = parseInt(req.query.minLevel);
      }
      if (req.query.maxLevel) {
        queryObj.level.$lte = parseInt(req.query.maxLevel);
      }
    }

    // Handle diamonds range
    if (req.query.minDiamonds || req.query.maxDiamonds) {
      queryObj.diamonds = {};
      if (req.query.minDiamonds) {
        queryObj.diamonds.$gte = parseInt(req.query.minDiamonds);
      }
      if (req.query.maxDiamonds) {
        queryObj.diamonds.$lte = parseInt(req.query.maxDiamonds);
      }
    }

    // Handle price range
    if (req.query.minPrice || req.query.maxPrice) {
      queryObj.price = {};
      if (req.query.minPrice) {
        queryObj.price.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        queryObj.price.$lte = parseFloat(req.query.maxPrice);
      }
    }

    // Finding resource
    query = Product.find(queryObj).populate({
      path: 'seller',
      select: 'name location phone avatar',
    });

    // Search functionality
    if (req.query.search) {
      query = Product.find({
        ...queryObj,
        $text: { $search: req.query.search }
      }).populate({
        path: 'seller',
        select: 'name location phone avatar',
      });
    }

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments(queryObj);

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const products = await query;

    // Add social stats to each product
    const productsWithStats = products.map(product => {
      const productObj = product.toObject();
      return {
        ...productObj,
        socialStats: {
          likesCount: product.likes.length,
          viewsCount: product.views,
          commentsCount: product.commentsCount,
        }
      };
    });

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: productsWithStats.length,
      pagination,
      data: productsWithStats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate({
      path: 'seller',
      select: 'name location phone avatar',
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Add social interaction stats
    const socialStats = {
      likesCount: product.likes.length,
      viewsCount: product.views,
      commentsCount: product.commentsCount,
      isLiked: false, // Will be updated if user is authenticated
    };

    // If user is authenticated, check if they've liked this product
    if (req.user) {
      socialStats.isLiked = product.likes.some(
        (like) => like.user.toString() === req.user.id
      );
    }

    res.status(200).json({
      success: true,
      data: {
        ...product.toObject(),
        socialStats,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Make sure user is the seller
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this product',
      });
    }

    // Validate seller's phone number before allowing product update (unless admin)
    if (req.user.role !== 'admin') {
      const seller = await User.findById(req.user.id);
      if (!seller.phone || !/^\d{10}$/.test(seller.phone)) {
        return res.status(400).json({
          success: false,
          message: 'Valid phone number is required to manage products. Please update your profile with a 10-digit phone number.',
        });
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Make sure user is the seller
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this product',
      });
    }

    await product.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get user's products
// @route   GET /api/products/user/:userId
// @access  Public
exports.getUserProducts = async (req, res) => {
  try {
    // If userId is provided in params, use it; otherwise use the authenticated user's ID
    const userId = req.params.userId || req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    console.log(`Fetching products for user ID: ${userId}`);

    const products = await Product.find({ seller: userId })
      .sort('-createdAt')
      .populate({
        path: 'seller',
        select: 'name location',
      });

    console.log(`Found ${products.length} products for user ${userId}`);

    // Add social stats to each product
    const productsWithStats = products.map(product => {
      const productObj = product.toObject();
      return {
        ...productObj,
        socialStats: {
          likesCount: product.likes.length,
          viewsCount: product.views,
          commentsCount: product.commentsCount,
        }
      };
    });

    res.status(200).json({
      success: true,
      count: productsWithStats.length,
      data: productsWithStats,
    });
  } catch (error) {
    console.error('Error in getUserProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Like/Unlike a product
// @route   PUT /api/products/:id/like
// @access  Private
exports.likeProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const existingLike = product.likes.find(
      (like) => like.user.toString() === req.user.id
    );

    if (existingLike) {
      // Unlike the product
      product.likes = product.likes.filter(
        (like) => like.user.toString() !== req.user.id
      );
    } else {
      // Like the product
      product.likes.push({ user: req.user.id });
    }

    await product.save();

    res.json({
      success: true,
      data: product,
      message: existingLike ? 'Product unliked' : 'Product liked',
      liked: !existingLike,
      likesCount: product.likes.length,
    });
  } catch (error) {
    console.error('Like product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like/unlike product',
    });
  }
};

// @desc    Record a view for a product
// @route   POST /api/products/:id/view
// @access  Public (can work without auth for anonymous views)
exports.viewProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Increment view count
    product.views += 1;

    // If user is authenticated, record their view
    if (req.user) {
      const existingView = product.viewedBy.find(
        (view) => view.user && view.user.toString() === req.user.id
      );

      if (!existingView) {
        product.viewedBy.push({ user: req.user.id });
      }
    } else {
      // For anonymous users, just add a view without user reference
      product.viewedBy.push({ viewedAt: new Date() });
    }

    await product.save();

    res.json({
      success: true,
      message: 'View recorded',
      views: product.views,
    });
  } catch (error) {
    console.error('View product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record view',
    });
  }
};
