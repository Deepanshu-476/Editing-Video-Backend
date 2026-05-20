const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');
const Portfolio = require('../models/Portfolio');

dotenv.config();

const setupDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create admin user
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminExists) {
      await Admin.create({
        name: 'Super Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'superadmin',
        isActive: true
      });
      console.log('✅ Admin user created');
    } else {
      console.log('⚠️ Admin user already exists');
    }

    // Create sample portfolio data
    const portfolioCount = await Portfolio.countDocuments();
    if (portfolioCount === 0) {
      const sampleProjects = [
        {
          title: 'Corporate Brand Video',
          category: 'corporate',
          description: 'Professional corporate branding video with motion graphics and dynamic transitions',
          videoUrl: 'https://www.youtube.com/embed/sample1',
          thumbnail: '',
          duration: '2:30',
          client: 'TechCorp Inc.',
          tags: ['corporate', 'branding', 'motion graphics'],
          isFeatured: true,
          order: 1
        },
        {
          title: 'YouTube Vlog Edit',
          category: 'youtube',
          description: 'Dynamic vlog editing with engaging transitions and sound effects',
          videoUrl: 'https://www.youtube.com/embed/sample2',
          thumbnail: '',
          duration: '5:15',
          client: 'Travel Vlogger',
          tags: ['vlog', 'travel', 'dynamic'],
          isFeatured: true,
          order: 2
        },
        {
          title: 'Commercial Advertisement',
          category: 'commercial',
          description: 'High-energy commercial advertisement with stunning visual effects',
          videoUrl: 'https://www.youtube.com/embed/sample3',
          thumbnail: '',
          duration: '0:45',
          client: 'Brand X',
          tags: ['commercial', 'advertising', 'high-energy'],
          isFeatured: true,
          order: 3
        }
      ];

      await Portfolio.insertMany(sampleProjects);
      console.log('✅ Sample portfolio data created');
    } else {
      console.log('⚠️ Portfolio data already exists');
    }

    console.log('🎉 Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();