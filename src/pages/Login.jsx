import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import SimpleGoogleButton from '../components/SimpleGoogleButton';

const Login = () => {
  const { user, isAuthenticated, handleGoogleLogin, handleChangeAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = React.useState(null);

  // Redirigir si ya está autenticado
  useEffect(() => {
    console.log('🔍 Estado de autenticación:', { isAuthenticated, user });
    if (isAuthenticated) {
      console.log('✅ Usuario ya autenticado, redirigiendo...');
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Manejar errores de Google si hay parámetros en la URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error) {
      // Limpiar la URL de parámetros de error
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      console.log('🚨 Error de Google detectado:', error);
      
      if (error === 'interaction_required') {
        setError('Selecciona tu cuenta de Google para continuar...');
      } else if (error === 'access_denied') {
        setError('Acceso denegado. Verifica que tengas permisos para acceder a esta aplicación.');
      } else {
        setError(`Error en la autenticación con Google: ${error}. Por favor, intenta de nuevo.`);
      }
    }
  }, []);

  const handleLoginSuccess = () => {
    // El redirect se maneja automáticamente por el backend
    console.log('✅ Login exitoso, redirigiendo...');
  };

  const handleLoginError = (error) => {
    setError(error.message || 'Error al iniciar sesión');
  };



  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Paper elevation={3} sx={{ width: '100%', maxWidth: 400 }}>
          <Box sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                SYNCO
              </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Pases Falsos
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <SimpleGoogleButton
            onLoginSuccess={handleLoginSuccess}
            onLoginError={handleLoginError}
          />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
