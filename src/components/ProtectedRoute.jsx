import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Container
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { isAuthenticated, loading } = useAuth();
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
            Verificando autenticación...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Si la ruta requiere autenticación y el usuario no está autenticado
  if (requireAuth && !isAuthenticated) {
    // Redirigir al login con la ruta actual como state para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si la ruta no requiere autenticación o el usuario está autenticado
  return children;
};

export default ProtectedRoute;
