import React, { useState } from 'react';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import { Google as GoogleIcon, SwapHoriz as SwapIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const SimpleGoogleButton = ({ onLoginSuccess, onLoginError, text = 'Continuar con Google' }) => {
  const { handleGoogleLogin, handleChangeAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar el método del contexto que redirige al backend
      handleGoogleLogin();
    } catch (error) {
      console.error('Error en login con Google:', error);
      setError(error.message || 'Error al iniciar sesión con Google');
      if (onLoginError) {
        onLoginError(error);
      }
      setLoading(false);
    }
  };

  const handleChangeAccountClick = () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar el método del contexto para cambiar cuenta
      handleChangeAccount();
    } catch (error) {
      console.error('Error cambiando cuenta:', error);
      setError(error.message || 'Error al cambiar cuenta');
      if (onLoginError) {
        onLoginError(error);
      }
      setLoading(false);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Iniciar Sesión
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Accede con tu cuenta de Google para continuar
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Stack spacing={2}>
        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
          onClick={handleLogin}
          disabled={loading}
          sx={{
            backgroundColor: '#4285f4',
            '&:hover': {
              backgroundColor: '#3367d6',
            },
            px: 4,
            py: 1.5,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            width: '100%'
          }}
        >
          {loading ? 'Redirigiendo...' : text}
        </Button>
        
        <Button
          variant="outlined"
          size="medium"
          startIcon={<SwapIcon />}
          onClick={handleChangeAccountClick}
          disabled={loading}
          sx={{
            px: 3,
            py: 1,
            textTransform: 'none',
            fontSize: '0.9rem',
            width: '100%'
          }}
        >
          Cambiar cuenta
        </Button>
      </Stack>
    </Box>
  );
};

export default SimpleGoogleButton;
