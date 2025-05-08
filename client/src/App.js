import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Layout
import Dashboard from './components/layout/Dashboard';

// Pages
import Home from './pages/Home';
import MachineInfo from './pages/MachineInfo';
import MachineControl from './pages/MachineControl';
import MachineSurveillance from './pages/MachineSurveillance';
import Alerts from './pages/Alerts';
import History from './pages/History';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in via token
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" /> : <Login setIsAuthenticated={setIsAuthenticated} />
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/" /> : <Register />
          } />

          {/* Dashboard/protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard setIsAuthenticated={setIsAuthenticated} />
            </ProtectedRoute>
          }>
            <Route index element={<Home />} />
            <Route path="machine-info" element={<MachineInfo />} />
            <Route path="machine-control" element={<MachineControl />} />
            <Route path="machine-surveillance" element={<MachineSurveillance />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
