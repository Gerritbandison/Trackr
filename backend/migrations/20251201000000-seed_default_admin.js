const bcrypt = require('bcryptjs');

module.exports = {
  async up(db, client) {
    // Check if admin user already exists
    const existingAdmin = await db.collection('users').findOne({ email: 'admin@company.com' });

    if (existingAdmin) {
      console.log('⚠️  Default admin user already exists, skipping seed');
      return;
    }

    // Hash the default password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create default admin user
    await db.collection('users').insertOne({
      email: 'admin@company.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'admin',
      department: 'IT',
      isActive: true,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✓ Created default admin user (admin@company.com / password123)');
    console.log('⚠️  IMPORTANT: Change the default password immediately after first login!');
  },

  async down(db, client) {
    // Remove the default admin user
    await db.collection('users').deleteOne({ email: 'admin@company.com' });
    console.log('✓ Removed default admin user');
  }
};
