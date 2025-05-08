import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, CardContent, Typography, Box, Button, CircularProgress } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorIcon from '@mui/icons-material/Error';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import SpeedIcon from '@mui/icons-material/Speed';
import { getMachines, getActiveAlerts, getLatestSensorData } from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function Home() {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sensorData, setSensorData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [machinesRes, alertsRes] = await Promise.all([
          getMachines(),
          getActiveAlerts()
        ]);
        
        setMachines(machinesRes.data);
        setAlerts(alertsRes.data);
        
        // Get latest sensor data for first machine
        if (machinesRes.data.length > 0) {
          const sensorRes = await getLatestSensorData(machinesRes.data[0]._id);
          setSensorData(sensorRes.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data', error);
        // Add error state handling here if needed
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Tableau de bord
      </Typography>
      
      <Grid container spacing={3}>
        {/* Machine Status Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statut des machines
              </Typography>
              
              {machines.length === 0 ? (
                <Typography>Aucune machine enregistrée</Typography>
              ) : (
                <Box>
                  {machines.map(machine => (
                    <Box key={machine._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography>{machine.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: 'success.main',
                            mr: 1 
                          }} 
                        />
                        <Typography variant="body2">En ligne</Typography>
                      </Box>
                    </Box>
                  ))}
                  <Button 
                    variant="outlined" 
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/machine-info')}
                  >
                    Voir la machine
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Alerts Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                Alertes actives
              </Typography>
              
              {alerts.length === 0 ? (
                <Typography>Aucune alerte active</Typography>
              ) : (
                <Box>
                  {alerts.slice(0, 3).map(alert => (
                    <Box key={alert._id} sx={{ mb: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {alert.message}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        {format(new Date(alert.created_at), 'dd MMM yyyy, HH:mm', { locale: fr })}
                      </Typography>
                    </Box>
                  ))}
                  
                  {alerts.length > 3 && (
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={() => navigate('/alerts')}
                    >
                      Voir toutes les alertes ({alerts.length})
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Latest Readings Card */}
        {sensorData && Object.keys(sensorData).length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Dernières mesures
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DeviceThermostatIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
                      <div>
                        <Typography variant="body2" color="text.secondary">
                          Température 1
                        </Typography>
                        <Typography variant="h6">
                          {sensorData.temperature1 || '--'}°C
                        </Typography>
                      </div>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DeviceThermostatIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
                      <div>
                        <Typography variant="body2" color="text.secondary">
                          Température 2
                        </Typography>
                        <Typography variant="h6">
                          {sensorData.temperature2 || '--'}°C
                        </Typography>
                      </div>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SpeedIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
                      <div>
                        <Typography variant="body2" color="text.secondary">
                          Vitesse 1
                        </Typography>
                        <Typography variant="h6">
                          {sensorData.speed1 || '--'} tr/min
                        </Typography>
                      </div>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SpeedIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
                      <div>
                        <Typography variant="body2" color="text.secondary">
                          Vitesse 2
                        </Typography>
                        <Typography variant="h6">
                          {sensorData.speed2 || '--'} tr/min
                        </Typography>
                      </div>
                    </Box>
                  </Grid>
                </Grid>
                
                <Button 
                  variant="outlined" 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/machine-surveillance')}
                >
                  Voir toutes les données
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default Home;
