const mongoose = require('mongoose');

const preventiveCareSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  careType: {
    type: String,
    enum: ['vaccination', 'screening', 'health-check', 'wellness-program', 'health-education'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  scheduledDate: {
    type: Date,
    required: true
  },
  completedDate: Date,
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'overdue', 'cancelled'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  recommendations: [String],
  notes: String,
  nextDueDate: Date,
  frequency: {
    type: String,
    enum: ['one-time', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'one-time'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  timestamps: true
});

// Index for efficient queries
preventiveCareSchema.index({ patient: 1, scheduledDate: 1 });
preventiveCareSchema.index({ status: 1, scheduledDate: 1 });

module.exports = mongoose.model('PreventiveCare', preventiveCareSchema);

