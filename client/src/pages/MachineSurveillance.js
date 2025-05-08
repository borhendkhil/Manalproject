import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, Typography, Grid, CircularProgress, 
  Paper, alpha, useTheme, Card, CardContent, CardHeader,
  Stack, Chip, IconButton, Tooltip
} from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import SpeedIcon from '@mui/icons-material/Speed';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { getMachines, getLatestSensorData } from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function MachineSurveillance() {
  const [machines, setMachines] = useState([]);
  const [currentMachine, setCurrentMachine] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const timerRef = useRef(null);

  const theme = useTheme();

  // Memoize fetchSensorData to avoid recreating the function on every render
  const fetchSensorData = useCallback(async (machineId) => {
    if (!machineId) return;
    
    try {
      setIsRefreshing(true);
      const response = await getLatestSensorData(machineId);
      console.log("Received sensor data:", response.data);
      setSensorData(response.data);
      setLastUpdated(new Date());
      setSecondsSinceUpdate(0); // Reset timer
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      // Set default values when there's an error but don't update lastUpdated
      setSensorData(prev => prev || {
        temperature1: 0, temperature2: 0, temperature3: 0, temperature4: 0,
        speed1: 0, speed2: 0, speed3: 0, speed4: 0,
        door1_state: false, door2_state: false,
        timestamp: new Date()
      });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Setup timer for seconds since last update
  useEffect(() => {
    if (lastUpdated) {
      timerRef.current = setInterval(() => {
        const seconds = Math.floor((new Date() - lastUpdated) / 1000);
        setSecondsSinceUpdate(seconds);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [lastUpdated]);

  useEffect(() => {
    // Fetch machines
    const fetchMachines = async () => {
      try {
        const response = await getMachines();
        setMachines(response.data);
        
        // Auto-select the first machine
        if (response.data.length > 0) {
          setCurrentMachine(response.data[0]);
          // Set up polling for the first machine
          setupPolling(response.data[0]._id);
        }
      } catch (error) {
        console.error('Error fetching machines:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMachines();

    // Clean up function
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  // Function to set up data polling
  const setupPolling = useCallback((machineId) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Fetch immediately
    fetchSensorData(machineId);
    
    // Set up polling every 5 seconds
    const interval = setInterval(() => {
      fetchSensorData(machineId);
    }, 5000);
    
    setPollingInterval(interval);
    
    return interval;
  }, [fetchSensorData, pollingInterval]);

  const handleManualRefresh = () => {
    if (currentMachine) {
      fetchSensorData(currentMachine._id);
    }
  };

  // Format seconds into a readable time
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      return `${min}m ${sec}s`;
    }
    const hr = Math.floor(seconds / 3600);
    const min = Math.floor((seconds % 3600) / 60);
    return `${hr}h ${min}m`;
  };

  // Helper for status color - simplified to just three states
  const getStatusColor = (value, thresholds) => {
    const { warning, critical } = thresholds;
    if (value > critical) return theme.palette.error.main;
    if (value > warning) return theme.palette.warning.main;
    return theme.palette.primary.main;
  };

  // Helper to render monitoring card with consistent styling
  const renderMonitoringCard = (icon, title, value, unit, status, subtitle) => {
    return (
      <Card 
        elevation={2} 
        sx={{ 
          height: '100%',
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: theme.palette.background.paper,
          transition: 'transform 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 16px ${alpha(theme.palette.common.black, 0.08)}`
          }
        }}
      >
        <CardHeader
          avatar={icon}
          title={
            <Typography variant="subtitle1" color="textPrimary" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
          }
          sx={{ pb: 0 }}
        />
        <CardContent>
          <Typography variant="h4" sx={{ fontWeight: 600, color: status }}>
            {value}
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
              {unit}
            </Typography>
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '80vh'
      }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Chargement des données...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header with detailed timestamp instead of simple timer */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 4, 
          borderRadius: 1,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
          <DashboardIcon sx={{ fontSize: 24, color: theme.palette.primary.main, mr: 1.5 }} />
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            {currentMachine ? `${currentMachine.name} - ${currentMachine.model}` : 'Surveillance de Machine'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Use detailed timestamp instead of simple timer */}
          {lastUpdated && (
            <Chip
              icon={<AccessTimeIcon fontSize="small" />}
              label={`Dernière mise à jour: ${format(lastUpdated, 'dd MMMM yyyy à HH:mm:ss', { locale: fr })}`}
              variant="outlined"
              size="small"
              color={isRefreshing ? "primary" : "default"}
              sx={{ 
                borderColor: alpha(theme.palette.primary.main, 0.3),
                color: theme.palette.text.primary
              }}
            />
          )}
          
          <Tooltip title="Rafraîchir les données">
            <IconButton 
              onClick={handleManualRefresh}
              size="small"
              disabled={isRefreshing}
              sx={{ 
                border: `1px solid ${theme.palette.divider}`,
                position: 'relative'
              }}
            >
              {isRefreshing ? (
                <CircularProgress size={16} thickness={4} />
              ) : (
                <RefreshIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
      
      {/* Remove the second timer since we've moved it to the header */}
      
      {!currentMachine ? (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 1
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Veuillez sélectionner une machine pour visualiser les données
          </Typography>
        </Paper>
      ) : !sensorData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        <Box>
          {/* Temperatures */}
          <Box sx={{ mb: 4 }}>
            <Stack 
              direction="row" 
              alignItems="center" 
              spacing={1} 
              sx={{ 
                mb: 2, 
                pb: 1, 
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              <ThermostatIcon sx={{ color: theme.palette.text.secondary }} />
              <Typography variant="h6">
                Températures
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              {[
                { title: 'Zone principale', value: sensorData.temperature1, thresholds: { warning: 70, critical: 85 } },
                { title: 'Moteur', value: sensorData.temperature2, thresholds: { warning: 70, critical: 85 } },
                { title: 'Composants', value: sensorData.temperature3, thresholds: { warning: 70, critical: 85 } },
                { title: 'Environnement', value: sensorData.temperature4, thresholds: { warning: 70, critical: 85 } }
              ].map((temp, index) => (
                <Grid item xs={12} sm={6} lg={3} key={`temp-${index}`}>
                  {renderMonitoringCard(
                    <ThermostatIcon color="primary" />,
                    temp.title,
                    temp.value || 0,
                    '°C',
                    getStatusColor(temp.value || 0, temp.thresholds),
                    temp.value > temp.thresholds.critical ? 'Température critique' :
                    temp.value > temp.thresholds.warning ? 'Température élevée' : 'Température normale'
                  )}
                </Grid>
              ))}
            </Grid>
          </Box>
          
          {/* Speeds */}
          <Box sx={{ mb: 4 }}>
            <Stack 
              direction="row" 
              alignItems="center" 
              spacing={1} 
              sx={{ 
                mb: 2, 
                pb: 1, 
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              <SpeedIcon sx={{ color: theme.palette.text.secondary }} />
              <Typography variant="h6">
                Vitesses
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              {[
                { title: 'Moteur principal', value: sensorData.speed1, thresholds: { warning: 800, critical: 1200 } },
                { title: 'Ventilateur', value: sensorData.speed2, thresholds: { warning: 800, critical: 1200 } },
                { title: 'Convoyeur', value: sensorData.speed3, thresholds: { warning: 800, critical: 1200 } },
                { title: 'Pompe auxiliaire', value: sensorData.speed4, thresholds: { warning: 800, critical: 1200 } }
              ].map((speed, index) => (
                <Grid item xs={12} sm={6} lg={3} key={`speed-${index}`}>
                  {renderMonitoringCard(
                    <SpeedIcon color="primary" />,
                    speed.title,
                    speed.value || 0,
                    'tr/min',
                    getStatusColor(speed.value || 0, speed.thresholds),
                    speed.value > speed.thresholds.critical ? 'Vitesse excessive' :
                    speed.value > speed.thresholds.warning ? 'Vitesse élevée' : 'Vitesse normale'
                  )}
                </Grid>
              ))}
            </Grid>
          </Box>
          
          {/* Door States */}
          <Box>
            <Stack 
              direction="row" 
              alignItems="center" 
              spacing={1} 
              sx={{ 
                mb: 2, 
                pb: 1, 
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              <DoorFrontIcon sx={{ color: theme.palette.text.secondary }} />
              <Typography variant="h6">
                État des Accès
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              {[
                { title: 'Porte principale', state: sensorData.door1_state },
                { title: 'Porte de maintenance', state: sensorData.door2_state }
              ].map((door, index) => (
                <Grid item xs={12} sm={6} key={`door-${index}`}>
                  {renderMonitoringCard(
                    <DoorFrontIcon color="primary" />,
                    door.title,
                    door.state ? 'Ouverte' : 'Fermée',
                    '',
                    door.state ? theme.palette.error.main : theme.palette.success.main,
                    door.state ? 'Accès non sécurisé' : 'Accès sécurisé'
                  )}
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default MachineSurveillance;
