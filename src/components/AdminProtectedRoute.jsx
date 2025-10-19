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

const AdminProtectedRoute = ({ children }) => {
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
            Verificando permisos de administrador...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Si el usuario no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si el usuario no tiene rol de admin
  if (!user?.roles?.includes('admin')) {
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
              No tienes permisos de administrador para acceder a esta sección.
            </Typography>
          </Alert>
        </Box>
      </Container>
    );
  }

  // Si el usuario es admin, mostrar el contenido
  return children;
};

export default AdminProtectedRoute;
