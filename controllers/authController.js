const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact super admin.'
      });
    }

    // Check password
    const isPasswordMatch = await admin.comparePassword(password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();

    // Generate token
    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          avatar: admin.avatar
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// @desc    Get current admin profile
// @route   GET /api/auth/me
// @access  Private/Admin
const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/auth/me
// @access  Private/Admin
const updateProfile = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (name) admin.name = name;
    if (email) admin.email = email;
    if (avatar) admin.avatar = avatar;

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private/Admin
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check current password
    const isPasswordMatch = await admin.comparePassword(currentPassword);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

// @desc    Logout (client side token removal)
// @route   POST /api/auth/logout
// @access  Private/Admin
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Create initial admin (run once)
// @route   POST /api/auth/setup
// @access  Public (should be disabled after setup)
const setupAdmin = async (req, res) => {
  try {
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists'
      });
    }

    const admin = await Admin.create({
      name: 'Super Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'superadmin'
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        email: admin.email,
        name: admin.name
      }
    });

  } catch (error) {
    console.error('Setup admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin'
    });
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  setupAdmin
};