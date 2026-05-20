// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  setupAdmin
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Validation rules
const loginValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const passwordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

// Public routes
router.post('/login', loginValidation, login);
router.post('/setup', setupAdmin); // Remove or protect this after initial setup

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/change-password', protect, passwordValidation, changePassword);
router.post('/logout', protect, logout);

module.exports = router;