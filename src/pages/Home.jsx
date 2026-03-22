import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Box, Paper, Button, Stack, Card, CardMedia, CircularProgress, Alert } from '@mui/material';
import { keyframes } from '@mui/system';
import { Link } from 'react-router-dom';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import pasesImage from '../assets/pases.png';
import conyImage from '../assets/cony mvp.png';
import jorgeImage from '../assets/jorge.png';
import { useAuth } from '../contexts/AuthContext';
import EventDetailView, { isInformationalEvent, parseLocalDate } from '../components/EventDetailView';
import { apiCall, API_ENDPOINTS, PASES_GOOGLE_CALENDAR_ID } from '../config/api';

const pickNextNonInformationalEvent = (events) => {
  const now = Date.now();
  const withTime = (events || [])
    .filter((e) => e?.summary && !isInformationalEvent(e.summary))
    .map((e) => {
      let t = NaN;
      if (e.start?.dateTime) t = new Date(e.start.dateTime).getTime();
      else if (e.start?.date) t = parseLocalDate(e.start.date)?.getTime();
      return { e, t };
    })
    .filter(({ t }) => !Number.isNaN(t) && t >= now)
    .sort((a, b) => a.t - b.t);
  return withTime[0]?.e ?? null;
};

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const Home = () => {
  const { user } = useAuth();
  const [eventosLoading, setEventosLoading] = useState(true);
  const [eventosError, setEventosError] = useState(null);
  const [eventosItems, setEventosItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setEventosLoading(true);
        setEventosError(null);
        const response = await apiCall(API_ENDPOINTS.EVENTOS(PASES_GOOGLE_CALENDAR_ID));
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const events = data.items || data;
        if (!cancelled) setEventosItems(Array.isArray(events) ? events : []);
      } catch (err) {
        console.error('Error cargando eventos en Home:', err);
        if (!cancelled) setEventosError(err.message || 'No se pudieron cargar los eventos');
      } finally {
        if (!cancelled) setEventosLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const nextEvent = useMemo(() => pickNextNonInformationalEvent(eventosItems), [eventosItems]);

  // Verificar si el usuario tiene rol player o admin
  const hasAccess = user?.roles?.includes('player') || user?.roles?.includes('admin');
  
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom color="primary">
        ¡Hola Pases!
      </Typography>
      <Typography variant="h5" component="p" color="text.secondary">
        Bienvenido al Portal de Pases Falsos
      </Typography>

      <Paper elevation={2} sx={{ mt: 4, p: 3, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="body1" paragraph>
          Esta es la página oficial del equipo de voleyball Pases Falsos.
        </Typography>
        
        {hasAccess && (
          <Stack 
            spacing={2} 
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ mt: 3 }}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<TableChartIcon />}
              href="https://docs.google.com/spreadsheets/d/189t1ipUnCSIwFobqpPDeH1EUUMR06ZYLTPNtxFVOTEc/edit?gid=515129#gid=515129"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                py: 1.5, 
                width: { xs: '100%', sm: 'auto' },
                flex: { sm: 1 } 
              }}
            >
              CUENTAS FALSAS
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DescriptionIcon />}
              href="https://docs.google.com/spreadsheets/d/14eC6E9VdRXkK7qVpkVkCcXMvvQakQ6tkNA4i7fTsivU/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                py: 1.5, 
                width: { xs: '100%', sm: 'auto' },
                flex: { sm: 1 } 
              }}
            >
              DETALLES COBROS
            </Button>
          </Stack>
        )}
      </Paper>

      {/* Próximo evento (misma API que Calendario) */}
      <Box sx={{ mt: 4, maxWidth: 560, mx: 'auto', px: 2, textAlign: 'left' }}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          color="primary"
          sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}
        >
          Próximo evento
        </Typography>
        {eventosLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, py: 4 }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">Cargando eventos…</Typography>
          </Box>
        )}
        {!eventosLoading && eventosError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {eventosError}
          </Alert>
        )}
        {!eventosLoading && !eventosError && !nextEvent && (
          <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No hay eventos próximos con confirmación de asistencia, o solo hay eventos informativos por delante.
            </Typography>
          </Paper>
        )}
        {!eventosLoading && !eventosError && nextEvent && (
          <>
            <EventDetailView event={nextEvent} layout="embedded" />
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                component={Link}
                to="/calendario"
                variant="outlined"
                color="primary"
                startIcon={<CalendarMonthIcon />}
              >
                Ver calendario completo
              </Button>
            </Box>
          </>
        )}
      </Box>
      
      {/* Sección Premios Pases Falsos 2025 */}
      <Box sx={{ mt: 6, maxWidth: 800, mx: 'auto', px: 2 }}>
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom 
          color="primary"
          sx={{ mb: 3, fontWeight: 'bold' }}
        >
          Premios Pases Falsos 2025
        </Typography>
        
        <Typography 
          variant="body1" 
          paragraph 
          sx={{ mb: 4, textAlign: 'left', lineHeight: 1.8 }}
        >
          El día Sábado 15 de Noviembre se celebraron los Premios Pases Falsos. 
          En ellos se premiaron en diferentes categorías a los jugadores de Pases. 
          Se destaca a continuación a los 2 ganadores del Premio Espíritu Pases Falsos:{' '}
          <Typography component="span" fontWeight="bold">Constanza Munilla</Typography> y{' '}
          <Typography component="span" fontWeight="bold">Jorge Ortiz</Typography>.
        </Typography>
        
        {/* Cards estilo Instax Mini */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          sx={{ 
            justifyContent: 'center', 
            alignItems: { xs: 'center', sm: 'flex-start' } 
          }}
        >
          {/* Card Constanza */}
          <Card
            sx={{
              position: 'relative',
              width: { xs: 280, sm: 280 },
              maxWidth: 280,
              mx: 'auto',
              borderRadius: 2,
              boxShadow: 4,
              overflow: 'visible',
              background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
              border: '8px solid #fff',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 40,
                height: 8,
                backgroundColor: '#fff',
                borderRadius: '4px 4px 0 0',
                zIndex: 1,
              }
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                paddingTop: '75%', // Aspect ratio 4:3
                overflow: 'hidden',
                backgroundColor: '#f0f0f0',
              }}
            >
              <CardMedia
                component="img"
                image={conyImage}
                alt="Constanza Munilla"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {/* Icono de premio flotante */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 2,
                  animation: `${floatAnimation} 3s ease-in-out infinite`,
                }}
              >
                <EmojiEventsIcon
                  sx={{
                    fontSize: 40,
                    color: '#FFD700',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff', minHeight: 60 }}>
              <Typography variant="body2" fontWeight="bold" color="text.primary">
                Constanza Munilla
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Premio Espíritu Pases Falsos
              </Typography>
            </Box>
          </Card>
          
          {/* Card Jorge */}
          <Card
            sx={{
              position: 'relative',
              width: { xs: 280, sm: 280 },
              maxWidth: 280,
              mx: 'auto',
              borderRadius: 2,
              boxShadow: 4,
              overflow: 'visible',
              background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
              border: '8px solid #fff',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 40,
                height: 8,
                backgroundColor: '#fff',
                borderRadius: '4px 4px 0 0',
                zIndex: 1,
              }
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                paddingTop: '75%', // Aspect ratio 4:3
                overflow: 'hidden',
                backgroundColor: '#f0f0f0',
              }}
            >
              <CardMedia
                component="img"
                image={jorgeImage}
                alt="Jorge Ortiz"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {/* Icono de premio flotante */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 2,
                  animation: `${floatAnimation} 3s ease-in-out infinite`,
                }}
              >
                <EmojiEventsIcon
                  sx={{
                    fontSize: 40,
                    color: '#FFD700',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff', minHeight: 60 }}>
              <Typography variant="body2" fontWeight="bold" color="text.primary">
                Jorge Ortiz
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Premio Espíritu Pases Falsos
              </Typography>
            </Box>
          </Card>
        </Stack>
      </Box>
      
      {/* Imagen del equipo */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Box
          component="img"
          src={pasesImage}
          alt="Equipo Pases Falsos"
          sx={{
            maxWidth: '100%',
            height: 'auto',
            maxHeight: '500px',
            borderRadius: 2,
            boxShadow: 3,
            border: '3px solid',
            borderColor: 'primary.main'
          }}
        />
      </Box>
    </Box>
  );
};

export default Home;
