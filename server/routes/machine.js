const express = require('express');
const router = express.Router();
const Machine = require('../models/machine');

// Get all machines
router.get('/', async (req, res) => {
  try {
    const machines = await Machine.find();
    res.json(machines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get one machine
router.get('/:id', async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) return res.status(404).json({ message: 'Machine not found' });
    res.json(machine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a machine
router.post('/', async (req, res) => {
  const machine = new Machine(req.body);
  try {
    const newMachine = await machine.save();
    res.status(201).json(newMachine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a machine
router.patch('/:id', async (req, res) => {
  try {
    console.log('Updating machine with ID:', req.params.id);
    console.log('Update data received:', req.body);
    
    // Process date fields properly
    const updateData = { ...req.body };
    if (updateData.last_service) {
      updateData.last_service = new Date(updateData.last_service);
      console.log('Converted last_service to Date object:', updateData.last_service);
    }
    
    // Ensure we're using findByIdAndUpdate correctly with runValidators
    const machine = await Machine.findByIdAndUpdate(
      req.params.id, 
      updateData,
      { 
        new: true, 
        runValidators: true,
        // Return the complete document to the client
        returnDocument: 'after'
      }
    );
    
    if (!machine) {
      console.log('Machine not found for update');
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    console.log('Machine updated successfully, returning:', machine);
    res.json(machine);
  } catch (error) {
    console.error('Error updating machine:', error);
    // Send detailed error information
    res.status(400).json({ 
      message: 'Error updating machine',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete a machine
router.delete('/:id', async (req, res) => {
  try {
    const machine = await Machine.findByIdAndDelete(req.params.id);
    if (!machine) return res.status(404).json({ message: 'Machine not found' });
    res.json({ message: 'Machine deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



