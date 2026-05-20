// backend/server.js (Updated)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Import routes
const contactRoutes = require('./routes/contactRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection with retry logic
const startServer = async () => {
  try {
    // Connect to MongoDB
    const db = await connectDB();
    
    if (!db) {
      console.log('⚠️  Server starting without database connection');
      console.log('📝 Some features may not work until database is connected');
    } else {
      console.log('✅ Database connected successfully');
    }

    // API Routes
    app.use('/api/contact', contactRoutes);
    app.use('/api/portfolio', portfolioRoutes);
    app.use('/api/auth', authRoutes);

    // Health check route
    app.get('/api/health', (req, res) => {
      const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running',
        database: dbStatus,
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
      });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error('Error:', err.stack);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 API URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();