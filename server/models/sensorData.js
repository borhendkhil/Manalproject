const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  temperature1: {
    type: Number,
    default: 0
  },
  temperature2: {
    type: Number,
    default: 0
  },
  temperature3: {
    type: Number,
    default: 0
  },
  temperature4: {
    type: Number,
    default: 0
  },
  speed1: {
    type: Number,
    default: 0
  },
  speed2: {
    type: Number,
    default: 0
  },
  speed3: {
    type: Number,
    default: 0
  },
  speed4: {
    type: Number,
    default: 0
  },
  door1_state: {
    type: Boolean,
    default: false
  },
  door2_state: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
