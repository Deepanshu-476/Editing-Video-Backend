const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

const initAdmin = async () => {
  try {
    // Check if any admin exists
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      console.log('📝 No admin found. Creating default admins...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admins = [
        {
          name: 'Admin One',
          email: 'admin1@editflow.com',
          password: hashedPassword,
          role: 'superadmin',
          isActive: true,
          createdAt: new Date()
        },
        {
          name: 'Admin Two',
          email: 'admin2@editflow.com',
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      await Admin.insertMany(admins);
      
      console.log('✅ Default admins created successfully!');
      console.log('📋 Login Credentials:');
      console.log('   admin1@editflow.com / admin123');
      console.log('   admin2@editflow.com / admin123');
    } else {
      console.log(`✅ ${adminCount} admin(s) already exist.`);
    }
  } catch (error) {
    console.error('❌ Error creating admins:', error.message);
  }
};

module.exports = initAdmin;