const express = require('express');
// Make sure router is correctly instantiated
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Add a simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'User routes are working!' });
});

// GET all users
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/users endpoint called');
    const users = await User.find().select('-password');
    console.log('Found users:', users);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Create new user
    const user = new User({
      username,
      password,
      role: role || 'viewer'
    });
    
    await user.save();
    
    res.status(201).json({ 
      message: 'User created successfully',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      userId: user._id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.patch('/profile/:id', async (req, res) => {
  try {
    const { username } = req.body;
    
    // Check if username is taken by someone else
    const existingUser = await User.findOne({ 
      username, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Change password
router.post('/change-password/:id', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// CRUD operations for admin

// Update user (admin only)
router.patch('/:id', async (req, res) => {
  try {
    const updates = {...req.body};
    
    // If password is included, we need to handle it separately
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      updates,
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Make sure router is properly exported
module.exports = router;
