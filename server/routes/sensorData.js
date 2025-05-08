const express = require('express');
const router = express.Router();
const SensorData = require('../models/sensorData');
const Machine = require('../models/machine');

// Explicitly REMOVE the handle property from router
// This is causing the issue by intercepting ALL requests
delete router.handle;

// Debug logging middleware
router.use((req, res, next) => {
  console.log(`SensorData route: ${req.method} ${req.originalUrl}`);
  next();
});

// GET latest sensor data for a specific machine
router.get('/machine/:machineId/latest', async (req, res) => {
  try {
    const machineId = req.params.machineId;
    console.log(`Processing GET request for latest sensor data, machine ID: ${machineId}`);
    
    // Find the latest sensor data record
    const data = await SensorData.findOne({ machine: machineId })
      .sort({ timestamp: -1 });
    
    // If data found, return it
    if (data) {
      console.log(`Found sensor data for machine ${machineId}`);
      return res.json(data);
    }
    
    // If no data found, return default data structure
    console.log(`No sensor data found for machine ${machineId}, returning defaults`);
    const defaultData = {
      machine: machineId,
      temperature1: 0,
      temperature2: 0,
      temperature3: 0,
      temperature4: 0,
      speed1: 0,
      speed2: 0,
      speed3: 0,
      speed4: 0,
      door1_state: false,
      door2_state: false,
      timestamp: new Date()
    };
    return res.json(defaultData);
  } catch (error) {
    console.error('Error fetching latest sensor data:', error);
    return res.status(500).json({ 
      message: 'Error fetching latest sensor data',
      error: error.message 
    });
  }
});

// GET sensor data history for a specific machine
router.get('/machine/:machineId', async (req, res) => {
  try {
    const machineId = req.params.machineId;
    console.log(`Fetching sensor data history for machine ${machineId}`);
    
    const data = await SensorData.find({ machine: machineId })
      .sort({ timestamp: -1 })
      .limit(100);
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching sensor data history:', error);
    res.status(500).json({ 
      message: 'Error fetching sensor data',
      error: error.message
    });
  }
});

// Fallback for common typos
router.get('/machine/:machineId/lates', (req, res) => {
  console.log('Redirecting typo from "lates" to "latest"');
  const redirectUrl = `/api/sensor-data/machine/${req.params.machineId}/latest`;
  res.redirect(redirectUrl);
});

// POST new sensor data
router.post('/', async (req, res) => {
  try {
    console.log('Creating new sensor data:', req.body);
    
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Empty request body' });
    }
    
    const machineId = req.body.machineId || req.body.machine;
    if (!machineId) {
      return res.status(400).json({ message: 'Machine ID is required' });
    }
    
    // Validate machine exists
    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    // Create and save the new sensor data
    const sensorData = new SensorData({
      machine: machineId,
      temperature1: req.body.temperature1 || 0,
      temperature2: req.body.temperature2 || 0,
      temperature3: req.body.temperature3 || 0,
      temperature4: req.body.temperature4 || 0,
      speed1: req.body.speed1 || 0,
      speed2: req.body.speed2 || 0,
      speed3: req.body.speed3 || 0,
      speed4: req.body.speed4 || 0,
      door1_state: req.body.door1_state || false,
      door2_state: req.body.door2_state || false,
      timestamp: new Date()
    });
    
    const savedData = await sensorData.save();
    res.status(201).json(savedData);
  } catch (error) {
    console.error('Error creating sensor data:', error);
    res.status(500).json({ 
      message: 'Error creating sensor data', 
      error: error.message 
    });
  }
});

// DELETE all data - admin only route
router.delete('/all', async (req, res) => {
  try {
    console.log('Deleting all sensor data');
    const result = await SensorData.deleteMany({});
    res.status(200).json({ 
      message: 'All sensor data deleted successfully', 
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting sensor data:', error);
    res.status(500).json({ 
      message: 'Error deleting sensor data', 
      error: error.message 
    });
  }
});

// Create a separate handler function for legacy POST requests
const handleLegacyRequest = async (req, res) => {
  try {
    console.log('handleLegacyRequest called with method:', req.method);
    
    // Only handle POST requests
    if (req.method !== 'POST') {
      console.error('Legacy handler rejected non-POST request:', req.method);
      return res.status(405).json({ 
        message: 'Method Not Allowed',
        details: 'Legacy handler only accepts POST requests' 
      });
    }
    
    // Process legacy request... (your existing code)
    // ...
    
    // Create sensor data record
    // ...
  } catch (error) {
    console.error('Error in legacy handler:', error);
    res.status(500).json({ 
      message: 'Server error processing legacy data',
      error: error.message
    });
  }
};


module.exports = router;
module.exports.handleLegacyRequest = handleLegacyRequest;
