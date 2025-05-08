import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, CardActions,
  Button, Switch, FormControlLabel, Divider, Chip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import BuildIcon from '@mui/icons-material/Build';

function MachineControlCard({ machine, onControl }) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleMaintenanceToggle = () => {
    setMaintenanceMode(!maintenanceMode);
    onControl(machine._id, maintenanceMode ? 'online' : 'maintenance');
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6">{machine.name}</Typography>
            <Typography variant="body2" color="text.secondary">{machine.model}</Typography>
          </Box>
          <Chip 
            label={machine.status === 'online' ? 'En marche' : 'Arrêté'} 
            color={machine.status === 'online' ? 'success' : 'error'}
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Contrôle
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              color="success" 
              startIcon={<PlayArrowIcon />}
              disabled={machine.status === 'online'}
              onClick={() => onControl(machine._id, 'online')}
            >
              Démarrer
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              startIcon={<StopIcon />}
              disabled={machine.status === 'offline'}
              onClick={() => onControl(machine._id, 'offline')}
            >
              Arrêter
            </Button>
            <Button 
              variant="contained" 
              color="warning" 
              startIcon={<RestartAltIcon />}
              onClick={() => onControl(machine._id, 'restart')}
            >
              Redémarrer
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BuildIcon color={maintenanceMode ? 'warning' : 'disabled'} sx={{ mr: 1 }} />
            <Typography>Mode maintenance</Typography>
          </Box>
          <Switch 
            checked={maintenanceMode}
            onChange={handleMaintenanceToggle}
          />
        </Box>
      </CardContent>
      <CardActions>
        <Button size="small">Voir Historique</Button>
        <Button size="small">Diagnostiquer</Button>
      </CardActions>
    </Card>
  );
}

export default MachineControlCard;
