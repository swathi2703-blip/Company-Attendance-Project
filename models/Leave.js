const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    ref: 'User'
  },
  leaveType: {
    type: String,
    enum: ['annual', 'sick', 'maternity', 'paternity', 'emergency'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: String,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  comments: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Leave', leaveSchema);