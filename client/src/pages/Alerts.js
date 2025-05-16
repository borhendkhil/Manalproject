import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, TablePagination, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
  Alert, Snackbar
} from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getAllAlerts, resolveAlert, getMachines } from '../services/api';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
        setMachines(machinesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
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
        Gestion des alertes
      </Typography>
      
      <Paper elevation={2}>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Message</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Sévérité</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Aucune alerte trouvée
                  </TableCell>
                </TableRow>
              ) : (
                alerts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((alert) => (
                    <TableRow key={alert._id}>
                      <TableCell>{alert.message}</TableCell>
                      <TableCell>
                        {format(
                          new Date(alert.created_at),
                          'dd/MM/yyyy HH:mm',
                          { locale: fr }
                        )}
                      </TableCell>
                      <TableCell>
                        {getSeverityChip(alert.severity)}
                      </TableCell>
                      <TableCell>{getAlertTypeLabel(alert.type)}</TableCell>
                      <TableCell>
                        {alert.description || 'Aucune description disponible'}
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
          count={alerts.length}
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
