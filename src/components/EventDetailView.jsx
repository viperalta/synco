import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  IconButton,
  Button,
  CircularProgress,
  TextField,
  Alert,
  Snackbar,
  Chip,
  Autocomplete,
} from '@mui/material';
import { apiCall } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import {
  OpenInNew as OpenInNewIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import logoPasco from '../assets/logo-pasco.jpg';
import logoOriente from '../assets/logo-oriente.png';
import logoSante from '../assets/logo-sante.jpg';
import logoBohemios from '../assets/logo-bohemios.jpg';
import gatobarato from '../assets/gatobarato.jpg';
import lager from '../assets/lager.jpg';
import regina from '../assets/regina.jpg';
import logoSunday from '../assets/logo-sunday.png';
import logoMishigang from '../assets/logo-mishigang.jpg';
import logoWakan from '../assets/logo-wakan.png';

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatLocalDateEs = (dateStr) => {
  const date = parseLocalDate(dateStr);
  if (!date) return 'Fecha no disponible';
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const isInformationalEvent = (eventSummary) => {
  if (!eventSummary) return false;
  return eventSummary.trim().startsWith('🎊🏐');
};

const ASISTENTES_PASCO = [
  'Cony', 'Vicho', 'Buri', 'Andre', 'Bastian', 'Diego', 'Catalina',
  'Claudio andres', 'Gabi', 'Javi Soto', 'Jorge', 'Kitsu', 'Lucas', 'Mariano',
  'Romy', 'Sofi', 'Fernando', 'Dafne',
];

const ASISTENTES_ORIENTE = [
  'Vicho', 'Cony', 'Lucas', 'Bastian', 'Buri', 'Carlos', 'Diego', 'Catalina',
  'Gabi', 'Javi Soto', 'Jorge', 'Kitsu', 'Mariano',
  'Romy', 'Andre', 'Ángel', 'Fernando', 'Dafne', 'Rocío',
];

const LISTA_DEFAULT = [
  'Vicho', 'Cony', 'Lucas', 'Bastian', 'Buri', 'Carlos', 'Diego', 'Catalina',
  'Gabi', 'Javi Rivas', 'Javi Soto', 'Jorge', 'Kev', 'Kitsu', 'Mariano',
  'Romy', 'Claudio andres', 'Sofi', 'Fernando', 'Andre', 'Conco', 'Dafne', 'Rocío',
];

const ENTRENO = [
  'Vicho', 'Cony', 'Lucas', 'Bastian', 'Buri', 'Diego', 'Catalina',
  'Gabi', 'Javi Soto', 'Jorge', 'Kev', 'Kitsu', 'Mariano',
  'Romy', 'Fernando', 'Andre', 'Ángel', 'Dafne', 'Rocío',
];

const getLeagueLogo = (eventSummary) => {
  if (!eventSummary) return null;
  const summary = eventSummary.toUpperCase();
  if (summary.includes('CHURU')) return gatobarato;
  if (summary.includes('PASCO')) return logoPasco;
  if (summary.includes('ORIENTE')) return logoOriente;
  return null;
};

const isChuruEvent = (eventSummary) => {
  if (!eventSummary) return false;
  return eventSummary.toUpperCase().includes('CHURU');
};

const getRivalLogo = (eventSummary) => {
  if (!eventSummary) return null;
  const summary = eventSummary.toUpperCase();
  if (summary.includes('CHURU')) return 'CHURU_SPECIAL';
  if (summary.includes('REGINA')) return regina;
  if (summary.includes('SANTÉ') || summary.includes('SANTE')) return logoSante;
  if (summary.includes('BOHEMIOS')) return logoBohemios;
  if (summary.includes('SUNDAY')) return logoSunday;
  if (summary.includes('MISHIGANG')) return logoMishigang;
  if (summary.includes('WAKAN')) return logoWakan;
  return null;
};

const getRivalLogoUrl = (eventSummary) => {
  if (!eventSummary) return null;
  const summary = eventSummary.toUpperCase();
  if (summary.includes('REGINA')) return regina;
  if (summary.includes('SANTÉ') || summary.includes('SANTE')) return logoSante;
  if (summary.includes('BOHEMIOS')) return logoBohemios;
  if (summary.includes('SUNDAY')) return logoSunday;
  if (summary.includes('MISHIGANG')) return logoMishigang;
  if (summary.includes('WAKAN')) return logoWakan;
  return null;
};

const getChuruRivalLogos = () => [lager, logoBohemios];

/**
 * Misma UI que el modal de Calendar: título, enlace, logos, fecha/ubicación,
 * confirmación de asistencia y listas (asistentes / ausentes).
 */
const EventDetailView = ({ event: selectedEvent, layout = 'embedded' }) => {
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [attending, setAttending] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [nonAttendees, setNonAttendees] = useState([]);
  const [totalNonAttendees, setTotalNonAttendees] = useState(0);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [deletingAttendee, setDeletingAttendee] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [attendeeToDelete, setAttendeeToDelete] = useState(null);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [shouldRotateLogo, setShouldRotateLogo] = useState(false);
  const [currentChuruLogoIndex, setCurrentChuruLogoIndex] = useState(0);

  const getAsistentesList = (eventSummary) => {
    if (!eventSummary) return LISTA_DEFAULT;
    const summary = eventSummary.toUpperCase();
    let baseList;
    if (summary.includes('PASCO')) baseList = ASISTENTES_PASCO;
    else if (summary.includes('ORIENTE')) baseList = ASISTENTES_ORIENTE;
    else if (summary.includes('ENTRENO')) baseList = ENTRENO;
    else baseList = LISTA_DEFAULT;
    const alreadyRegistered = [...attendees, ...nonAttendees];
    return baseList.filter((name) => !alreadyRegistered.includes(name));
  };

  const isValidName = (name) => {
    const validNames = getAsistentesList(selectedEvent?.summary);
    return validNames.includes(name.trim());
  };

  const shouldShowDeleteButton = (attendeeName) => {
    if (user?.roles?.includes('admin')) return true;
    if (user?.roles?.includes('player')) {
      const userNickname = user?.nickname?.trim().toLowerCase();
      const attendeeNameNormalized = attendeeName?.trim().toLowerCase();
      return userNickname && userNickname === attendeeNameNormalized;
    }
    return false;
  };

  const fetchAttendees = async (eventId) => {
    if (!eventId) return;
    try {
      setLoadingAttendees(true);
      const response = await apiCall(`/asistencia/${eventId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setAttendees(data.attendees || []);
      setTotalAttendees(data.total_attendees || 0);
      setNonAttendees(data.non_attendees || []);
      setTotalNonAttendees(data.total_non_attendees || 0);
    } catch (err) {
      console.error('Error al obtener asistentes:', err);
      setAttendees([]);
      setTotalAttendees(0);
    } finally {
      setLoadingAttendees(false);
    }
  };

  useEffect(() => {
    if (!selectedEvent?.id) return;
    setUserName('');
    fetchAttendees(selectedEvent.id);
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (!selectedEvent || !isChuruEvent(selectedEvent.summary)) return;
    const isShowingRival = isLogoHovered || shouldRotateLogo;
    if (!isShowingRival) {
      setCurrentChuruLogoIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentChuruLogoIndex((prev) => (prev === 0 ? 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedEvent, isLogoHovered, shouldRotateLogo]);

  useEffect(() => {
    if (!selectedEvent) return;
    const hasLeagueLogo = getLeagueLogo(selectedEvent.summary);
    const hasRivalLogo = getRivalLogo(selectedEvent.summary);
    if (!hasLeagueLogo || !hasRivalLogo) return;
    setShouldRotateLogo(false);
    const t1 = setTimeout(() => setShouldRotateLogo(true), 500);
    const t2 = setTimeout(() => setShouldRotateLogo(false), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [selectedEvent?.id]);

  const handleAttendEvent = async (willAttend = true) => {
    if (!userName.trim()) {
      setAttendanceMessage('Por favor ingresa tu nombre');
      setSnackbarOpen(true);
      return;
    }
    if (!isValidName(userName)) {
      setAttendanceMessage('Por favor selecciona un nombre válido de la lista');
      setSnackbarOpen(true);
      return;
    }
    if (!selectedEvent?.id) {
      setAttendanceMessage('Error: No se pudo obtener el ID del evento');
      setSnackbarOpen(true);
      return;
    }
    try {
      setAttending(true);
      const response = await apiCall('/asistir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEvent.id,
          user_name: userName.trim(),
          will_attend: willAttend,
        }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          const errorData = await response.json();
          setAttendanceMessage(errorData.detail || 'El usuario ya está registrado para asistir a este evento');
          setSnackbarOpen(true);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await response.json();
      setAttendanceMessage(
        willAttend
          ? `¡Perfecto! Te has registrado para asistir al evento "${selectedEvent.summary}"`
          : `Has registrado que NO asistirás a "${selectedEvent.summary}"`
      );
      setSnackbarOpen(true);
      setUserName('');
      await fetchAttendees(selectedEvent.id);
    } catch (err) {
      console.error('Error al registrar asistencia:', err);
      setAttendanceMessage(`Error al registrar asistencia: ${err.message}`);
      setSnackbarOpen(true);
    } finally {
      setAttending(false);
    }
  };

  const handleDeleteAttendee = (attendeeName) => {
    setAttendeeToDelete(attendeeName);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEvent?.id || !attendeeToDelete) {
      setAttendanceMessage('Error: No se pudo obtener la información necesaria');
      setSnackbarOpen(true);
      return;
    }
    try {
      setDeletingAttendee(attendeeToDelete);
      setConfirmDeleteOpen(false);
      const response = await apiCall(`/cancelar-asistencia/${selectedEvent.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: attendeeToDelete }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setAttendanceMessage(`Se ha eliminado a ${attendeeToDelete} de la lista de asistentes`);
      setSnackbarOpen(true);
      await fetchAttendees(selectedEvent.id);
    } catch (err) {
      console.error('Error al eliminar asistente:', err);
      setAttendanceMessage(`Error al eliminar asistente: ${err.message}`);
      setSnackbarOpen(true);
    } finally {
      setDeletingAttendee(null);
      setAttendeeToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setAttendeeToDelete(null);
  };

  if (!selectedEvent) return null;

  const contentScrollSx =
    layout === 'embedded'
      ? {
          p: 3,
          flex: 1,
          overflowY: 'auto',
          maxHeight: { xs: '70vh', md: 'none' },
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '4px',
            '&:hover': { background: '#a8a8a8' },
          },
        }
      : {
          p: 3,
          flex: 1,
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 200px)',
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '4px',
            '&:hover': { background: '#a8a8a8' },
          },
        };

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: layout === 'embedded' ? 2 : 0,
      }}
    >
      <Box sx={{ p: 3, pb: 2, backgroundColor: 'primary.main', color: 'primary.contrastText', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flexGrow: 1, pr: 1 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
              {selectedEvent.summary}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Detalles del evento
            </Typography>
          </Box>
          {selectedEvent.htmlLink && (
            <IconButton
              href={selectedEvent.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'primary.contrastText',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              }}
              title="Ver en Google Calendar"
            >
              <OpenInNewIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {getLeagueLogo(selectedEvent.summary) && (
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 72, sm: 90 },
            right: 20,
            zIndex: 2,
            width: 80,
            height: 80,
            perspective: getRivalLogo(selectedEvent.summary) ? '1000px' : 'none',
            cursor: getRivalLogo(selectedEvent.summary) ? 'pointer' : 'default',
          }}
          onMouseEnter={() => getRivalLogo(selectedEvent.summary) && setIsLogoHovered(true)}
          onMouseLeave={() => getRivalLogo(selectedEvent.summary) && setIsLogoHovered(false)}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              transformStyle: getRivalLogo(selectedEvent.summary) ? 'preserve-3d' : 'flat',
              transition: getRivalLogo(selectedEvent.summary) ? 'transform 0.6s ease-in-out' : 'none',
              transform: (() => {
                if (getRivalLogo(selectedEvent.summary) && isLogoHovered) return 'rotateY(180deg)';
                if (shouldRotateLogo && getRivalLogo(selectedEvent.summary)) return 'rotateY(180deg)';
                return 'rotateY(0deg)';
              })(),
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: getRivalLogo(selectedEvent.summary) ? 'hidden' : 'visible',
                borderRadius: '50%',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                border: '3px solid white',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& img': {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%',
                },
              }}
            >
              <img
                src={getLeagueLogo(selectedEvent.summary)}
                alt={`Logo ${selectedEvent.summary.includes('PASCO') ? 'PASCO' : 'ORIENTE'}`}
              />
            </Box>
            {getRivalLogo(selectedEvent.summary) && (
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  border: '3px solid white',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotateY(180deg)',
                }}
              >
                {isChuruEvent(selectedEvent.summary) ? (
                  getChuruRivalLogos().map((logo, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        opacity: currentChuruLogoIndex === index ? 1 : 0,
                        transition: 'opacity 0.5s ease-in-out',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '& img': {
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '50%',
                        },
                      }}
                    >
                      <img src={logo} alt={`Logo rival ${index === 0 ? 'Lager' : 'Bohemios'}`} />
                    </Box>
                  ))
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '& img': {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%',
                      },
                    }}
                  >
                    <img src={getRivalLogoUrl(selectedEvent.summary)} alt="Logo del rival" />
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ ...contentScrollSx, pt: getLeagueLogo(selectedEvent.summary) ? 8 : 3 }}>
        {selectedEvent.start && selectedEvent.start.dateTime && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              📅 Fecha y Hora
            </Typography>
            <Typography variant="body1" sx={{ ml: 2 }}>
              {new Date(selectedEvent.start.dateTime).toLocaleString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
            {selectedEvent.end && selectedEvent.end.dateTime && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Hasta:{' '}
                {new Date(selectedEvent.end.dateTime).toLocaleString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            )}
          </Box>
        )}

        {selectedEvent.start && selectedEvent.start.date && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              📅 Todo el Día
            </Typography>
            <Typography variant="body1" sx={{ ml: 2 }}>
              {formatLocalDateEs(selectedEvent.start.date)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              🕐 Horario específico aún no definido
            </Typography>
          </Box>
        )}

        {selectedEvent.location && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              📍 Ubicación
            </Typography>
            <Typography variant="body1" sx={{ ml: 2 }}>
              {selectedEvent.location}
            </Typography>
          </Box>
        )}

        {!isInformationalEvent(selectedEvent.summary) && (
          <Box sx={{ p: 3, backgroundColor: 'grey.50', borderRadius: 1, mb: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}
            >
              🎯 ¿Asistirás a este evento?
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                alignItems: 'stretch',
                mt: 2,
                width: '100%',
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Autocomplete
                  options={getAsistentesList(selectedEvent?.summary)}
                  value={userName}
                  onChange={(e, newValue) => setUserName(newValue || '')}
                  onInputChange={(e, newInputValue) => setUserName(newInputValue)}
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tu nombre"
                      variant="outlined"
                      size="small"
                      sx={{ width: '100%' }}
                      placeholder="Selecciona o escribe tu nombre"
                    />
                  )}
                />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  width: '100%',
                  flexDirection: { xs: 'column', sm: 'row' },
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleAttendEvent(true)}
                  disabled={attending || !userName.trim() || !isValidName(userName)}
                  startIcon={attending ? null : <CheckCircleIcon />}
                  sx={{ fontWeight: 'bold', flex: 1, height: '40px' }}
                >
                  {attending ? <CircularProgress size={20} color="inherit" /> : 'ASISTIRÉ'}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => handleAttendEvent(false)}
                  disabled={attending || !userName.trim() || !isValidName(userName)}
                  startIcon={<CancelIcon />}
                  sx={{ fontWeight: 'bold', flex: 1, height: '40px' }}
                >
                  NO ASISTIRÉ
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {!isInformationalEvent(selectedEvent.summary) && (
          <>
            <Box sx={{ p: 3, backgroundColor: 'success.light', borderRadius: 1, mb: 3 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: 'success.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                }}
              >
                👥 Asistentes Confirmados ({totalAttendees})
              </Typography>
              {loadingAttendees ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <CircularProgress size={20} color="inherit" />
                  <Typography variant="body2" sx={{ color: 'success.contrastText' }}>
                    Cargando asistentes...
                  </Typography>
                </Box>
              ) : attendees.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {attendees.map((attendee, index) => (
                      <Box key={index} sx={{ position: 'relative', display: 'inline-block' }}>
                        <Chip
                          label={attendee}
                          size="small"
                          sx={{
                            backgroundColor: 'success.main',
                            color: 'success.contrastText',
                            fontWeight: 'bold',
                            pr: shouldShowDeleteButton(attendee) ? 3 : 0.5,
                          }}
                        />
                        {shouldShowDeleteButton(attendee) && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteAttendee(attendee)}
                            disabled={deletingAttendee === attendee}
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              backgroundColor: 'error.main',
                              color: 'error.contrastText',
                              width: 20,
                              height: 20,
                              '&:hover': { backgroundColor: 'error.dark' },
                              '&:disabled': { backgroundColor: 'error.light' },
                            }}
                          >
                            {deletingAttendee === attendee ? (
                              <CircularProgress size={12} color="inherit" />
                            ) : (
                              <CloseIcon sx={{ fontSize: 12 }} />
                            )}
                          </IconButton>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'success.contrastText', mt: 2, fontStyle: 'italic' }}>
                  Aún no hay asistentes confirmados para este evento.
                </Typography>
              )}
            </Box>

            <Box sx={{ p: 3, backgroundColor: 'warning.light', borderRadius: 1, mb: 1 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  color: 'warning.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                }}
              >
                ❌ Ausentes ({totalNonAttendees})
              </Typography>
              {loadingAttendees ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <CircularProgress size={20} color="inherit" />
                  <Typography variant="body2" sx={{ color: 'warning.contrastText' }}>
                    Cargando ausentes...
                  </Typography>
                </Box>
              ) : nonAttendees.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {nonAttendees.map((name, index) => (
                      <Box key={index} sx={{ position: 'relative', display: 'inline-block' }}>
                        <Chip
                          label={name}
                          size="small"
                          sx={{
                            backgroundColor: 'warning.main',
                            color: 'warning.contrastText',
                            fontWeight: 'bold',
                            pr: shouldShowDeleteButton(name) ? 3 : 0.5,
                          }}
                        />
                        {shouldShowDeleteButton(name) && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteAttendee(name)}
                            disabled={deletingAttendee === name}
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              backgroundColor: 'error.main',
                              color: 'error.contrastText',
                              width: 20,
                              height: 20,
                              '&:hover': { backgroundColor: 'error.dark' },
                              '&:disabled': { backgroundColor: 'error.light' },
                            }}
                          >
                            {deletingAttendee === name ? (
                              <CircularProgress size={12} color="inherit" />
                            ) : (
                              <CloseIcon sx={{ fontSize: 12 }} />
                            )}
                          </IconButton>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'warning.contrastText', mt: 2, fontStyle: 'italic' }}>
                  No hay ausentes registrados para este evento.
                </Typography>
              )}
            </Box>
          </>
        )}
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={attendanceMessage.includes('ya está registrado') ? 8000 : 6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={
            attendanceMessage.includes('Error') || attendanceMessage.includes('ya está registrado')
              ? 'warning'
              : 'success'
          }
          sx={{ width: '100%' }}
        >
          {attendanceMessage}
        </Alert>
      </Snackbar>

      {confirmDeleteOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: (theme) => theme.zIndex.modal,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.5)',
            p: 2,
          }}
          onClick={handleCancelDelete}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              width: { xs: '100%', sm: '400px' },
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 24,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 3, pb: 2, backgroundColor: 'error.main', color: 'error.contrastText' }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ⚠️ Confirmar Eliminación
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Estás a punto de eliminar a <strong>{attendeeToDelete}</strong> de la lista de asistentes
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
                ¿Estás seguro de que deseas eliminar a <strong>{attendeeToDelete}</strong> de la lista?
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={handleCancelDelete} variant="outlined" color="inherit">
                  Cancelar
                </Button>
                <Button onClick={handleConfirmDelete} variant="contained" color="error">
                  Eliminar
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export { isInformationalEvent, parseLocalDate };
export default EventDetailView;
