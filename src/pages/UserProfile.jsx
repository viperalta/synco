import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Divider,
  Grid,
  Chip,
  Button,
  Container
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Security as SecurityIcon,
  LocationOn as LocationIcon,
  SportsVolleyball as SportsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UserProfilePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Cargando perfil...</Typography>
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md">
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No se encontró información del usuario</Typography>
        </Box>
      </Container>
    );
  }

  // Debug para verificar datos del usuario
  console.log('👤 UserProfilePage - Datos del usuario:', user);
  console.log('🖼️ UserProfilePage - Imagen:', { 
    picture: user.picture, 
    avatar_url: user.avatar_url,
    finalSrc: user.picture || user.avatar_url 
  });
  
  const originalImageUrl = user.picture || user.avatar_url;
  console.log('🔍 UserProfilePage - URL de imagen original:', originalImageUrl);
  console.log('🔍 UserProfilePage - ¿Es válida la URL?:', originalImageUrl && originalImageUrl.startsWith('http'));
  
  // Usar proxy para evitar problemas de CORS con Google Images
  const imageUrl = originalImageUrl ? 
    `https://images.weserv.nl/?url=${encodeURIComponent(originalImageUrl)}` : 
    null;
  console.log('🔍 UserProfilePage - URL de imagen con proxy:', imageUrl);

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'No disponible';
    }
  };

  // Función para traducir tipos de eventos
  const translateEventType = (eventType) => {
    const eventTypeMap = {
      'pasco': 'Liga Pasco',
      'oriente': 'Liga Oriente',
      'entrenamiento': 'Entrenamiento'
    };
    return eventTypeMap[eventType] || eventType;
  };

  // Función para obtener color del chip según el tipo de evento
  const getEventTypeColor = (eventType) => {
    switch (eventType) {
      case 'pasco':
        return 'primary';
      case 'oriente':
        return 'secondary';
      case 'entrenamiento':
        return 'success';
      default:
        return 'default';
    }
  };


  return (
    <Container maxWidth="md">
      <Paper 
        elevation={8} 
        sx={{ 
          p: 4, 
          mt: 2, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Botón de regreso */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ 
            mb: 3, 
            textTransform: 'none',
            color: 'primary.main',
            fontWeight: 'bold'
          }}
        >
          Volver
        </Button>

        {/* Header estilo pasaporte */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
          pb: 2,
          borderBottom: '3px solid #1976d2',
          position: 'relative'
        }}>
          <Box sx={{ 
            textAlign: { xs: 'center', md: 'left' },
            mb: { xs: 2, md: 0 }
          }}>
            <Typography variant="h4" component="h1" sx={{ 
              fontWeight: 'bold', 
              color: 'primary.main',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}>
              PERFIL DE USUARIO
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Información Personal
            </Typography>
          </Box>
          
          {/* Avatar flotante en mobile */}
          <Box sx={{ 
            width: { xs: 60, md: 80 }, 
            height: { xs: 60, md: 80 }, 
            borderRadius: '50%',
            border: '4px solid #1976d2',
            overflow: 'hidden',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            position: { xs: 'absolute', md: 'relative' },
            top: { xs: 115, md: 'auto' },
            left: { xs: '50%', md: 'auto' },
            transform: { xs: 'translateX(-50%)', md: 'none' },
            zIndex: 2,
            backgroundColor: 'white'
          }}>
            <Avatar
              src={imageUrl}
              alt={user.name || user.full_name}
              sx={{ 
                width: '100%', 
                height: '100%',
                fontSize: '2rem'
              }}
              onError={(e) => {
                console.log('❌ Error cargando avatar con proxy en UserProfilePage:', e);
                console.log('❌ URL que falló:', imageUrl);
                console.log('🔄 Intentando fallback a URL original:', originalImageUrl);
                // Fallback a la URL original si el proxy falla
                if (e.target.src !== originalImageUrl) {
                  e.target.src = originalImageUrl;
                }
              }}
              onLoad={() => {
                console.log('✅ Avatar cargado correctamente en UserProfilePage:', imageUrl);
              }}
            />
          </Box>
        </Box>

        {/* Información principal */}
        <Grid container spacing={3} sx={{ mt: { xs: 2, md: 0 } }}>
          {/* Columna izquierda - Información personal */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Información Personal
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Nombre Completo
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {user.name || user.full_name || 'No disponible'}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Email
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {user.email || 'No disponible'}
                  </Typography>
                </Box>
              </Box>


              {user.location && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Ubicación
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {user.location}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Tipos de Eventos o Visitante */}
              {user.roles && user.roles.length > 0 ? (
                // Usuario con roles - mostrar sección completa
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Participa en
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SportsIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {user.tipo_eventos && user.tipo_eventos.length > 0 ? (
                        user.tipo_eventos.map((eventType) => (
                          <Chip
                            key={eventType}
                            label={translateEventType(eventType)}
                            size="small"
                            color={getEventTypeColor(eventType)}
                            variant="outlined"
                            sx={{ fontWeight: 'medium' }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Sin eventos asignados
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              ) : (
                // Usuario sin roles - mostrar solo chip de visitante
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label="Visitante de la página"
                      size="small"
                      color="default"
                      variant="outlined"
                      sx={{ fontWeight: 'medium' }}
                    />
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Columna derecha - Información de cuenta */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Información de Cuenta
                </Typography>
              </Box>


              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Fecha de Registro
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {formatDate(user.created_at || user.registration_date)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Última Actualización
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {formatDate(user.updated_at || user.last_login)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Estado de la Cuenta
                </Typography>
                <Chip 
                  label={user.is_active !== false ? 'Activa' : 'Inactiva'} 
                  color={user.is_active !== false ? 'success' : 'error'}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Información adicional */}
        {(user.bio || user.description || user.phone || user.preferences) && (
          <>
            <Divider sx={{ my: 4 }} />
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Información Adicional
              </Typography>
              
              <Grid container spacing={3}>
                {user.bio && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Biografía
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {user.bio}
                    </Typography>
                  </Grid>
                )}
                
                {user.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Descripción
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {user.description}
                    </Typography>
                  </Grid>
                )}
                
                {user.phone && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Teléfono
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {user.phone}
                    </Typography>
                  </Grid>
                )}
                
                {user.preferences && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Preferencias
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {typeof user.preferences === 'string' 
                        ? user.preferences 
                        : JSON.stringify(user.preferences, null, 2)
                      }
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default UserProfilePage;
