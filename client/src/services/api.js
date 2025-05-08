import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with authorization header
const apiClient = axios.create({
  baseURL: API_URL
});

// Add authorization header to requests if token exists
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Authentication
export const login = async (credentials) => {
  const response = await axios.post(`${API_URL}/users/login`, credentials);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const register = async (userData) => {
  return await axios.post(`${API_URL}/users/register`, userData);
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Machines
export const getMachines = async () => {
  return await apiClient.get(`/machines`);
};

export const getMachine = async (id) => {
  return await apiClient.get(`/machines/${id}`);
};

// Create a machine
export const createMachine = async (machineData) => {
  return await apiClient.post('/machines', machineData);
};

// Update a machine
export const updateMachine = async (machineId, machineData) => {
  console.log(`Making PATCH request to /machines/${machineId} with data:`, machineData);
  try {
    const response = await apiClient.patch(`/machines/${machineId}`, machineData);
    console.log('Update machine response:', response.data);
    return response;
  } catch (error) {
    console.error('API error updating machine:', error.response?.data || error.message);
    throw error;
  }
};

// Sensor Data
export const getLatestSensorData = async (machineId) => {
  try {
    console.log(`Fetching latest sensor data for machine: ${machineId}`);
    
    const response = await apiClient.get(`/sensor-data/machine/${machineId}/latest`);
    console.log('Received sensor data response:', response.data);
    return response;
  } catch (error) {
    console.error(`Failed to get latest sensor data for machine ${machineId}:`, error);
    
    // Return a valid response object with default data instead of throwing
    return {
      data: {
        machine: machineId,
        temperature1: 0, temperature2: 0, temperature3: 0, temperature4: 0,
        speed1: 0, speed2: 0, speed3: 0, speed4: 0,
        door1_state: false, door2_state: false,
        timestamp: new Date()
      }
    };
  }
};

export const getSensorDataHistory = async (machineId) => {
  return await apiClient.get(`/sensor-data/machine/${machineId}`);
};

// Machine Status
export const getMachineStatus = async (machineId) => {
  return await apiClient.get(`/machine-status/machine/${machineId}`);
};

export const updateMachineStatus = async (data) => {
  return await apiClient.post(`/machine-status`, data);
};

export const getMachineStatusHistory = async (machineId) => {
  return await apiClient.get(`/machine-status/history/${machineId}`);
};

// Alerts
export const getActiveAlerts = async () => {
  return await apiClient.get(`/alerts/active`);
};

export const getAllAlerts = async () => {
  return await apiClient.get(`/alerts`);
};

export const getMachineAlerts = async (machineId) => {
  return await apiClient.get(`/alerts/machine/${machineId}`);
};

export const resolveAlert = async (alertId) => {
  return await apiClient.patch(`/alerts/${alertId}/resolve`);
};

// Users (for admin)
export const getUsers = async () => {
  // Log the request for debugging
  console.log('Fetching users from:', `${API_URL}/users`);
  try {
    // Try the direct endpoint first
    try {
      const response = await apiClient.get(`/users-direct`);
      console.log('Direct users response:', response);
      return response;
    } catch (directError) {
      console.log('Direct endpoint failed, trying normal endpoint');
      // If that fails, try the regular endpoint
      const response = await apiClient.get(`/users`);
      console.log('Regular users response:', response);
      return response;
    }
  } catch (error) {
    console.error('Error in getUsers:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};

export const createUser = async (userData) => {
  return await apiClient.post(`/users`, userData);
};

export const updateUser = async (userId, userData) => {
  return await apiClient.patch(`/users/${userId}`, userData);
};

export const deleteUser = async (userId) => {
  return await apiClient.delete(`/users/${userId}`);
};

export const updateUserProfile = async (userId, userData) => {
  return await apiClient.patch(`/users/profile/${userId}`, userData);
};

export const changePassword = async (userId, passwordData) => {
  return await apiClient.post(`/users/change-password/${userId}`, passwordData);
};
