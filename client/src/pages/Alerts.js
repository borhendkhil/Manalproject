import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Tabs, Tab, Chip, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, TablePagination, FormControl, InputLabel, 
  Select, MenuItem, TextField, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
  Alert, Snackbar
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getAllAlerts, resolveAlert, getMachines } from '../services/api';

function Alerts() {
  const [activeTab, setActiveTab] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    severity: '',
    type: '',
    machine: '',
    dateFrom: '',
    dateTo: ''
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertsRes, machinesRes] = await Promise.all([
          getAllAlerts(),
          getMachines()
        ]);
        
        setAlerts(alertsRes.data);
        setFilteredAlerts(alertsRes.data);
        setMachines(machinesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, activeTab, alerts]);

  const applyFilters = () => {
    let result = [...alerts];
    
    // Filter by active/resolved
    if (activeTab === 0) {
      result = result.filter(alert => alert.is_active);
    } else if (activeTab === 1) {
      result = result.filter(alert => !alert.is_active);
    }
    
    // Apply other filters
    if (filters.severity) {
      result = result.filter(alert => alert.severity === filters.severity);
    }
    
    if (filters.type) {
      result = result.filter(alert => alert.type === filters.type);
    }
    
    if (filters.machine) {
      result = result.filter(alert => alert.machine._id === filters.machine);
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(alert => new Date(alert.created_at) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59);
      result = result.filter(alert => new Date(alert.created_at) <= toDate);
    }
    
    setFilteredAlerts(result);
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleFilterChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value
    });
  };

  const resetFilters = () => {
    setFilters({
      severity: '',
      type: '',
      machine: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleResolveAlert = (alert) => {
    setSelectedAlert(alert);
    setOpenDialog(true);
  };

  const confirmResolveAlert = async () => {
    setOpenDialog(false);
    
    try {
      await resolveAlert(selectedAlert._id);
      
      // Update state
      const updatedAlerts = alerts.map(alert => 
        alert._id === selectedAlert._id 
          ? { ...alert, is_active: false, resolved_at: new Date() } 
          : alert
      );
      
      setAlerts(updatedAlerts);
      
      setSnackbar({
        open: true,
        message: 'Alerte résolue avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la résolution de l\'alerte',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <ErrorIcon sx={{ color: 'orange' }} />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getSeverityChip = (severity) => {
    let color = 'default';
    let label = 'Inconnu';
    
    switch (severity) {
      case 'critical':
        color = 'error';
        label = 'Critique';
        break;
      case 'high':
        color = 'error';
        label = 'Élevée';
        break;
      case 'medium':
        color = 'warning';
        label = 'Moyenne';
        break;
      case 'low':
        color = 'info';
        label = 'Faible';
        break;
      default:
        break;
    }
    
    return <Chip label={label} color={color} size="small" />;
  };

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'temperature':
        return 'Température';
      case 'door':
        return 'Porte';
      case 'speed':
        return 'Vitesse';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Autre';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Alertes
      </Typography>
      
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Alertes actives" />
          <Tab label="Alertes résolues" />
          <Tab label="Toutes les alertes" />
        </Tabs>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtres
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="severity-filter-label">Sévérité</InputLabel>
              <Select
                labelId="severity-filter-label"
                name="severity"
                value={filters.severity}
                label="Sévérité"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="critical">Critique</MenuItem>
                <MenuItem value="high">Élevée</MenuItem>
                <MenuItem value="medium">Moyenne</MenuItem>
                <MenuItem value="low">Faible</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="type-filter-label">Type</InputLabel>
              <Select
                labelId="type-filter-label"
                name="type"
                value={filters.type}
                label="Type"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="temperature">Température</MenuItem>
                <MenuItem value="door">Porte</MenuItem>
                <MenuItem value="speed">Vitesse</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="other">Autre</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="machine-filter-label">Machine</InputLabel>
              <Select
                labelId="machine-filter-label"
                name="machine"
                value={filters.machine}
                label="Machine"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Toutes</MenuItem>
                {machines.map(machine => (
                  <MenuItem key={machine._id} value={machine._id}>
                    {machine.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              onClick={resetFilters}
              fullWidth
            >
              Réinitialiser les filtres
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date de début"
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date de fin"
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={2}>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Sévérité</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Machine</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Aucune alerte trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlerts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((alert) => (
                    <TableRow key={alert._id}>
                      <TableCell>
                        {getSeverityChip(alert.severity)}
                      </TableCell>
                      <TableCell>{getAlertTypeLabel(alert.type)}</TableCell>
                      <TableCell>
                        {alert.machine?.name || 'Machine inconnue'}
                      </TableCell>
                      <TableCell>{alert.message}</TableCell>
                      <TableCell>
                        {format(
                          new Date(alert.created_at),
                          'dd/MM/yyyy HH:mm',
                          { locale: fr }
                        )}
                      </TableCell>
                      <TableCell>
                        {alert.is_active ? (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => handleResolveAlert(alert)}
                          >
                            Résoudre
                          </Button>
                        ) : (
                          <Chip
                            label={`Résolu le ${format(
                              new Date(alert.resolved_at),
                              'dd/MM/yyyy',
                              { locale: fr }
                            )}`}
                            icon={<CheckCircleIcon />}
                            color="success"
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAlerts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page :"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>Résoudre l'alerte</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir marquer cette alerte comme résolue ?
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              {selectedAlert && (
                <>
                  <Typography variant="subtitle2">
                    <strong>Machine :</strong> {selectedAlert.machine?.name || 'Machine inconnue'}
                  </Typography>
                  <Typography variant="subtitle2">
                    <strong>Message :</strong> {selectedAlert?.message}
                  </Typography>
                </>
              )}
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={confirmResolveAlert} color="primary" variant="contained">
            Résoudre
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Alerts;
