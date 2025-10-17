import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Modal,
  Button,
  Divider,
  CircularProgress,
  Backdrop,
  TextField,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
} from '@mui/material';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  OpenInNew as OpenInNewIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
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
  const [magicWord, setMagicWord] = useState('');

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Start weeks on Monday
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Fetch eventos from API when component mounts
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Usar la configuración centralizada de API
        const calendarId = 'd7dd701e2bb45dee1e2863fddb2b15354bd4f073a1350338cb66b9ee7789f9bb@group.calendar.google.com';
        const apiUrl = buildApiUrl(API_ENDPOINTS.EVENTOS(calendarId));
        
        console.log(`🔗 Llamando a la API: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const events = data.items || data;
        setItems(events);
        console.log(`✅ Eventos cargados: ${events?.length || 0} eventos`);
        
        // Debug detallado de todos los eventos
        console.log('📋 Lista completa de eventos:');
        events.forEach((event, index) => {
          console.log(`📝 Evento ${index + 1}:`, {
            summary: event.summary,
            start: event.start,
            end: event.end,
            hasDateTime: !!(event.start && event.start.dateTime),
            dateTime: event.start?.dateTime
          });
        });
      } catch (err) {
        console.error('❌ Error fetching eventos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, []);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    // JS getDay(): 0=Sun,1=Mon,... Convert to Monday-based index (0=Mon,..,6=Sun)
    const dow = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return (dow + 6) % 7;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleMonthChange = (event) => {
    const selectedMonth = event.target.value;
    const newDate = new Date(currentDate.getFullYear(), selectedMonth);
    setCurrentDate(newDate);
  };

  const handleYearChange = (event) => {
    const selectedYear = event.target.value;
    const newDate = new Date(selectedYear, currentDate.getMonth());
    setCurrentDate(newDate);
  };

  // Función para obtener eventos del mes seleccionado
  const getEventsForMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return items.filter(event => {
      let eventDate;
      
      if (event.start && event.start.dateTime) {
        eventDate = new Date(event.start.dateTime);
      } else if (event.start && event.start.date) {
        eventDate = new Date(event.start.date);
      } else {
        return false;
      }
      
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    }).sort((a, b) => {
      const dateA = a.start.dateTime ? new Date(a.start.dateTime) : new Date(a.start.date);
      const dateB = b.start.dateTime ? new Date(b.start.dateTime) : new Date(b.start.date);
      return dateA - dateB;
    });
  };

  const handleDayClick = (day) => {
    const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newSelectedDate);
  };

  const handleEventClick = async (event) => {
    setSelectedEvent(event);
    setModalOpen(true);
    
    // Cargar asistentes del evento
    await fetchAttendees(event.id);
  };

  const fetchAttendees = async (eventId) => {
    if (!eventId) return;
    
    try {
      setLoadingAttendees(true);
      const response = await fetch(buildApiUrl(`/asistencia/${eventId}`));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
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

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
    setUserName('');
    setAttending(false);
    setAttendanceMessage('');
    setAttendees([]);
    setTotalAttendees(0);
    setNonAttendees([]);
    setTotalNonAttendees(0);
    setLoadingAttendees(false);
    setDeletingAttendee(null);
    setConfirmDeleteOpen(false);
    setAttendeeToDelete(null);
    setMagicWord('');
  };

  const handleDeleteAttendee = (attendeeName) => {
    setAttendeeToDelete(attendeeName);
    setMagicWord('');
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (magicWord.toLowerCase() !== 'synco') {
      setAttendanceMessage('Palabra incorrecta. Comunícate con el administrador');
      setSnackbarOpen(true);
      return;
    }

    if (!selectedEvent?.id || !attendeeToDelete) {
      setAttendanceMessage('Error: No se pudo obtener la información necesaria');
      setSnackbarOpen(true);
      return;
    }

    try {
      setDeletingAttendee(attendeeToDelete);
      setConfirmDeleteOpen(false);
      
      const response = await fetch(buildApiUrl(`/cancelar-asistencia/${selectedEvent.id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: attendeeToDelete
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setAttendanceMessage(`Se ha eliminado a ${attendeeToDelete} de la lista de asistentes`);
      setSnackbarOpen(true);
      
      // Recargar la lista de asistentes
      await fetchAttendees(selectedEvent.id);
      
    } catch (err) {
      console.error('Error al eliminar asistente:', err);
      setAttendanceMessage(`Error al eliminar asistente: ${err.message}`);
      setSnackbarOpen(true);
    } finally {
      setDeletingAttendee(null);
      setAttendeeToDelete(null);
      setMagicWord('');
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setAttendeeToDelete(null);
    setMagicWord('');
  };

  // Listas de asistentes por tipo de evento
  const ASISTENTES_PASCO = [
    'Cony', 'Vicho', 'Buri', 'Andre', 'Bastian', 'Carlos', 'Diego', 'Catalina', 
    'Claudio andres', 'Gabi', 'Javi Soto', 'Jorge', 'Kitsu', 'Lucas', 'Mariano', 
    'Romy', 'Sofi'
  ];

  const ASISTENTES_ORIENTE = [
    'Vicho', 'Cony', 'Lucas', 'Bastian', 'Buri', 'Carlos', 'Diego', 'Catalina', 
    'Gabi', 'Javi Rivas', 'Javi Soto', 'Jorge', 'Kev', 'Kitsu', 'Mariano', 
    'Romy'
  ];

  const LISTA_DEFAULT = [
    'Vicho', 'Cony', 'Lucas', 'Bastian', 'Buri', 'Carlos', 'Diego', 'Catalina', 
    'Gabi', 'Javi Rivas', 'Javi Soto', 'Jorge', 'Kev', 'Kitsu', 'Mariano', 
    'Romy', 'Claudio andres', 'Sofi', 'Fernando'
  ];

  const ENTRENO = [
    'Vicho', 'Cony', 'Lucas', 'Bastian', 'Buri', 'Carlos', 'Diego', 'Catalina', 
    'Gabi', 'Javi Rivas', 'Javi Soto', 'Jorge', 'Kev', 'Kitsu', 'Mariano', 
    'Romy', 'Fernando'
  ];

  // Función para obtener la lista de asistentes según el tipo de evento
  const getAsistentesList = (eventSummary) => {
    if (!eventSummary) return LISTA_DEFAULT;
    
    const summary = eventSummary.toUpperCase();
    let baseList;
    if (summary.includes('PASCO')) {
      baseList = ASISTENTES_PASCO;
    } else if (summary.includes('ORIENTE')) {
      baseList = ASISTENTES_ORIENTE;
    } else if (summary.includes('ENTRENO')) {
      baseList = ENTRENO;
    } else {
      baseList = LISTA_DEFAULT;
    }

    // Filtrar nombres que ya están en asistentes confirmados o ausentes
    const alreadyRegistered = [...attendees, ...nonAttendees];
    return baseList.filter(name => !alreadyRegistered.includes(name));
  };

  const isValidName = (name) => {
    const validNames = getAsistentesList(selectedEvent?.summary);
    return validNames.includes(name.trim());
  };

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
      
      const response = await fetch(buildApiUrl('/asistir'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: selectedEvent.id,
          user_name: userName.trim(),
          will_attend: willAttend
        })
      });

      if (!response.ok) {
        // Manejar error 409 (usuario ya registrado)
        if (response.status === 409) {
          const errorData = await response.json();
          const errorMessage = errorData.detail || 'El usuario ya está registrado para asistir a este evento';
          setAttendanceMessage(errorMessage);
          setSnackbarOpen(true);
          return;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setAttendanceMessage(
        willAttend
          ? `¡Perfecto! Te has registrado para asistir al evento "${selectedEvent.summary}"`
          : `Has registrado que NO asistirás a "${selectedEvent.summary}"`
      );
      setSnackbarOpen(true);
      
      // Limpiar el input después del éxito
      setUserName('');
      
      // Recargar la lista de asistentes
      await fetchAttendees(selectedEvent.id);
      
    } catch (err) {
      console.error('Error al registrar asistencia:', err);
      setAttendanceMessage(`Error al registrar asistencia: ${err.message}`);
      setSnackbarOpen(true);
    } finally {
      setAttending(false);
    }
  };

  // Get events for a specific day
  const getEventsForDay = (day) => {
    if (!items || items.length === 0) return [];
    
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const targetDateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const filteredEvents = items.filter(event => {
      if (event.start) {
        // Eventos con hora específica (start.dateTime)
        if (event.start.dateTime) {
          const eventDate = new Date(event.start.dateTime);
          const eventDateString = eventDate.toISOString().split('T')[0];
          return eventDateString === targetDateString;
        }
        
        // Eventos de todo el día (start.date)
        if (event.start.date) {
          return event.start.date === targetDateString;
        }
      }
      return false;
    });

    // Debug logging para entender qué está pasando
    if (day === 1) { // Solo log para el primer día del mes para evitar spam
      console.log(`🔍 Debug eventos para día ${day}:`);
      console.log(`📅 Fecha objetivo: ${targetDateString}`);
      console.log(`📊 Total eventos disponibles: ${items.length}`);
      console.log(`🎯 Eventos encontrados para este día: ${filteredEvents.length}`);
      
      // Mostrar detalles de todos los eventos
      items.forEach((event, index) => {
        if (event.start) {
          if (event.start.dateTime) {
            const eventDate = new Date(event.start.dateTime);
            const eventDateString = eventDate.toISOString().split('T')[0];
            console.log(`📝 Evento ${index + 1}: "${event.summary}" - Fecha: ${eventDateString} (dateTime) - Match: ${eventDateString === targetDateString}`);
          } else if (event.start.date) {
            console.log(`📝 Evento ${index + 1}: "${event.summary}" - Fecha: ${event.start.date} (date) - Match: ${event.start.date === targetDateString}`);
          } else {
            console.log(`⚠️ Evento ${index + 1}: "${event.summary}" - SIN FECHA VÁLIDA`);
          }
        } else {
          console.log(`⚠️ Evento ${index + 1}: "${event.summary}" - SIN START`);
        }
      });
    }
    
    return filteredEvents;
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();
    
    const weeks = [];
    let currentWeek = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      
      // If we have 7 days in the week, start a new week
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }
    
    // Add remaining empty cells to complete the last week
    while (currentWeek.length < 7 && currentWeek.length > 0) {
      currentWeek.push(null);
    }
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks.map((week, weekIndex) => (
      <TableRow key={weekIndex}>
        {week.map((day, dayIndex) => {
          const isToday = day === today.getDate() && 
            currentDate.getMonth() === today.getMonth() && 
            currentDate.getFullYear() === today.getFullYear();
          
          const isSelected = day === selectedDate.getDate() && 
            currentDate.getMonth() === selectedDate.getMonth() && 
            currentDate.getFullYear() === selectedDate.getFullYear();
          
          const dayEvents = getEventsForDay(day);
          const hasEvents = dayEvents.length > 0;
          
          return (
            <TableCell
              key={dayIndex}
              align="center"
              onClick={() => day && handleDayClick(day)}
              sx={{
                height: 120, // Increased height to accommodate events
                width: '14.28%',
                border: '1px solid',
                borderColor: 'divider',
                cursor: day ? 'pointer' : 'default',
                backgroundColor: isSelected ? 'secondary.main' : 
                  isToday ? 'primary.main' : 'transparent',
                color: isSelected ? 'secondary.contrastText' : 
                  isToday ? 'primary.contrastText' : 'text.primary',
                '&:hover': day ? {
                  backgroundColor: isSelected ? 'secondary.dark' : 
                    isToday ? 'primary.dark' : 'action.hover',
                } : {},
                position: 'relative',
                transition: 'all 0.2s ease-in-out',
                verticalAlign: 'top',
                padding: '4px',
              }}
            >
              {day && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    height: '100%',
                    width: '100%',
                  }}
                >
                  {/* Day number */}
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: isSelected || isToday ? 'bold' : 'normal',
                      fontSize: '1rem',
                      mb: 0.5,
                    }}
                  >
                    {day}
                  </Typography>
                  
                  {/* Events for this day */}
                  {hasEvents && (
                    <Box sx={{ width: '100%', maxHeight: '80px', overflow: 'hidden' }}>
                      {dayEvents.slice(0, 2).map((event, eventIndex) => (
                        <Chip
                          key={eventIndex}
                          label={event.summary || 'Evento'}
                          size="small"
                          clickable
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          sx={{
                            fontSize: '0.6rem',
                            height: 16,
                            mb: 0.5,
                            width: '100%',
                            backgroundColor: 'info.light',
                            color: 'info.contrastText',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'info.main',
                            },
                            '& .MuiChip-label': {
                              padding: '0 4px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }
                          }}
                        />
                      ))}
                      {dayEvents.length > 2 && (
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                          +{dayEvents.length - 2} más
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {/* Status chips */}
                  {isToday && (
                    <Chip
                      label="Hoy"
                      size="small"
                      color="secondary"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        fontSize: '0.7rem',
                        height: 16,
                      }}
                    />
                  )}
                  {isSelected && !isToday && (
                    <Chip
                      label="Seleccionado"
                      size="small"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        fontSize: '0.7rem',
                        height: 16,
                      }}
                    />
                  )}
                </Box>
              )}
            </TableCell>
          );
        })}
      </TableRow>
    ));
  };

  return (
    <Box sx={{ 
      px: { xs: 2, sm: 2 }, 
      py: { xs: 0.5, sm: 2 }, 
      maxWidth: '100%', 
      overflow: 'hidden',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <Typography variant="h4" component="h1" gutterBottom color="primary" align="center" sx={{ fontSize: { xs: '1.2rem', sm: '2rem' } }}>
        Calendario Eventos Falsos
      </Typography>
      
      <Paper elevation={3} sx={{ 
        p: { xs: 2, sm: 3 }, 
        mt: 2, 
        maxWidth: '100%', 
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Calendar Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: { xs: 2, sm: 3 },
          px: { xs: 0, sm: 2 }
        }}>
          <IconButton 
            onClick={handlePreviousMonth} 
            size="small"
            sx={{ 
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              display: { xs: 'none', md: 'flex' }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <Typography variant="h4" component="h2" sx={{ 
            fontWeight: 'bold',
            fontSize: { xs: '1rem', sm: '2rem' },
            textAlign: 'center',
            flex: 1,
            mx: { xs: 0.5, sm: 1 }
          }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Typography>
          
          <IconButton 
            onClick={handleNextMonth} 
            size="small"
            sx={{ 
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              display: { xs: 'none', md: 'flex' }
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Mobile View - Event Cards */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {/* Month/Year Selector for Mobile */}
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 }, 
            mb: 3, 
            justifyContent: 'center',
            flexWrap: 'wrap',
            px: 0.5
          }}>
            <FormControl size="small" sx={{ minWidth: { xs: 100, sm: 120 }, flex: 1 }}>
              <InputLabel>Mes</InputLabel>
              <Select
                value={currentDate.getMonth()}
                label="Mes"
                onChange={handleMonthChange}
              >
                {monthNames.map((month, index) => (
                  <MenuItem key={index} value={index}>{month}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: { xs: 80, sm: 100 }, flex: 1 }}>
              <InputLabel>Año</InputLabel>
              <Select
                value={currentDate.getFullYear()}
                label="Año"
                onChange={handleYearChange}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 1 + i;
                  return (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>

          {/* Event Cards */}
          <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ px: { xs: 0, sm: 0 }, mx: { xs: 0, sm: 0 } }} alignItems="stretch">
            {getEventsForMonth().map((event, index) => (
              <Grid item xs={12} key={index} sx={{ display: 'flex', p: { xs: 0, sm: 1 }, flex: '0 0 100%' }}>
                <Card 
                  elevation={2}
                  sx={{ 
                    cursor: 'pointer',
                    mx: { xs: 0, sm: 0 },
                    width: '100%',
                    flexGrow: 1,
                    alignSelf: 'stretch',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      elevation: 4,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                  onClick={() => handleEventClick(event)}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 }, width: '100%', wordBreak: 'break-word' }}>
                    <Typography variant="h6" component="h2" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      {event.summary}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {event.start && event.start.dateTime ? (
                        <>
                          📅 {new Date(event.start.dateTime).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          <br />
                          🕐 {new Date(event.start.dateTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {event.end && event.end.dateTime && (
                            <> - {new Date(event.end.dateTime).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</>
                          )}
                        </>
                      ) : event.start && event.start.date ? (
                        <>
                          📅 {new Date(event.start.date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          <br />
                          🕐 Horario específico aún no definido
                        </>
                      ) : (
                        '📅 Fecha no disponible'
                      )}
                    </Typography>
                    
                    {event.location && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        📍 {event.location}
                      </Typography>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ p: { xs: 1, sm: 2 } }}>
                    <Button 
                      size="small" 
                      color="primary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Ver detalles
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            
            {getEventsForMonth().length === 0 && (
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center', mx: { xs: 0.5, sm: 0 } }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    No hay eventos programados para {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Desktop View - Calendar Table */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {dayNames.map((day) => (
                  <TableCell
                    key={day}
                    align="center"
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      py: 2,
                      border: '1px solid',
                      borderColor: 'primary.dark',
                    }}
                  >
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {renderCalendarGrid()}
            </TableBody>
          </Table>
        </TableContainer>
        </Box>

        {/* Calendar Info - Desktop Only */}
        <Box sx={{ mt: 3, textAlign: 'center', display: { xs: 'none', md: 'block' } }}>
          <Typography variant="body2" color="text.secondary">
            Haz clic en cualquier día para seleccionarlo
          </Typography>
          <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
            Fecha seleccionada: {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </Typography>
        </Box>



      </Paper>

      {/* Event Details Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="event-modal-title"
        aria-describedby="event-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: '500px' },
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {selectedEvent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Modal Header */}
              <Box sx={{ p: 3, pb: 2, backgroundColor: 'primary.main', color: 'primary.contrastText', flexShrink: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {selectedEvent.summary}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Detalles del evento
                    </Typography>
                  </Box>
                  
                  {/* Google Calendar Link Icon */}
                  {selectedEvent.htmlLink && (
                    <IconButton
                      href={selectedEvent.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: 'primary.contrastText',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        }
                      }}
                      title="Ver en Google Calendar"
                    >
                      <OpenInNewIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>

              {/* Modal Content */}
              <Box sx={{ 
                p: 3, 
                flex: 1,
                overflowY: 'auto',
                maxHeight: 'calc(90vh - 200px)', // Altura fija para forzar scroll
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#c1c1c1',
                  borderRadius: '4px',
                  '&:hover': {
                    background: '#a8a8a8',
                  },
                },
              }}>
                {/* Date and Time */}
                {selectedEvent.start && selectedEvent.start.dateTime && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      📅 Fecha y Hora
                    </Typography>
                    <Typography variant="body1" sx={{ ml: 2 }}>
                      {new Date(selectedEvent.start.dateTime).toLocaleString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                    {selectedEvent.end && selectedEvent.end.dateTime && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                        Hasta: {new Date(selectedEvent.end.dateTime).toLocaleString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* All Day Event */}
                {selectedEvent.start && selectedEvent.start.date && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      📅 Todo el Día
                    </Typography>
                    <Typography variant="body1" sx={{ ml: 2 }}>
                      {new Date(selectedEvent.start.date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      🕐 Horario específico aún no definido
                    </Typography>
                  </Box>
                )}

                {/* Location */}
                {selectedEvent.location && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      📍 Ubicación
                    </Typography>
                    <Typography variant="body1" sx={{ ml: 2 }}>
                      {selectedEvent.location}
                    </Typography>
                  </Box>
                )}

                {/* Attendance Section */}
                <Box sx={{ p: 3, backgroundColor: 'grey.50', borderRadius: 1, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'text.primary', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    🎯 ¿Asistirás a este evento?
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 2, 
                    alignItems: 'stretch', 
                    mt: 2,
                    width: '100%'
                  }}>
                    {/* Primera fila: Selector */}
                    <Box sx={{ width: '100%' }}>
                      <Autocomplete
                        options={getAsistentesList(selectedEvent?.summary)}
                        value={userName}
                        onChange={(event, newValue) => {
                          setUserName(newValue || '');
                        }}
                        onInputChange={(event, newInputValue) => {
                          setUserName(newInputValue);
                        }}
                        freeSolo
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Tu nombre"
                            variant="outlined"
                            size="small"
                            sx={{ 
                              width: '100%'
                            }}
                            placeholder="Selecciona o escribe tu nombre"
                          />
                        )}
                      />
                    </Box>
                    
                    {/* Segunda fila: Botones */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      width: '100%',
                      flexDirection: { xs: 'column', sm: 'row' }
                    }}>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleAttendEvent(true)}
                        disabled={attending || !userName.trim() || !isValidName(userName)}
                        sx={{ 
                          fontWeight: 'bold',
                          flex: 1,
                          height: '40px'
                        }}
                      >
                        {attending ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          'ASISTIRÉ'
                        )}
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => handleAttendEvent(false)}
                        disabled={attending || !userName.trim() || !isValidName(userName)}
                        sx={{ 
                          fontWeight: 'bold',
                          flex: 1,
                          height: '40px'
                        }}
                      >
                        NO ASISTIRÉ
                      </Button>
                    </Box>
                  </Box>
                </Box>

                {/* Attendees Section */}
                <Box sx={{ p: 3, backgroundColor: 'success.light', borderRadius: 1, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'success.contrastText', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
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
                                pr: 3 // Espacio para el icono
                              }}
                            />
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
                                '&:hover': {
                                  backgroundColor: 'error.dark',
                                },
                                '&:disabled': {
                                  backgroundColor: 'error.light',
                                }
                              }}
                            >
                              {deletingAttendee === attendee ? (
                                <CircularProgress size={12} color="inherit" />
                              ) : (
                                <CloseIcon sx={{ fontSize: 12 }} />
                              )}
                            </IconButton>
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

                {/* Non Attendees Section */}
                <Box sx={{ p: 3, backgroundColor: 'warning.light', borderRadius: 1, mb: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'warning.contrastText', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
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
                                pr: 3
                              }}
                            />
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
                                '&:hover': {
                                  backgroundColor: 'error.dark',
                                },
                                '&:disabled': {
                                  backgroundColor: 'error.light',
                                }
                              }}
                            >
                              {deletingAttendee === name ? (
                                <CircularProgress size={12} color="inherit" />
                              ) : (
                                <CloseIcon sx={{ fontSize: 12 }} />
                              )}
                            </IconButton>
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

              </Box>

              {/* Modal Footer */}
              <Box sx={{ p: 3, pt: 2, backgroundColor: 'grey.50', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                <Button onClick={handleCloseModal} variant="contained">
                  Cerrar
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Modal>

      {/* Loading Overlay */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }}
        open={loading}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          gap: 2
        }}>
          <CircularProgress size={80} color="inherit" />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Cargando eventos...
          </Typography>
        </Box>
      </Backdrop>

      {/* Delete Confirmation Modal */}
      <Modal
        open={confirmDeleteOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-confirmation-title"
        aria-describedby="delete-confirmation-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: '400px' },
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 0,
            overflow: 'hidden',
          }}
        >
          {/* Modal Header */}
          <Box sx={{ p: 3, pb: 2, backgroundColor: 'error.main', color: 'error.contrastText' }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              ⚠️ Confirmar Eliminación
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Estás a punto de eliminar a <strong>{attendeeToDelete}</strong> de la lista de asistentes
            </Typography>
          </Box>

          {/* Modal Content */}
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
              ¿Cuál es la palabra mágica?
            </Typography>
            
            <TextField
              fullWidth
              label="Palabra mágica"
              value={magicWord}
              onChange={(e) => setMagicWord(e.target.value)}
              variant="outlined"
              placeholder="Escribe la palabra mágica aquí..."
              sx={{ mb: 3 }}
              autoFocus
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button 
                onClick={handleCancelDelete} 
                variant="outlined"
                color="inherit"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmDelete} 
                variant="contained"
                color="error"
                disabled={!magicWord.trim()}
              >
                Eliminar
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar for attendance messages */}
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
    </Box>
  );
};

export default Calendar;