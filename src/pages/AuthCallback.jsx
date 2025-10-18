import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Container
} from '@mui/material';

// Función para obtener la URL base del backend
const getBackendUrl = () => {
  // En desarrollo, usar localhost:8000
  if (import.meta.env.DEV) {
    return 'http://localhost:8000';
  }
  
  // En producción, usar el dominio de la API
  return 'https://api.pasesfalsos.cl';
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, setUser, setIsAuthenticated } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const urlParams = new URLSearchParams(window.location.search);
        const loginStatus = urlParams.get('login');
        const errorMessage = urlParams.get('message');
        const code = urlParams.get('code');
        const errorParam = urlParams.get('error');
        
        console.log('🔍 Parámetros del callback:', { 
          loginStatus, 
          errorMessage, 
          code: !!code, 
          error: errorParam 
        });
        
        // Manejar respuesta del backend con parámetros de login
        if (loginStatus === 'success') {
          console.log('✅ Login exitoso detectado');
          
          // Verificar sesión para obtener datos del usuario
          try {
            const response = await fetch(`${getBackendUrl()}/auth/session`, {
              credentials: 'include'
            });
            
            if (response.ok) {
              const userData = await response.json();
              console.log('✅ Sesión establecida correctamente:', userData.user);
              
              // Actualizar el estado del contexto
              setUser(userData.user);
              setIsAuthenticated(true);
              localStorage.setItem('user_email', userData.user.email);
              
              // Notificar al parent window si estamos en un popup (silent login)
              if (window.opener) {
                window.opener.postMessage({ type: 'LOGIN_OK' }, '*');
                window.close();
              } else {
                // Si no estamos en popup, redirigir a la página principal
                navigate('/', { replace: true });
              }
            } else {
              console.error('❌ No se pudo establecer la sesión');
              setError('Error al establecer la sesión');
              
              // Notificar al parent window si estamos en un popup
              if (window.opener) {
                window.opener.postMessage({ type: 'LOGIN_FAILED', error: 'session_not_established' }, '*');
                window.close();
              }
            }
          } catch (sessionError) {
            console.error('❌ Error verificando sesión:', sessionError);
            setError('Error al verificar la sesión');
            
            // Notificar al parent window si estamos en un popup
            if (window.opener) {
              window.opener.postMessage({ type: 'LOGIN_FAILED', error: 'session_check_failed' }, '*');
              window.close();
            }
          }
        } else if (loginStatus === 'error') {
          console.error('❌ Error de login:', errorMessage);
          setError(errorMessage || 'Error de autenticación');
          
          // Notificar al parent window si estamos en un popup
          if (window.opener) {
            window.opener.postMessage({ type: 'LOGIN_FAILED', error: errorMessage }, '*');
            window.close();
          }
        } else if (errorParam) {
          // Manejar errores de Google OAuth
          console.error('❌ Error de Google:', errorParam);
          setError(`Error de Google: ${errorParam}`);
          
          // Notificar al parent window si estamos en un popup
          if (window.opener) {
            window.opener.postMessage({ type: 'LOGIN_FAILED', error: errorParam }, '*');
            window.close();
          }
        } else if (code) {
          // Manejo legacy para códigos de autorización directos
          console.log('✅ Código de autorización recibido, verificando sesión...');
          
          try {
            const response = await fetch(`${getBackendUrl()}/auth/session`, {
              credentials: 'include'
            });
            
            if (response.ok) {
              const userData = await response.json();
              console.log('✅ Sesión establecida correctamente:', userData.user);
              
              setUser(userData.user);
              setIsAuthenticated(true);
              localStorage.setItem('user_email', userData.user.email);
              
              if (window.opener) {
                window.opener.postMessage({ type: 'LOGIN_OK' }, '*');
                window.close();
              } else {
                navigate('/', { replace: true });
              }
            } else {
              console.error('❌ No se pudo establecer la sesión');
              setError('Error al establecer la sesión');
              
              if (window.opener) {
                window.opener.postMessage({ type: 'LOGIN_FAILED', error: 'session_not_established' }, '*');
                window.close();
              }
            }
          } catch (sessionError) {
            console.error('❌ Error verificando sesión:', sessionError);
            setError('Error al verificar la sesión');
            
            if (window.opener) {
              window.opener.postMessage({ type: 'LOGIN_FAILED', error: 'session_check_failed' }, '*');
              window.close();
            }
          }
        } else {
          console.error('❌ No se recibieron parámetros válidos');
          setError('No se recibieron parámetros válidos');
          
          if (window.opener) {
            window.opener.postMessage({ type: 'LOGIN_FAILED', error: 'no_valid_params' }, '*');
            window.close();
          }
        }
      } catch (error) {
        console.error('❌ Error en callback:', error);
        setError(error.message || 'Error al procesar la autenticación');
        
        if (window.opener) {
          window.opener.postMessage({ type: 'LOGIN_FAILED', error: error.message }, '*');
          window.close();
        }
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate, setUser, setIsAuthenticated]);

  // Si estamos en un popup, mostrar una página mínima
  if (window.opener) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          p: 2
        }}
      >
        {loading && (
          <>
            <CircularProgress size={40} />
            <Typography variant="h6">
              Procesando autenticación...
            </Typography>
          </>
        )}
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
            {error}
          </Alert>
        )}
      </Box>
    );
  }

  // Si no estamos en popup, mostrar la UI completa
  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 2
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="h6">
            Procesando autenticación...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 2
          }}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Serás redirigido al login en unos segundos...
          </Typography>
        </Box>
      </Container>
    );
  }

  return null;
};

export default AuthCallback;
