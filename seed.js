const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Clear existing data
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});

    // Create admin user
    const adminPassword = await bcrypt.hash('admin', 10);
    const admin = new User({
      employeeId: 'ADMIN001',
      password: adminPassword,
      role: 'admin',
      name: 'System Admin',
      email: 'admin@kronos.com',
      department: 'IT',
      position: 'Administrator'
    });
    await admin.save();

    // Create sample employees
    const employeeData = [
      {
        employeeId: 'EMP001',
        password: await bcrypt.hash('emp', 10),
        role: 'employee',
        name: 'John Doe',
        email: 'john@kronos.com',
        department: 'Engineering',
        position: 'Software Developer'
      },
      {
        employeeId: 'EMP002',
        password: await bcrypt.hash('emp', 10),
        role: 'employee',
        name: 'Jane Smith',
        email: 'jane@kronos.com',
        department: 'HR',
        position: 'HR Manager'
      },
      {
        employeeId: 'EMP003',
        password: await bcrypt.hash('emp', 10),
        role: 'employee',
        name: 'Bob Johnson',
        email: 'bob@kronos.com',
        department: 'Finance',
        position: 'Accountant'
      }
    ];

    for (const emp of employeeData) {
      const employee = new User(emp);
      await employee.save();
    }

    // Create sample attendance records
    const today = new Date();
    const attendanceData = [
      {
        employeeId: 'EMP001',
        date: today,
        checkIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
        checkOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 30),
        totalHours: 8.5,
        status: 'present'
      },
      {
        employeeId: 'EMP002',
        date: today,
        checkIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 45),
        checkOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 15),
        totalHours: 8.5,
        status: 'present'
      }
    ];

    for (const att of attendanceData) {
      const attendance = new Attendance(att);
      await attendance.save();
    }

    // Create sample leave requests
    const leaveData = [
      {
        employeeId: 'EMP001',
        leaveType: 'annual',
        startDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
        endDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 3 days later
        totalDays: 4,
        reason: 'Family vacation',
        status: 'pending'
      },
      {
        employeeId: 'EMP002',
        leaveType: 'sick',
        startDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        endDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        totalDays: 1,
        reason: 'Medical appointment',
        status: 'approved',
        approvedBy: 'ADMIN001',
        approvalDate: today
      }
    ];

    for (const leave of leaveData) {
      const leaveRecord = new Leave(leave);
      await leaveRecord.save();
    }

    console.log('Database seeded successfully!');
    console.log('Admin login: ADMIN001 / admin');
    console.log('Employee login: EMP001 / emp, EMP002 / emp, EMP003 / emp');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();