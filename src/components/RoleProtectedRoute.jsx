import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Container,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: 2
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.secondary">
            Verificando permisos...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Si el usuario no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si no hay roles requeridos, permitir acceso
  if (allowedRoles.length === 0) {
    return children;
  }

  // Verificar si el usuario tiene al menos uno de los roles permitidos
  const hasRequiredRole = user?.roles?.some(role => allowedRoles.includes(role));

  if (!hasRequiredRole) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: 2
          }}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Acceso Denegado
            </Typography>
            <Typography variant="body1">
              No tienes los permisos necesarios para acceder a esta sección.
            </Typography>
          </Alert>
        </Box>
      </Container>
    );
  }

  // Si el usuario tiene los permisos necesarios, mostrar el contenido
  return children;
};

export default RoleProtectedRoute;
