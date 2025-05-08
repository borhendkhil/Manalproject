import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Avatar, TextField, Button, 
  Grid, Divider, Alert, CircularProgress 
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { updateUserProfile, changePassword } from '../services/api';

function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    username: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      setProfileForm({
        username: userData.username || '',
      });
    }
    setIsLoading(false);
  }, []);

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    try {
      // Use real API endpoint to update profile
      const response = await updateUserProfile(user._id, {
        username: profileForm.username
      });
      
      setProfileSuccess('Profil mis à jour avec succès');
      
      // Update local user data with response from server
      const updatedUser = { ...user, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileError(error.response?.data?.message || 'Une erreur est survenue');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      // Use real API endpoint to change password
      await changePassword(user._id, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setPasswordSuccess('Mot de passe mis à jour avec succès');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error.response?.data?.message || 'Une erreur est survenue');
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
        Profil utilisateur
      </Typography>

      <Grid container spacing={4}>
        {/* User Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                bgcolor: 'primary.main', 
                margin: '0 auto 16px' 
              }}
            >
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {user?.username || 'Utilisateur'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rôle: {user?.role === 'admin' ? 'Administrateur' : 
                    user?.role === 'technician' ? 'Technicien' : 'Opérateur'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Membre depuis: {new Date().toLocaleDateString('fr-FR')}
            </Typography>
          </Paper>
        </Grid>
        
        {/* User Settings */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1 }} />
                Informations personnelles
              </Typography>
              
              {profileSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {profileSuccess}
                </Alert>
              )}
              
              {profileError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {profileError}
                </Alert>
              )}
              
              <form onSubmit={handleProfileSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nom d'utilisateur"
                      name="username"
                      value={profileForm.username}
                      onChange={handleProfileChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      type="submit" 
                      variant="contained"
                      color="primary"
                    >
                      Mettre à jour le profil
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Box>
            
            <Divider sx={{ my: 4 }} />
            
            <Box>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VpnKeyIcon sx={{ mr: 1 }} />
                Changer le mot de passe
              </Typography>
              
              {passwordSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {passwordSuccess}
                </Alert>
              )}
              
              {passwordError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {passwordError}
                </Alert>
              )}
              
              <form onSubmit={handlePasswordSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Mot de passe actuel"
                      name="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nouveau mot de passe"
                      name="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Confirmer le mot de passe"
                      name="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      type="submit" 
                      variant="contained"
                      color="primary"
                    >
                      Changer le mot de passe
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Profile;
