const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateDefaultAvatar } = require('../utils/avatar');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  phone: {
    type: String,
    required: false,
    validate: {
      validator: function (v) {
        // Only validate if phone is provided
        if (!v) return true;
        // Check if it's exactly 10 digits
        return /^\d{10}$/.test(v);
      },
      message: 'Please enter a valid 10-digit phone number'
    }
  },
  location: {
    type: String,
    required: [true, 'Please add your location'],
  },
  avatar: {
    type: String,
    default: function () {
      // Generate a varied default avatar based on user info
      return generateDefaultAvatar(this.name, this._id);
    },
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationOTP: String,
  emailVerificationOTPExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  resetPasswordOTP: String,
  resetPasswordOTPExpire: Date,

  // Rate limiting fields
  loginAttempts: {
    type: Number,
    default: 0,
  },
  loginLockUntil: Date,
  otpAttempts: {
    type: Number,
    default: 0,
  },
  otpLockUntil: Date,

  // Social login fields
  socialLogins: {
    google: {
      id: String,
      email: String
    },
    facebook: {
      id: String,
      email: String
    }
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to ensure createdAt is set for existing users
UserSchema.pre('save', function (next) {
  // If this is an existing document and createdAt is not set, set it to now
  if (!this.isNew && !this.createdAt) {
    this.createdAt = new Date();
  }
  next();
});

// Virtual field for avatar URL
UserSchema.virtual('avatarUrl').get(function () {
  if (!this.avatar) {
    return `${process.env.CLIENT_URL || 'http://localhost:3000'}/images/default-avatar.svg`;
  }

  // If avatar is already a full URL (starts with http), return as is
  if (this.avatar.startsWith('http')) {
    return this.avatar;
  }

  // If it's just a filename, construct the full URL
  return `${process.env.CLIENT_URL || 'http://localhost:3000'}/images/${this.avatar}`;
});

// Ensure virtual fields are included in JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash email verification OTP
UserSchema.methods.getEmailVerificationOTP = function () {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Set OTP to field
  this.emailVerificationOTP = otp;

  // Set expire time (20 minutes)
  this.emailVerificationOTPExpire = Date.now() + 20 * 60 * 1000;

  return otp;
};

// Generate and hash password reset OTP
UserSchema.methods.getResetPasswordOTP = function () {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Set OTP to field
  this.resetPasswordOTP = otp;

  // Set expire time (20 minutes)
  this.resetPasswordOTPExpire = Date.now() + 20 * 60 * 1000;

  return otp;
};

// Rate limiting methods
UserSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.loginLockUntil && this.loginLockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        loginLockUntil: 1,
      },
      $set: {
        loginAttempts: 1,
      }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // If we have hit max attempts and it's not locked yet, lock it
  if (this.loginAttempts + 1 >= 8 && !this.loginLockUntil) {
    updates.$set = { loginLockUntil: Date.now() + 5 * 60 * 1000 }; // 5 minutes
  }

  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      loginLockUntil: 1,
    }
  });
};

UserSchema.methods.incOtpAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.otpLockUntil && this.otpLockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        otpLockUntil: 1,
      },
      $set: {
        otpAttempts: 1,
      }
    });
  }

  const updates = { $inc: { otpAttempts: 1 } };

  // If we have hit max attempts and it's not locked yet, lock it
  if (this.otpAttempts + 1 >= 5 && !this.otpLockUntil) {
    updates.$set = { otpLockUntil: Date.now() + 10 * 60 * 1000 }; // 10 minutes
  }

  return this.updateOne(updates);
};

UserSchema.methods.resetOtpAttempts = function () {
  return this.updateOne({
    $unset: {
      otpAttempts: 1,
      otpLockUntil: 1,
    }
  });
};

UserSchema.virtual('isLoginLocked').get(function () {
  return !!(this.loginLockUntil && this.loginLockUntil > Date.now());
});

UserSchema.virtual('isOtpLocked').get(function () {
  return !!(this.otpLockUntil && this.otpLockUntil > Date.now());
});

UserSchema.virtual('loginLockRemaining').get(function () {
  if (this.loginLockUntil && this.loginLockUntil > Date.now()) {
    return Math.ceil((this.loginLockUntil - Date.now()) / 1000); // seconds remaining
  }
  return 0;
});

UserSchema.virtual('otpLockRemaining').get(function () {
  if (this.otpLockUntil && this.otpLockUntil > Date.now()) {
    return Math.ceil((this.otpLockUntil - Date.now()) / 1000); // seconds remaining
  }
  return 0;
});

module.exports = mongoose.model('User', UserSchema);
