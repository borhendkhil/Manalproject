import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

function NotFound() {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh' 
    }}>
      <Paper elevation={3} sx={{ p: 5, textAlign: 'center', maxWidth: 500 }}>
        <ErrorOutlineIcon sx={{ fontSize: 70, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Page non trouvée
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          La page que vous recherchez n'existe pas ou a été déplacée.
        </Typography>
        <Button 
          variant="contained" 
          component={Link} 
          to="/"
          sx={{ mt: 2 }}
        >
          Retour à l'accueil
        </Button>
      </Paper>
    </Box>
  );
}

export default NotFound;
