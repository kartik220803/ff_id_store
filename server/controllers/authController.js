const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user with email verification pending
    const user = await User.create({
      name,
      email,
      password,
      phone,
      location,
      isEmailVerified: false,
    });

    // Generate email verification OTP
    const otp = user.getEmailVerificationOTP();
    await user.save({ validateBeforeSave: false });

    // Create email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Welcome to FF-ID-STORE!</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for registering with FF-ID-STORE. To complete your registration, please verify your email address using the following OTP:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #3498db; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p><strong>This OTP is valid for 20 minutes only.</strong></p>
        <p>If you didn't create this account, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #6c757d; font-size: 14px;">
          Best regards,<br>
          FF-ID-STORE Team
        </p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to FF-ID-STORE - Verify Your Email',
        html: emailHtml,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification OTP.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
        },
      });
    } catch (error) {
      console.error(error);
      // If email fails, still allow registration but inform user
      res.status(201).json({
        success: true,
        message: 'User registered successfully, but verification email could not be sent. Please try resending the verification email.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
        },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password +loginAttempts +loginLockUntil');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is currently locked
    if (user.isLoginLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts',
        lockRemaining: user.loginLockRemaining,
        isLocked: true,
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();

      // Check if user is now locked after this attempt
      const updatedUser = await User.findById(user._id).select('+loginAttempts +loginLockUntil');

      if (updatedUser.isLoginLocked) {
        return res.status(423).json({
          success: false,
          message: 'Too many failed login attempts. Account locked for 5 minutes.',
          lockRemaining: updatedUser.loginLockRemaining,
          isLocked: true,
        });
      }

      const attemptsRemaining = 8 - (updatedUser.loginAttempts || 0);
      return res.status(401).json({
        success: false,
        message: `Invalid credentials. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`,
        attemptsRemaining,
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts && user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in',
        requiresEmailVerification: true,
        email: user.email,
      });
    }

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
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

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
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

// @desc    Send email verification OTP
// @route   POST /api/auth/send-verification-otp
// @access  Public
exports.sendEmailVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    // Generate OTP
    const otp = user.getEmailVerificationOTP();
    await user.save({ validateBeforeSave: false });

    // Create email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Email Verification - FF-ID-STORE</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for registering with FF-ID-STORE. Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #3498db; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p><strong>This OTP is valid for 20 minutes only.</strong></p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #6c757d; font-size: 14px;">
          Best regards,<br>
          FF-ID-STORE Team
        </p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification OTP - FF-ID-STORE',
        html: emailHtml,
      });

      res.status(200).json({
        success: true,
        message: 'Email verification OTP sent successfully',
      });
    } catch (error) {
      console.error(error);
      user.emailVerificationOTP = undefined;
      user.emailVerificationOTPExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Check for user with OTP rate limiting fields
    const user = await User.findOne({ email }).select('+otpAttempts +otpLockUntil');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is currently locked from OTP attempts
    if (user.isOtpLocked) {
      return res.status(423).json({
        success: false,
        message: 'Too many failed OTP attempts. Please wait before trying again.',
        lockRemaining: user.otpLockRemaining,
        isLocked: true,
      });
    }

    // Check if OTP matches and is not expired
    const isValidOTP = user.emailVerificationOTP === otp &&
      user.emailVerificationOTPExpire > Date.now();

    if (!isValidOTP) {
      // Increment OTP attempts
      await user.incOtpAttempts();

      // Check if user is now locked after this attempt
      const updatedUser = await User.findById(user._id).select('+otpAttempts +otpLockUntil');

      if (updatedUser.isOtpLocked) {
        return res.status(423).json({
          success: false,
          message: 'Too many failed OTP attempts. Account locked for 10 minutes.',
          lockRemaining: updatedUser.otpLockRemaining,
          isLocked: true,
        });
      }

      const attemptsRemaining = 5 - (updatedUser.otpAttempts || 0);
      return res.status(400).json({
        success: false,
        message: `Invalid or expired OTP. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`,
        attemptsRemaining,
      });
    }

    // Reset OTP attempts on successful verification
    if (user.otpAttempts && user.otpAttempts > 0) {
      await user.resetOtpAttempts();
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
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

// @desc    Send forgot password OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email',
      });
    }

    // Generate reset password OTP
    const otp = user.getResetPasswordOTP();
    await user.save({ validateBeforeSave: false });

    // Create email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Password Reset - FF-ID-STORE</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to reset your password for your FF-ID-STORE account. Please use the following OTP to reset your password:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #e74c3c; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p><strong>This OTP is valid for 20 minutes only.</strong></p>
        <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #6c757d; font-size: 14px;">
          Best regards,<br>
          FF-ID-STORE Team
        </p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset OTP - FF-ID-STORE',
        html: emailHtml,
      });

      res.status(200).json({
        success: true,
        message: 'Password reset OTP sent to email',
      });
    } catch (error) {
      console.error(error);
      user.resetPasswordOTP = undefined;
      user.resetPasswordOTPExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Verify forgot password OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      resetToken: otp, // We'll use this to verify in reset password
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

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Check for user with OTP rate limiting fields
    const user = await User.findOne({ email }).select('+otpAttempts +otpLockUntil');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is currently locked from OTP attempts
    if (user.isOtpLocked) {
      return res.status(423).json({
        success: false,
        message: 'Too many failed OTP attempts. Please wait before trying again.',
        lockRemaining: user.otpLockRemaining,
        isLocked: true,
      });
    }

    // Check if OTP matches and is not expired
    const isValidOTP = user.resetPasswordOTP === otp &&
      user.resetPasswordOTPExpire > Date.now();

    if (!isValidOTP) {
      // Increment OTP attempts
      await user.incOtpAttempts();

      // Check if user is now locked after this attempt
      const updatedUser = await User.findById(user._id).select('+otpAttempts +otpLockUntil');

      if (updatedUser.isOtpLocked) {
        return res.status(423).json({
          success: false,
          message: 'Too many failed OTP attempts. Account locked for 10 minutes.',
          lockRemaining: updatedUser.otpLockRemaining,
          isLocked: true,
        });
      }

      const attemptsRemaining = 5 - (updatedUser.otpAttempts || 0);
      return res.status(400).json({
        success: false,
        message: `Invalid or expired OTP. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining.`,
        attemptsRemaining,
      });
    }

    // Reset OTP attempts on successful verification
    if (user.otpAttempts && user.otpAttempts > 0) {
      await user.resetOtpAttempts();
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        role: user.role,
        avatar: user.avatar,
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

// @desc    Social Login (Google/Facebook)
// @route   POST /api/auth/social-login
// @access  Public
exports.socialLogin = async (req, res) => {
  try {
    const { provider, token, name, email, avatar } = req.body;

    if (!provider || !token || !email) {
      return res.status(400).json({
        success: false,
        message: 'Provider, token, and email are required',
      });
    }

    // Verify the social token (simplified for demo - in production, verify with respective APIs)
    if (provider === 'google') {
      // In production, verify Google token with Google's API
      console.log('Google login token received:', token);
    } else if (provider === 'facebook') {
      // In production, verify Facebook token with Facebook's API
      console.log('Facebook login token received:', token);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported provider',
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, update social login info if needed
      if (!user.socialLogins) {
        user.socialLogins = {};
      }

      if (!user.socialLogins[provider]) {
        user.socialLogins[provider] = {
          id: token,
          email: email
        };

        // Update avatar if user doesn't have one
        if (!user.avatar && avatar) {
          user.avatar = avatar;
        }

        await user.save({ validateBeforeSave: false });
      }
    } else {
      // Create new user from social login
      user = new User({
        name: name || email.split('@')[0],
        email,
        password: Math.random().toString(36).slice(-8), // Random password
        location: 'Not specified',
        isEmailVerified: true, // Social logins are pre-verified
        avatar: avatar || undefined,
        socialLogins: {
          [provider]: {
            id: token,
            email: email
          }
        }
      });

      await user.save({ validateBeforeSave: false });
    }

    // Generate JWT token
    const jwtToken = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        avatar: user.avatarUrl,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during social login',
    });
  }
};
