const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  submitContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  getContactStats
} = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

// Validation rules
const contactValidation = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('message')
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters')
];

// Public routes
router.post('/submit', contactValidation, submitContact);

// Admin routes (protected)
router.get('/all', protect, getAllContacts);
router.get('/stats', protect, getContactStats);
router.get('/:id', protect, getContactById);
router.put('/:id/status', protect, updateContactStatus);
router.delete('/:id', protect, deleteContact);

module.exports = router;