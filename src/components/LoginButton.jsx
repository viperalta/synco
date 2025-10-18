import React from 'react';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const LoginButton = ({ onLoginSuccess, onLoginError }) => {
  const { loginWithGoogle, loading, user } = useAuth();
  const [error, setError] = React.useState(null);
  const [loginStatus, setLoginStatus] = React.useState('');

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setLoginStatus('Verificando sesión...');
      
      await loginWithGoogle();
      
      if (user) {
        setLoginStatus('¡Bienvenido de vuelta!');
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError(error.message || 'Error al iniciar sesión con Google');
      setLoginStatus('');
      if (onLoginError) {
        onLoginError(error);
      }
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
      
      {loginStatus && !error && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {loginStatus}
        </Alert>
      )}
      
      <Button
        variant="contained"
        size="large"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
        onClick={handleGoogleLogin}
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
          fontWeight: 500
        }}
      >
        {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
      </Button>
      
      <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
        {user ? 'Sesión activa' : 'Los usuarios registrados tendrán una experiencia más rápida'}
      </Typography>
    </Box>
  );
};

export default LoginButton;
