const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['temperature', 'door', 'speed', 'maintenance', 'other']
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical']
  },
  message: {
    type: String,
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  resolved_at: {
    type: Date
  }
});

module.exports = mongoose.model('Alert', alertSchema);
