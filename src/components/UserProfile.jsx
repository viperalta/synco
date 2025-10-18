import React from 'react';
import {
  Box,
  Avatar,
  Typography,
  Button,
  Divider,
  Paper
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { user, handleLogout, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  // Log temporal para debuggear
  console.log('👤 UserProfile - Datos del usuario:', user);
  console.log('🖼️ UserProfile - Imagen:', { 
    picture: user.picture, 
    avatar_url: user.avatar_url,
    finalSrc: user.picture || user.avatar_url 
  });

  // Probar si la imagen es accesible
  const testImage = new Image();
  testImage.onload = () => console.log('✅ Imagen cargada correctamente');
  testImage.onerror = () => console.log('❌ Error cargando imagen');
  testImage.src = user.picture || user.avatar_url;

  const handleLogoutClick = async () => {
    try {
      await handleLogout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        {/* Usar proxy de imagen para evitar problemas de CORS */}
        <Box
          component="img"
          src={`https://images.weserv.nl/?url=${encodeURIComponent(user.picture || user.avatar_url)}`}
          alt={user.name || user.full_name}
          sx={{ 
            width: 56, 
            height: 56, 
            mb: 1,
            borderRadius: '50%',
            border: '2px solid red', // Debug border
            backgroundColor: 'lightblue' // Debug background
          }}
          onError={(e) => {
            console.log('❌ Error en img con proxy:', e);
            console.log('❌ URL que falló:', `https://images.weserv.nl/?url=${encodeURIComponent(user.picture || user.avatar_url)}`);
            // Fallback a la imagen original si el proxy falla
            e.target.src = user.picture || user.avatar_url;
          }}
          onLoad={() => {
            console.log('✅ Img cargada correctamente con proxy');
          }}
        />
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Typography variant="h6" component="div" sx={{ mb: 0.5 }}>
            {user.name || user.full_name || 'Usuario'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
            {user.email || 'No disponible'}
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Sesión activa
        </Typography>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<LogoutIcon />}
          onClick={handleLogoutClick}
          sx={{ textTransform: 'none' }}
        >
          Cerrar Sesión
        </Button>
      </Box>
    </Paper>
  );
};

export default UserProfile;
