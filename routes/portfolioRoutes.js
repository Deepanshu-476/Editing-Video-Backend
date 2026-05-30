const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getFeaturedProjects,
  getCategories,
  bulkDeleteProjects
} = require('../controllers/portfolioController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Validation rules
const projectValidation = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('category')
    .notEmpty().withMessage('Category is required'),
  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('videoUrl')
    .if((value, { req }) => !req.file)
    .notEmpty().withMessage('Video file or Video URL is required')
    .bail()
    .isURL().withMessage('Please provide a valid URL')
];

// Public routes
router.get('/', getAllProjects);
router.get('/featured', getFeaturedProjects);
router.get('/categories', getCategories);
router.get('/:id', getProjectById);

// Admin routes (protected)
router.post('/', protect, upload.single('video'), projectValidation, createProject);
router.put('/:id', protect, upload.single('video'), updateProject);
router.delete('/:id', protect, deleteProject);
router.post('/bulk-delete', protect, bulkDeleteProjects);

module.exports = router;
