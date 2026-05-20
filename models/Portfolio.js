const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['corporate', 'youtube', 'commercial', 'wedding', 'music', 'social', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  thumbnail: {
    type: String,
    default: ''
  },
  duration: {
    type: String,
    default: ''
  },
  client: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update updatedAt on save
portfolioSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for formatted date
portfolioSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

module.exports = mongoose.model('Portfolio', portfolioSchema);