import React from 'react';
import {
  Box,
  Avatar,
  Typography,
  Button,
  Divider,
  Paper,
  IconButton
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = ({ onItemClick }) => {
  const { user, handleLogout, loading } = useAuth();
  const navigate = useNavigate();

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
  
  // Debug adicional para verificar la URL de la imagen
  const originalImageUrl = user.picture || user.avatar_url;
  console.log('🔍 URL de imagen original:', originalImageUrl);
  console.log('🔍 Tipo de imagen URL:', typeof originalImageUrl);
  console.log('🔍 ¿Es válida la URL?:', originalImageUrl && originalImageUrl.startsWith('http'));
  
  // Usar proxy para evitar problemas de CORS con Google Images
  const imageUrl = originalImageUrl ? 
    `https://images.weserv.nl/?url=${encodeURIComponent(originalImageUrl)}` : 
    null;
  console.log('🔍 URL de imagen con proxy:', imageUrl);

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
        <IconButton
          onClick={() => {
            if (onItemClick) onItemClick();
            navigate('/perfil');
          }}
          sx={{ 
            p: 0,
            mb: 1,
            '&:hover': {
              backgroundColor: 'transparent',
            }
          }}
          title="Ir al perfil de usuario"
        >
          <Avatar
            src={imageUrl}
            alt={user.name || user.full_name}
            sx={{ 
              width: 56, 
              height: 56,
              border: '2px solid',
              borderColor: 'primary.main',
              backgroundColor: 'primary.light',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: 'primary.dark',
                transform: 'scale(1.05)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }
            }}
            onError={(e) => {
              console.log('❌ Error cargando avatar con proxy en UserProfile:', e);
              console.log('❌ URL que falló:', imageUrl);
              console.log('🔄 Intentando fallback a URL original:', originalImageUrl);
              // Fallback a la URL original si el proxy falla
              if (e.target.src !== originalImageUrl) {
                e.target.src = originalImageUrl;
              }
            }}
            onLoad={() => {
              console.log('✅ Avatar cargado correctamente en UserProfile:', imageUrl);
            }}
          />
        </IconButton>
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
        <IconButton
          color="primary"
          onClick={() => {
            if (onItemClick) onItemClick();
            navigate('/perfil');
          }}
          sx={{ 
            borderRadius: 2,
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'transparent',
              color: 'primary.dark',
            }
          }}
          title="Ir al perfil de usuario"
        >
          <SettingsIcon />
        </IconButton>
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
