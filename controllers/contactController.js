const Contact = require('../models/Contact');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// @desc    Submit contact form
// @route   POST /api/contact/submit
// @access  Public
const submitContact = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, phone, message } = req.body;

    // Get IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Create contact entry
    const contact = await Contact.create({
      name,
      email,
      phone,
      message,
      ipAddress,
      userAgent
    });

    // Send email notification to admin
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Message from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p><strong>IP Address:</strong> ${ipAddress}</p>
        <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    // Send email (don't await to avoid blocking response)
    transporter.sendMail(mailOptions).catch(err => {
      console.error('Email sending failed:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.',
      data: contact
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
};

// @desc    Get all contacts (Admin only)
// @route   GET /api/contact/all
// @access  Private/Admin
const getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const isRead = req.query.isRead;

    // Build filter
    let filter = {};
    if (status) filter.status = status;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts'
    });
  }
};

// @desc    Get single contact (Admin only)
// @route   GET /api/contact/:id
// @access  Private/Admin
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Mark as read if not already
    if (!contact.isRead) {
      contact.isRead = true;
      await contact.save();
    }

    res.status(200).json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact'
    });
  }
};

// @desc    Update contact status (Admin only)
// @route   PUT /api/contact/:id/status
// @access  Private/Admin
const updateContactStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    if (status) contact.status = status;
    if (notes) contact.notes = notes;
    
    if (status === 'replied') {
      contact.repliedAt = Date.now();
    }

    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Contact status updated',
      data: contact
    });

  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact'
    });
  }
};

// @desc    Delete contact (Admin only)
// @route   DELETE /api/contact/:id
// @access  Private/Admin
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully'
    });

  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact'
    });
  }
};

// @desc    Get contact statistics (Admin only)
// @route   GET /api/contact/stats
// @access  Private/Admin
const getContactStats = async (req, res) => {
  try {
    const total = await Contact.countDocuments();
    const pending = await Contact.countDocuments({ status: 'pending' });
    const read = await Contact.countDocuments({ isRead: true });
    const unread = await Contact.countDocuments({ isRead: false });
    const replied = await Contact.countDocuments({ status: 'replied' });
    
    // Get last 7 days data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await Contact.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      });
    }

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        read,
        unread,
        replied,
        last7Days
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};

module.exports = {
  submitContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  getContactStats
};