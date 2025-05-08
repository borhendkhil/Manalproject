import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, Tabs, Tab, List, ListItem, ListItemText,
  ListItemAvatar, Avatar, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip,
  Divider, CircularProgress, Alert, Snackbar, Switch, FormControlLabel
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';

function Settings() {
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'viewer',
    isActive: true
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Get the current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('About to fetch users...');
      
      const response = await getUsers();
      console.log('Users response:', response);
      
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        setSnackbar({
          open: true,
          message: `Erreur ${error.response.status}: ${error.response.data.message || 'Erreur lors du chargement des utilisateurs'}`,
          severity: 'error'
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        setSnackbar({
          open: true,
          message: 'Aucune réponse du serveur',
          severity: 'error'
        });
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        setSnackbar({
          open: true,
          message: `Erreur: ${error.message}`,
          severity: 'error'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddUser = () => {
    setDialogMode('add');
    setSelectedUser(null);
    setFormData({
      username: '',
      password: '',
      role: 'viewer',
      isActive: true
    });
    setError('');
    setOpenDialog(true);
  };

  const handleEditUser = (user) => {
    setDialogMode('edit');
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      isActive: user.isActive
    });
    setError('');
    setOpenDialog(true);
  };

  const handleDeleteUser = async (user) => {
    try {
      await deleteUser(user._id);
      // Update the local state after successful API call
      setUsers(users.filter(u => u._id !== user._id));
      
      setSnackbar({
        open: true,
        message: `Utilisateur ${user.username} supprimé avec succès`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({
        open: true,
        message: `Erreur lors de la suppression: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'isActive' ? checked : value
    });
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validation
    if (!formData.username) {
      setError('Le nom d\'utilisateur est requis');
      return;
    }
    
    if (dialogMode === 'add' && !formData.password) {
      setError('Le mot de passe est requis pour un nouvel utilisateur');
      return;
    }
    
    try {
      if (dialogMode === 'add') {
        // Create new user via API
        const response = await createUser(formData);
        setUsers([...users, response.data]);
        
        setSnackbar({
          open: true,
          message: `Utilisateur ${formData.username} créé avec succès`,
          severity: 'success'
        });
      } else {
        // Update existing user via API
        const response = await updateUser(selectedUser._id, formData);
        setUsers(users.map(user => 
          user._id === selectedUser._id ? response.data : user
        ));
        
        setSnackbar({
          open: true,
          message: `Utilisateur ${formData.username} mis à jour avec succès`,
          severity: 'success'
        });
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving user:', error);
      setError(error.response?.data?.message || 'Une erreur est survenue lors de l\'enregistrement');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'technician':
        return 'Technicien';
      case 'viewer':
        return 'Opérateur';
      default:
        return role;
    }
  };

  const getAvatarColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error.main';
      case 'technician':
        return 'warning.main';
      case 'viewer':
        return 'info.main';
      default:
        return 'grey.500';
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
        Paramètres
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            icon={<PersonIcon />} 
            label="Gestion des utilisateurs" 
            iconPosition="start" 
          />
          <Tab 
            icon={<AdminPanelSettingsIcon />} 
            label="Paramètres système" 
            iconPosition="start" 
          />
        </Tabs>
      </Paper>
      
      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Utilisateurs
            </Typography>
            
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddUser}
              >
                Ajouter un utilisateur
              </Button>
            )}
          </Box>
          
          <List>
            {users.map((user) => (
              <React.Fragment key={user._id}>
                <ListItem
                  secondaryAction={
                    isAdmin && user._id !== currentUser.userId && (
                      <Box>
                        <IconButton edge="end" onClick={() => handleEditUser(user)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleDeleteUser(user)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getAvatarColor(user.role) }}>
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {user.username}
                        {!user.isActive && (
                          <Chip 
                            label="Inactif" 
                            size="small" 
                            color="default" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                        {user._id === currentUser.userId && (
                          <Chip 
                            label="Vous" 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={`Rôle: ${getRoleText(user.role)}`}
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
      
      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Paramètres système
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Cette section est réservée aux administrateurs système.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Notifications
                </Typography>
                
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Activer les notifications par email"
                />
                
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Alertes critiques par SMS"
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Sécurité
                </Typography>
                
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Authentification à deux facteurs"
                />
                
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Verrouillage après 5 tentatives échouées"
                />
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Add/Edit User Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'add' ? 'Ajouter un utilisateur' : 'Modifier un utilisateur'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nom d'utilisateur"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              
              {dialogMode === 'add' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mot de passe"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Rôle</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    label="Rôle"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="admin">Administrateur</MenuItem>
                    <MenuItem value="technician">Technicien</MenuItem>
                    <MenuItem value="viewer">Opérateur</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      name="isActive"
                    />
                  }
                  label="Utilisateur actif"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
          >
            {dialogMode === 'add' ? 'Ajouter' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Settings;
