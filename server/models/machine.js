const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  vitesse: Number,
  temperature: Number,
  etat: String,
  alerte: String
}, { timestamps: true });

module.exports = mongoose.model('Machine', machineSchema);
