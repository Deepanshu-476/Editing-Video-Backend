const Portfolio = require('../models/Portfolio');
const { validationResult } = require('express-validator');

const getUploadedFileUrl = (file) => {
  if (!file) return null;
  if (file.path && /^https?:\/\//i.test(file.path)) return file.path;
  if (file.filename) return `/uploads/portfolio/${file.filename}`;
  return null;
};

// @desc    Get all portfolio projects
// @route   GET /api/portfolio
// @access  Public
const getAllProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const featured = req.query.featured;

    // Build filter
    let filter = {};
    if (category && category !== 'all') filter.category = category;
    if (featured === 'true') filter.isFeatured = true;

    const projects = await Portfolio.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Portfolio.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects'
    });
  }
};

// @desc    Get single portfolio project
// @route   GET /api/portfolio/:id
// @access  Public
const getProjectById = async (req, res) => {
  try {
    const project = await Portfolio.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Increment view count
    project.views += 1;
    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project'
    });
  }
};

// @desc    Create new portfolio project (Admin only)
// @route   POST /api/portfolio
// @access  Private/Admin
const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title, category, description, thumbnail, duration, client, tags, isFeatured, order } = req.body;
    const videoUrl = getUploadedFileUrl(req.file) || req.body.videoUrl;

    const project = await Portfolio.create({
      title,
      category,
      description,
      videoUrl,
      thumbnail,
      duration,
      client,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isFeatured: isFeatured === true || isFeatured === 'true',
      order: order || 0
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project'
    });
  }
};

// @desc    Update portfolio project (Admin only)
// @route   PUT /api/portfolio/:id
// @access  Private/Admin
const updateProject = async (req, res) => {
  try {
    const project = await Portfolio.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const { title, category, description, thumbnail, duration, client, tags, isFeatured, order } = req.body;
    const videoUrl = getUploadedFileUrl(req.file) || req.body.videoUrl;

    // Update fields
    if (title) project.title = title;
    if (category) project.category = category;
    if (description) project.description = description;
    if (videoUrl) project.videoUrl = videoUrl;
    if (thumbnail) project.thumbnail = thumbnail;
    if (duration) project.duration = duration;
    if (client) project.client = client;
    if (tags) project.tags = tags.split(',').map(tag => tag.trim());
    if (isFeatured !== undefined) project.isFeatured = isFeatured;
    if (order !== undefined) project.order = order;

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project'
    });
  }
};

// @desc    Delete portfolio project (Admin only)
// @route   DELETE /api/portfolio/:id
// @access  Private/Admin
const deleteProject = async (req, res) => {
  try {
    const project = await Portfolio.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
};

// @desc    Get featured projects
// @route   GET /api/portfolio/featured
// @access  Public
const getFeaturedProjects = async (req, res) => {
  try {
    const projects = await Portfolio.find({ isFeatured: true })
      .sort({ order: 1 })
      .limit(6);

    res.status(200).json({
      success: true,
      data: projects
    });

  } catch (error) {
    console.error('Get featured projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured projects'
    });
  }
};

// @desc    Get project categories
// @route   GET /api/portfolio/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Portfolio.distinct('category');
    
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Portfolio.countDocuments({ category });
        return { name: category, count };
      })
    );

    res.status(200).json({
      success: true,
      data: categoriesWithCount
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

// @desc    Bulk delete projects
// @route   DELETE /api/portfolio/bulk
// @access  Private/Admin
const bulkDeleteProjects = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid project IDs'
      });
    }

    const result = await Portfolio.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} projects deleted successfully`
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete projects'
    });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getFeaturedProjects,
  getCategories,
  bulkDeleteProjects
};
