import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem,
  TextField, Button, Tab, Tabs, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, CircularProgress, Chip
} from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getMachines, getSensorDataHistory, getMachineAlerts, getAllAlerts } from '../services/api';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import SpeedIcon from '@mui/icons-material/Speed';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import WarningIcon from '@mui/icons-material/Warning';

function History() {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // Last 7 days
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [sensorData, setSensorData] = useState([]);
  const [alertData, setAlertData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
      fetchData();
    }
  }, [selectedMachine, tabValue, dateRange]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (tabValue === 0) { // Sensor data
        const response = await getSensorDataHistory(selectedMachine);
        console.log('Sensor data response:', response);
        
        // Filter by date
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        
        // Defensive check - ensure response.data is an array
        const dataArray = Array.isArray(response.data) ? response.data : 
                        (response.data?.data ? response.data.data : []);
        
        const filteredData = dataArray.filter(item => {
          if (!item || !item.timestamp) return false;
          const itemDate = new Date(item.timestamp);
          return itemDate >= startDate && itemDate <= endDate;
        });
        
        setSensorData(filteredData);
      } else if (tabValue === 1) { // Alerts
        const response = selectedMachine === 'all' 
          ? await getAllAlerts() 
          : await getMachineAlerts(selectedMachine);
        
        console.log('Alert data response:', response);
        
        // Filter by date
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        
        // Defensive check - ensure response.data is an array
        const dataArray = Array.isArray(response.data) ? response.data : 
                        (response.data?.data ? response.data.data : []);
        
        const filteredData = dataArray.filter(item => {
          if (!item || !item.created_at) return false;
          const itemDate = new Date(item.created_at);
          return itemDate >= startDate && itemDate <= endDate;
        });
        
        setAlertData(filteredData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error to prevent UI issues
      if (tabValue === 0) {
        setSensorData([]);
      } else {
        setAlertData([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleMachineChange = (event) => {
    setSelectedMachine(event.target.value);
    setPage(0);
  };

  const handleDateChange = (event) => {
    setDateRange({
      ...dateRange,
      [event.target.name]: event.target.value
    });
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  const renderSensorDataTable = () => {
    const currentPageData = sensorData
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
      <Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date et heure</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ThermostatIcon fontSize="small" sx={{ mr: 0.5 }} />
                    T1 (°C)
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ThermostatIcon fontSize="small" sx={{ mr: 0.5 }} />
                    T2 (°C)
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ThermostatIcon fontSize="small" sx={{ mr: 0.5 }} />
                    T3 (°C)
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ThermostatIcon fontSize="small" sx={{ mr: 0.5 }} />
                    T4 (°C)
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SpeedIcon fontSize="small" sx={{ mr: 0.5 }} />
                    V1 (tr/min)
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SpeedIcon fontSize="small" sx={{ mr: 0.5 }} />
                    V2 (tr/min)
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DoorFrontIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Porte 1
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DoorFrontIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Porte 2
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentPageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    Aucune donnée trouvée pour cette période
                  </TableCell>
                </TableRow>
              ) : (
                currentPageData.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>
                      {format(new Date(row.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                    </TableCell>
                    <TableCell>{row.temperature1 || '-'}</TableCell>
                    <TableCell>{row.temperature2 || '-'}</TableCell>
                    <TableCell>{row.temperature3 || '-'}</TableCell>
                    <TableCell>{row.temperature4 || '-'}</TableCell>
                    <TableCell>{row.speed1 || '-'}</TableCell>
                    <TableCell>{row.speed2 || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.door1_state ? 'Ouverte' : 'Fermée'} 
                        color={row.door1_state ? 'error' : 'success'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={row.door2_state ? 'Ouverte' : 'Fermée'} 
                        color={row.door2_state ? 'error' : 'success'} 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={sensorData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page :"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      </Box>
    );
  };

  const renderAlertTable = () => {
    const currentPageData = alertData
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
      <Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date et heure</TableCell>
                <TableCell>Machine</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Sévérité</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentPageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Aucune alerte trouvée pour cette période
                  </TableCell>
                </TableRow>
              ) : (
                currentPageData.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>
                      {format(new Date(row.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                    </TableCell>
                    <TableCell>{row.machine?.name || 'Machine inconnue'}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{getSeverityChip(row.severity)}</TableCell>
                    <TableCell>{row.message}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.is_active ? 'Active' : 'Résolue'} 
                        color={row.is_active ? 'error' : 'success'} 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={alertData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page :"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      </Box>
    );
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
        Historique
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="machine-select-label">Machine</InputLabel>
              <Select
                labelId="machine-select-label"
                id="machine-select"
                value={selectedMachine}
                label="Machine"
                onChange={handleMachineChange}
              >
                {tabValue === 1 && (
                  <MenuItem value="all">Toutes les machines</MenuItem>
                )}
                {machines.map(machine => (
                  <MenuItem key={machine._id} value={machine._id}>
                    {machine.name} - {machine.model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              label="Date de début"
              type="date"
              name="start"
              value={dateRange.start}
              onChange={handleDateChange}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              label="Date de fin"
              type="date"
              name="end"
              value={dateRange.end}
              onChange={handleDateChange}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button 
              variant="contained" 
              onClick={fetchData} 
              fullWidth
            >
              Filtrer
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={2}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<SpeedIcon />} 
            label="Données capteurs" 
            iconPosition="start" 
          />
          <Tab 
            icon={<WarningIcon />} 
            label="Alertes" 
            iconPosition="start" 
          />
        </Tabs>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {tabValue === 0 ? renderSensorDataTable() : renderAlertTable()}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default History;
