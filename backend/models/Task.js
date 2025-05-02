const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'finished'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date
  },
  estimatedHours: {
    type: Number
  },
  actualHours: {
    type: Number
  },
  isOverdue: {
    type: Boolean,
    default: false
  },
  notifications: [{
    message: String,
    type: {
      type: String,
      enum: ['status_change', 'deadline_approaching', 'overdue', 'assignment'],
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Add middleware to check for overdue tasks
taskSchema.pre('save', function(next) {
  if (this.dueDate && this.status !== 'finished') {
    this.isOverdue = new Date() > new Date(this.dueDate);
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema); 