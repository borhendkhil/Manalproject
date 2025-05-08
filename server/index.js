const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares - ensure these come before route registrations
app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Add request body debug middleware
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log('DEBUG - Incoming request to:', req.originalUrl);
    console.log('DEBUG - Content-Type:', req.headers['content-type']);
    console.log('DEBUG - Body:', req.body);
  }
  next();
});

// Routes
const machineRoutes = require('./routes/machine');
const sensorDataRoutes = require('./routes/sensorData');
const machineStatusRoutes = require('./routes/machineStatus');
const alertRoutes = require('./routes/alert');
const userRoutes = require('./routes/user');

// Debug - log available routes
console.log('Available routes in userRoutes:', Object.keys(userRoutes));
console.log('Is userRoutes a router?', typeof userRoutes.get === 'function');

// Add a test route to verify Express is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Add a specific test route for user endpoint
app.get('/api/test-users', (req, res) => {
  res.json({ message: 'Users test route is working!' });
});

// Legacy endpoint - now reroutes to the sensor data endpoint
app.post('/api/machine-status', async (req, res) => {
  try {
    console.log('Legacy endpoint called with body:', req.body);
    
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        message: 'Method Not Allowed',
        details: 'This endpoint only accepts POST requests' 
      });
    }
    
    // Check if req.body exists, if not, create a default object
    const body = req.body || {};
    
    // Create modified request with method explicitly set
    const modifiedReq = {
      method: 'POST',
      body: {
        machineId: body.machineId,
        temperature1: body.temperature1 || 0,
        temperature2: body.temperature2 || 0,
        temperature3: body.temperature3 || 0,
        temperature4: body.temperature4 || 0,
        door1_state: body.door1Open || false,
        door2_state: body.door2Open || false
      }
    };
    
    // Use the sensor data handler function with our modified request
    // Access the legacy handler directly from the import
    return sensorDataRoutes.handleLegacyRequest(modifiedReq, res);
  } catch (error) {
    console.error('Error processing legacy request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Connect to MongoDB before setting up routes
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
  
  // Try to import User model directly to confirm it loads
  try {
    const User = require('./models/user');
    console.log('User model loaded successfully');
  } catch (err) {
    console.error('Failed to load User model:', err);
  }
  
  // Only register routes after MongoDB is connected
  console.log('Registering routes...');
  
  // Register routes with more detailed logging
  console.log('Registering /api/machines route');
  app.use('/api/machines', machineRoutes);
  
  console.log('Registering /api/sensor-data route');

  app.use('/api/sensor-data', sensorDataRoutes);
  
  console.log('Registering /api/machine-status route');
  app.use('/api/machine-status', machineStatusRoutes);
  
  console.log('Registering /api/alerts route');
  app.use('/api/alerts', alertRoutes);
  
  console.log('Registering /api/users route');
  app.use('/api/users', userRoutes);
  console.log('User routes registered');
  
  // Create a test user if none exists
  setTimeout(async () => {
    try {
      const User = require('./models/user');
      const adminExists = await User.findOne({ role: 'admin' });
      if (!adminExists) {
        console.log('Creating default admin user...');
        const admin = new User({
          username: 'admin',
          password: 'admin123',
          role: 'admin'
        });
        await admin.save();
        console.log('Default admin user created');
      } else {
        console.log('Admin user already exists');
      }
    } catch (err) {
      console.error('Failed to check/create admin user:', err);
    }
  }, 1000);
  
  // Print detailed router info for debugging
  console.log('User routes stack:', userRoutes.stack?.map(r => r.route?.path || 'middleware'));
  
  // Route middlewares
  app.use('/api/machines', machineRoutes);
  app.use('/api/sensor-data', sensorDataRoutes);
  app.use('/api/machine-status', machineStatusRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/users', userRoutes);
  
  // Add a direct handler for /api/users to debug the issue
  app.get('/api/users-direct', async (req, res) => {
    try {
      const User = require('./models/user');
      const users = await User.find().select('-password');
      res.json(users);
    } catch (error) {
      console.error('Direct user fetch error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Start server only after MongoDB is connected
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('MongoDB Connection Error:', err);
});
