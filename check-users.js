const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`ID: ${user.employeeId}, Role: ${user.role}, Password hash: ${user.password}`);
    });

    // Test password comparison
    const admin = await User.findOne({ employeeId: 'ADMIN001' });
    if (admin) {
      const isValid = await bcrypt.compare('admin', admin.password);
      console.log(`Admin password 'admin' valid: ${isValid}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();