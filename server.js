const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');

// Single Express app serving static frontend and API under /api
const app = express();

// Static frontend files
app.use(express.static(path.join(__dirname)));

// CORS (allow same-origin requests; API will be consumed from same host) and JSON parsing
app.use(cors());
app.use(express.json());

// Simple request logger to aid debugging (method, path, small body)
app.use((req, res, next) => {
  try {
    const shortBody = req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : '';
    console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} ${shortBody}`);
  } catch (e) {
    console.log('[REQ] logger error', e.message);
  }
  next();
});

// (Optional) serve explicit routes for files if needed - static middleware handles these
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// Backend API server (port 8080)
// const apiApp = express();

// Middleware for API
// apiApp.use(cors());
// apiApp.use(express.json());

// MongoDB Connection - require MONGO_URI to be set and use container-friendly defaults
if (!process.env.MONGO_URI || typeof process.env.MONGO_URI !== 'string' || process.env.MONGO_URI.trim() === '') {
  console.error('FATAL: MONGO_URI environment variable is not set or is empty.\n' +
    'Set MONGO_URI (for example from MongoDB Atlas) before starting the app.');
  // Exit so the hosting platform shows a clear failure instead of noisy mongoose errors
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// API Routes (served by apiApp on BACKEND_PORT)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Kronos API is running' });
});

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { employeeId, password, role } = req.body;

    const user = await User.findOne({ employeeId, role, isActive: true });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { employeeId: user.employeeId, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        department: user.department,
        position: user.position
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ employeeId: req.user.employeeId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      email: user.email,
      department: user.department,
      position: user.position,
      joinDate: user.joinDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await User.find({ isActive: true }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance records
app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'employee') {
      query.employeeId = req.user.employeeId;
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check-in/Check-out
app.post('/api/attendance/checkin', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employeeId: req.user.employeeId,
      date: today
    });

    if (attendance) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    attendance = new Attendance({
      employeeId: req.user.employeeId,
      date: today,
      checkIn: new Date()
    });

    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/attendance/checkout', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: req.user.employeeId,
      date: today
    });

    if (!attendance) {
      return res.status(400).json({ error: 'No check-in record found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    attendance.checkOut = new Date();
    const checkInTime = attendance.checkIn.getTime();
    const checkOutTime = attendance.checkOut.getTime();
    attendance.totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

    await attendance.save();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leave requests
app.get('/api/leaves', authenticateToken, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'employee') {
      query.employeeId = req.user.employeeId;
    }

    const leaves = await Leave.find(query).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit leave request
app.post('/api/leaves', authenticateToken, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const leave = new Leave({
      employeeId: req.user.employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason
    });

    await leave.save();
    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve/Reject leave (admin only)
app.put('/api/leaves/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, comments } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    leave.status = status;
    leave.approvedBy = req.user.employeeId;
    leave.approvalDate = new Date();
    if (comments) {
      leave.comments = comments;
    }

    await leave.save();
    res.json(leave);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { employeeId, newPassword } = req.body;

    const user = await User.findOne({ employeeId, isActive: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start single server on BACKEND_PORT (default 7000) so frontend and API share origin
// Bind to 0.0.0.0 so container platforms (Render, Docker) can accept external connections
const PORT = process.env.PORT || process.env.BACKEND_PORT || 7000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Kronos server (frontend+API) running on http://${HOST === '0.0.0.0' ? '0.0.0.0' : HOST}:${PORT}`);
});