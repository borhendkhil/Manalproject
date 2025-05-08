import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem, 
  Paper, Switch, Button, Divider, Card, CardContent, List, ListItem, 
  ListItemText, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Alert
} from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getMachines, getMachineStatus, updateMachineStatus, getMachineStatusHistory } from '../services/api';

function MachineControl() {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [actionResult, setActionResult] = useState(null);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await getMachines();
        setMachines(response.data);
        
        if (response.data.length > 0) {
          setSelectedMachine(response.data[0]._id);
        }
      } catch (error) {
        console.error('Error fetching machines:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMachines();
  }, []);
  
  useEffect(() => {
    if (selectedMachine) {
      fetchMachineStatus();

      const interval = setInterval(() => {
        fetchMachineStatus();
      }, 30000); // Poll every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [selectedMachine]);
  
  const fetchMachineStatus = async () => {
    try {
      const response = await getMachineStatus(selectedMachine);
      setStatus(response.data);
      
      // Get the history from the API instead of using static data
      try {
        // This endpoint doesn't exist yet, but should be implemented
        const historyResponse = await getMachineStatusHistory(selectedMachine);
        setHistory(historyResponse.data);
      } catch (error) {
        console.error('Error fetching machine history:', error);
        setHistory([]);
      }
    } catch (error) {
      console.error('Error fetching machine status:', error);
    }
  };
  
  const handleMachineChange = (event) => {
    setSelectedMachine(event.target.value);
  };
  
  const handleOpenDialog = (action) => {
    setDialogAction(action);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const executeAction = async () => {
    setOpenDialog(false);
    setIsLoading(true);
    try {
      // Get the current user
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Update machine status
      const newStatus = dialogAction === 'start' ? 'online' : dialogAction === 'stop' ? 'offline' : 'maintenance';
      
      await updateMachineStatus({
        machine: selectedMachine,
        status: newStatus,
        changed_by: user.userId
      });
      
      setActionResult({
        type: 'success',
        message: `La machine a été ${dialogAction === 'start' ? 'démarrée' : dialogAction === 'stop' ? 'arrêtée' : 'redémarrée'} avec succès.`
      });
      
      // Refresh the status
      fetchMachineStatus();
    } catch (error) {
      console.error('Error updating machine status:', error);
      setActionResult({
        type: 'error',
        message: `Une erreur est survenue: ${error.response?.data?.message || error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchMachineStatus();
      setActionResult({
        type: 'success',
        message: 'Statut de la machine actualisé avec succès'
      });
    } catch (error) {
      setActionResult({
        type: 'error',
        message: 'Erreur lors de l\'actualisation du statut'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStatusColor = (status) => {
    if (!status) return 'grey.500';
    switch (status) {
      case 'online': return 'success.main';
      case 'offline': return 'error.main';
      case 'maintenance': return 'warning.main';
      default: return 'grey.500';
    }
  };
  
  const getStatusText = (status) => {
    if (!status) return 'Inconnu';
    switch (status) {
      case 'online': return 'En ligne';
      case 'offline': return 'Hors ligne';
      case 'maintenance': return 'Maintenance';
      default: return 'Inconnu';
    }
  };
  
  if (isLoading && !selectedMachine) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Contrôle de Machine
      </Typography>
      
      {actionResult && (
        <Alert 
          severity={actionResult.type} 
          sx={{ mb: 3 }}
          onClose={() => setActionResult(null)}
        >
          {actionResult.message}
        </Alert>
      )}
      
      <Box sx={{ mb: 4 }}>
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel id="machine-select-label">Sélectionner une machine</InputLabel>
          <Select
            labelId="machine-select-label"
            id="machine-select"
            value={selectedMachine}
            label="Sélectionner une machine"
            onChange={handleMachineChange}
          >
            {machines.map(machine => (
              <MenuItem key={machine._id} value={machine._id}>
                {machine.name} - {machine.model}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {!selectedMachine ? (
        <Typography>Veuillez sélectionner une machine</Typography>
      ) : (
        <Grid container spacing={3}>
          {/* Machine status card */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Statut actuel
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    width: 16, 
                    height: 16, 
                    borderRadius: '50%', 
                    bgcolor: getStatusColor(status?.status),
                    mr: 1 
                  }} 
                />
                <Typography variant="h5">
                  {getStatusText(status?.status)}
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Dernière modification:
              </Typography>
              <Typography variant="body1" gutterBottom>
                {status?.changed_by ? 
                  `Par ${status.changed_by.username || 'Utilisateur inconnu'}` :
                  'Non disponible'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {status?.timestamp ? 
                  format(new Date(status.timestamp), 'dd MMMM yyyy à HH:mm', { locale: fr }) :
                  'Date inconnue'
                }
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleRefresh}
                disabled={isLoading}
                sx={{ mt: 2 }}
              >
                Actualiser
              </Button>
            </Paper>
          </Grid>
          
          {/* Control buttons */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Contrôle
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item>
                  <Button 
                    variant="contained" 
                    color="success"
                    startIcon={<PowerSettingsNewIcon />}
                    disabled={status?.status === 'online' || isLoading}
                    onClick={() => handleOpenDialog('start')}
                    sx={{ px: 3 }}
                  >
                    Démarrer
                  </Button>
                </Grid>
                
                <Grid item>
                  <Button 
                    variant="contained" 
                    color="error"
                    startIcon={<PowerSettingsNewIcon />}
                    disabled={status?.status === 'offline' || isLoading}
                    onClick={() => handleOpenDialog('stop')}
                    sx={{ px: 3 }}
                  >
                    Arrêter
                  </Button>
                </Grid>
                
                <Grid item>
                  <Button 
                    variant="contained" 
                    color="warning"
                    startIcon={<RestartAltIcon />}
                    disabled={isLoading}
                    onClick={() => handleOpenDialog('restart')}
                    sx={{ px: 3 }}
                  >
                    Redémarrer
                  </Button>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Maintenance
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>Mode maintenance</Typography>
                <Switch 
                  checked={status?.status === 'maintenance'} 
                  onChange={() => handleOpenDialog(status?.status === 'maintenance' ? 'start' : 'maintenance')}
                  disabled={isLoading}
                />
              </Box>
            </Paper>
          </Grid>
          
          {/* History card */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Historique des actions
                </Typography>
                
                <List>
                  {history.map((item) => (
                    <React.Fragment key={item.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box 
                                sx={{ 
                                  width: 10, 
                                  height: 10, 
                                  borderRadius: '50%', 
                                  bgcolor: getStatusColor(item.status),
                                  mr: 1 
                                }} 
                              />
                              <Typography component="span" fontWeight="medium">
                                {getStatusText(item.status)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {item.changedBy}
                              </Typography>
                              {" — "}
                              {format(new Date(item.timestamp), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
      >
        <DialogTitle>
          {dialogAction === 'start' ? 'Démarrer la machine' : 
           dialogAction === 'stop' ? 'Arrêter la machine' : 
           dialogAction === 'restart' ? 'Redémarrer la machine' : 
           'Activer le mode maintenance'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAction === 'start' ? 'Voulez-vous vraiment démarrer cette machine?' : 
             dialogAction === 'stop' ? 'Voulez-vous vraiment arrêter cette machine?' : 
             dialogAction === 'restart' ? 'Voulez-vous vraiment redémarrer cette machine?' : 
             'Voulez-vous activer le mode maintenance pour cette machine?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button 
            onClick={executeAction} 
            variant="contained"
            color={
              dialogAction === 'start' ? 'success' : 
              dialogAction === 'stop' ? 'error' : 
              'warning'
            }
            autoFocus
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MachineControl;
