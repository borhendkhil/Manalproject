const express = require('express');
const router = express.Router();
const Alert = require('../models/alert');

// Get all active alerts
router.get('/active', async (req, res) => {
  try {
    const alerts = await Alert.find({ is_active: true })
      .populate('machine', 'name model serial_number')
      .sort({ created_at: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate('machine', 'name model serial_number')
      .sort({ created_at: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get alerts for a specific machine
router.get('/machine/:machineId', async (req, res) => {
  try {
    const alerts = await Alert.find({ machine: req.params.machineId })
      .sort({ created_at: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new alert
router.post('/', async (req, res) => {
  try {
    const alert = new Alert(req.body);
    const newAlert = await alert.save();
    res.status(201).json(newAlert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Resolve an alert
router.patch('/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    
    alert.is_active = false;
    alert.resolved_at = new Date();
    await alert.save();
    
    res.json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
