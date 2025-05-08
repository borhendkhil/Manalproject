const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  serial_number: {
    type: String,
    required: true,
    trim: true
  },
  localisation: {
    type: String,
    required: true,
    trim: true
  },
  last_service: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add pre-save hook for debugging
machineSchema.pre('save', function(next) {
  console.log('Pre-save hook triggered for machine:', this);
  next();
});

// Add pre-findOneAndUpdate hook for debugging
machineSchema.pre('findOneAndUpdate', function(next) {
  console.log('Pre-update hook triggered. Update:', this.getUpdate());
  next();
});

module.exports = mongoose.model('Machine', machineSchema);
