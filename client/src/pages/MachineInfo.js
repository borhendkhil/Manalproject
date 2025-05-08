import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, Card, CardContent, CardActions,
  Button, Chip, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  IconButton, Divider, Alert
} from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BuildIcon from '@mui/icons-material/Build';
import WarningIcon from '@mui/icons-material/Warning';
import { getMachines, getMachine, getActiveAlerts, getLatestSensorData, getMachineStatus, createMachine, updateMachine } from '../services/api';

function MachineInfo() {
  const [machine, setMachine] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('edit'); 
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    type: '',
    serial_number: '',
    localisation: '',
    last_service: format(new Date(), 'yyyy-MM-dd')
  });
  const [error, setError] = useState('');
  const [machineStatus, setMachineStatus] = useState(null);
  const [sensorData, setSensorData] = useState(null);

  useEffect(() => {
    fetchMachine();
  }, []);

  useEffect(() => {
    if (machine) {
      fetchMachineAlerts(machine._id);
      fetchMachineStatus(machine._id);
      fetchSensorData(machine._id);
    }
  }, [machine]);

  const fetchMachine = async () => {
    try {
      setIsLoading(true);
      // Fetch all machines but we only expect one
      const response = await getMachines();
      if (response.data.length > 0) {
        
        const nettoyeuseMachine = response.data.find(m => m.name === "Nettoyeuse") || response.data[0];
        const machineData = await getMachine(nettoyeuseMachine._id);
        setMachine(machineData.data);
      } else {
        // If no machines exist, we might want to show a message or create a default one
        console.warn("No machines found in the system");
      }
    } catch (error) {
      console.error('Error fetching machine:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMachineAlerts = async (machineId) => {
    try {
      const response = await getActiveAlerts();
      const machineAlerts = response.data.filter(
        alert => alert.machine === machineId
      );
      setAlerts(machineAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchMachineStatus = async (machineId) => {
    try {
      const response = await getMachineStatus(machineId);
      setMachineStatus(response.data);
    } catch (error) {
      console.error('Error fetching machine status:', error);
      // Set a default status when there's an error
      setMachineStatus({
        status: 'unknown',
        timestamp: new Date()
      });
    }
  };

  const fetchSensorData = async (machineId) => {
    try {
      // Validate machineId before making API call
      if (!machineId || typeof machineId !== 'string' || machineId.length !== 24) {
        console.warn('Invalid machine ID format:', machineId);
        // Set default sensor data for invalid IDs
        setSensorData({
          temperature1: 0,
          temperature2: 0,
          door1_state: false,
          door2_state: false,
          timestamp: new Date()
        });
        return;
      }
      
      const response = await getLatestSensorData(machineId);
      setSensorData(response.data);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      // Set default sensor data when there's an error
      setSensorData({
        temperature1: 0,
        temperature2: 0,
        door1_state: false,
        door2_state: false,
        timestamp: new Date()
      });
    }
  };

  const handleEditMachine = () => {
    if (!machine) return;
    
    setDialogMode('edit');
    setFormData({
      name: machine.name,
      model: machine.model,
      type: machine.type,
      serial_number: machine.serial_number,
      localisation: machine.localisation,
      last_service: format(new Date(machine.last_service), 'yyyy-MM-dd')
    });
    setOpenDialog(true);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validation
    if (!formData.name || !formData.model || !formData.serial_number) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      // When editing, make sure we're using the machine's ID to update it
      if (dialogMode === 'edit' && machine) {
        console.log(`Updating machine with ID: ${machine._id}`, formData);
        
        // Prepare the data correctly
        const updateData = {
          ...formData,
          // Ensure last_service is in the right format (YYYY-MM-DD)
          last_service: formData.last_service
        };
        
        const response = await updateMachine(machine._id, updateData);
        console.log('Update response:', response.data);
        
        // Update the local machine state with the returned data
        setMachine(response.data);
      } else {
        // Only create a new machine if that's the intended action
        console.log('Creating new machine:', formData);
        const response = await createMachine(formData);
        
        // Update the client state with the newly created machine
        setMachine(response.data);
      }
      
      // Close dialog
      setOpenDialog(false);
      
    } catch (error) {
      console.error('Error saving machine:', error);
      setError(error.response?.data?.message || 'Une erreur est survenue lors de l\'enregistrement des données');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const renderLastState = () => {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Dernier état
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Statut
              </Typography>
              <Chip 
                label={machineStatus?.status === 'online' ? 'En fonctionnement' : 
                       machineStatus?.status === 'offline' ? 'Hors ligne' : 
                       machineStatus?.status === 'maintenance' ? 'En maintenance' : 'Inconnu'} 
                color={machineStatus?.status === 'online' ? 'success' : 
                       machineStatus?.status === 'offline' ? 'error' : 
                       machineStatus?.status === 'maintenance' ? 'warning' : 'default'} 
                size="small" 
                sx={{ mt: 1 }} 
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Température moyenne
              </Typography>
              <Typography variant="body1">
                {sensorData && (sensorData.temperature1 || sensorData.temperature2) ? 
                  `${Math.round(((sensorData.temperature1 || 0) + (sensorData.temperature2 || 0)) / 2)}°C` : 
                  'Non disponible'}
              </Typography>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Portes
              </Typography>
              <Typography variant="body1">
                {sensorData ? 
                  (sensorData.door1_state || sensorData.door2_state) ? 'Ouvertes' : 'Fermées' : 
                  'Non disponible'}
              </Typography>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Dernière connexion
              </Typography>
              <Typography variant="body1">
                {sensorData?.timestamp ? 
                  format(new Date(sensorData.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr }) : 
                  'Non disponible'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button size="small" onClick={() => window.location.href = '/machine-surveillance'}>Voir surveillance</Button>
          <Button size="small" onClick={() => window.location.href = '/machine-control'}>Voir contrôle</Button>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Machine Nettoyeuse
      </Typography>
      
      <Grid container spacing={3}>
        {/* Machine Details */}
        <Grid item xs={12}>
          {!machine ? (
            <Paper elevation={2} sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="subtitle1" color="text.secondary">
                Aucune machine n'a été trouvée
              </Typography>
            </Paper>
          ) : (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">{machine.name}</Typography>
                <Box>
                  <IconButton color="primary" onClick={handleEditMachine}>
                    <EditIcon />
                  </IconButton>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Informations générales
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Modèle
                          </Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body1">
                            {machine.model}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={4}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Type
                          </Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body1">
                            {machine.type}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={4}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Numéro de série
                          </Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body1">
                            {machine.serial_number}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="body1">
                              {machine.localisation}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Maintenance
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <BuildIcon color="primary" sx={{ mr: 1 }} />
                        <div>
                          <Typography variant="subtitle2" color="text.secondary">
                            Dernier entretien
                          </Typography>
                          <Typography variant="body1">
                            {format(new Date(machine.last_service), 'dd MMMM yyyy', { locale: fr })}
                          </Typography>
                        </div>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle1" gutterBottom>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <WarningIcon 
                            color={alerts.length > 0 ? 'error' : 'disabled'}
                            sx={{ mr: 1 }}
                          />
                          Alertes actives: {alerts.length}
                        </Box>
                      </Typography>
                      
                      {alerts.length > 0 ? (
                        <Box sx={{ mt: 1 }}>
                          {alerts.slice(0, 3).map((alert, index) => (
                            <Alert 
                              key={index} 
                              severity={
                                alert.severity === 'critical' || alert.severity === 'high' 
                                  ? 'error' 
                                  : alert.severity === 'medium' 
                                    ? 'warning' 
                                    : 'info'
                              }
                              sx={{ mb: 1 }}
                            >
                              {alert.message}
                            </Alert>
                          ))}
                          
                          {alerts.length > 3 && (
                            <Button 
                              variant="text" 
                              size="small"
                              sx={{ mt: 1 }}
                            >
                              Voir toutes les alertes ({alerts.length})
                            </Button>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Aucune alerte active
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  {renderLastState()}
                </Grid>
              </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* Add/Edit Machine Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {dialogMode === 'add' ? 'Ajouter une machine' : 'Modifier la machine'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nom"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Modèle"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Numéro de série"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Localisation"
                name="localisation"
                value={formData.localisation}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Dernier entretien"
                name="last_service"
                type="date"
                value={formData.last_service}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
          >
            {dialogMode === 'add' ? 'Ajouter' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MachineInfo;
