const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const empId = 'EMP001';

  const user = await User.findOne({ employeeId: empId });
  if (!user) {
    console.error('User not found:', empId);
    process.exit(1);
  }

  // Simulate check-in
  const today = new Date();
  const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let attendance = await Attendance.findOne({ employeeId: empId, date: dateOnly });
  if (attendance) {
    console.log('Already checked in today:', attendance);
  } else {
    attendance = new Attendance({ employeeId: empId, date: dateOnly, checkIn: new Date() });
    await attendance.save();
    console.log('Check-in saved:', attendance);
  }

  // Simulate check-out
  attendance = await Attendance.findOne({ employeeId: empId, date: dateOnly });
  if (!attendance) {
    console.log('No attendance record to checkout');
  } else if (attendance.checkOut) {
    console.log('Already checked out:', attendance.checkOut);
  } else {
    attendance.checkOut = new Date();
    const checkInTime = attendance.checkIn.getTime();
    const checkOutTime = attendance.checkOut.getTime();
    attendance.totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    await attendance.save();
    console.log('Checked out, updated record:', attendance);
  }

  // Simulate leave submission
  const start = new Date(); start.setDate(start.getDate() + 1);
  const end = new Date(); end.setDate(end.getDate() + 2);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const leave = new Leave({ employeeId: empId, leaveType: 'annual', startDate: start, endDate: end, totalDays, reason: 'Automated test leave' });
  await leave.save();
  console.log('Leave submitted:', leave);

  await mongoose.disconnect();
  console.log('Done');
}

run().catch(err => { console.error(err); process.exit(1); });
