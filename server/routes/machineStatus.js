const express = require('express');
const router = express.Router();
const MachineStatus = require('../models/machineStatus');
const Machine = require('../models/machine');

// Get all machine statuses
router.get('/', async (req, res) => {
  try {
    const statuses = await MachineStatus.find()
      .populate('machine', 'name model serial_number')
      .sort({ timestamp: -1 });
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching machine statuses:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get latest status for a specific machine
router.get('/machine/:machineId', async (req, res) => {
  try {
    console.log(`Fetching status for machine ${req.params.machineId}`);
    
    // Check if machine exists
    const machineExists = await Machine.findById(req.params.machineId);
    if (!machineExists) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    // Find the latest status
    const status = await MachineStatus.findOne({ machine: req.params.machineId })
      .sort({ timestamp: -1 })
      .populate('changed_by', 'username');
    
    // If no status found, return a default one
    if (!status) {
      const defaultStatus = {
        machine: req.params.machineId,
        status: 'offline',
        timestamp: new Date()
      };
      return res.json(defaultStatus);
    }
    
    res.json(status);
  } catch (error) {
    console.error('Error fetching machine status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get status history for a machine
router.get('/history/:machineId', async (req, res) => {
  try {
    const history = await MachineStatus.find({ machine: req.params.machineId })
      .populate('changed_by', 'username')
      .sort({ timestamp: -1 })
      .limit(20);
    res.json(history);
  } catch (error) {
    console.error('Error fetching status history:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new machine status
router.post('/', async (req, res) => {
  try {
    const { machine, status, changed_by } = req.body;
    
    // Validate machine exists
    const machineExists = await Machine.findById(machine);
    if (!machineExists) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    const machineStatus = new MachineStatus({
      machine,
      status,
      changed_by
    });
    
    const savedStatus = await machineStatus.save();
    res.status(201).json(savedStatus);
  } catch (error) {
    console.error('Error saving machine status:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
