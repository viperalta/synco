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
} from '@mui/material';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDayClick = (day) => {
    const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newSelectedDate);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
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
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom color="primary" align="center">
        Calendario Eventos Falsos
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        {/* Calendar Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          px: 2
        }}>
          <IconButton 
            onClick={handlePreviousMonth} 
            size="large"
            sx={{ 
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Typography>
          
          <IconButton 
            onClick={handleNextMonth} 
            size="large"
            sx={{ 
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Calendar Table */}
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

        {/* Calendar Info */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Haz clic en cualquier día para seleccionarlo
          </Typography>
          <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
            Fecha seleccionada: {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </Typography>
        </Box>

        {/* Debug Info */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom color="primary">
            🔍 Debug Info
          </Typography>
          <Typography variant="body2">
            📊 Total eventos cargados: {items?.length || 0}
          </Typography>
          <Typography variant="body2">
            📅 Mes actual: {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Typography>
          <Typography variant="body2">
            🎯 Día seleccionado: {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
          </Typography>
          <Typography variant="body2">
            📝 Eventos en día seleccionado: {getEventsForDay(selectedDate.getDate()).length}
          </Typography>
        </Box>

        {/* Selected Day Events */}
        {(() => {
          const selectedDayEvents = getEventsForDay(selectedDate.getDate());
          return selectedDayEvents.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Eventos del {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selectedDayEvents.map((event, index) => (
                  <Paper 
                    key={index} 
                    elevation={2} 
                    sx={{ 
                      p: 2, 
                      cursor: 'pointer',
                      '&:hover': {
                        elevation: 4,
                        backgroundColor: 'action.hover',
                      }
                    }}
                    onClick={() => handleEventClick(event)}
                  >
                    <Typography variant="h6" gutterBottom>
                      {event.summary}
                    </Typography>
                    {event.start && event.start.dateTime && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        📅 {new Date(event.start.dateTime).toLocaleString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    )}
                    {event.start && event.start.date && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        📅 Todo el día: {new Date(event.start.date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                    )}
                    {event.start && event.start.date && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        🕐 Horario específico aún no definido
                      </Typography>
                    )}
                    {event.end && event.end.dateTime && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        🕐 Hasta: {new Date(event.end.dateTime).toLocaleString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    )}
                    {event.location && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        📍 {event.location}
                      </Typography>
                    )}
                    {event.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {event.description}
                      </Typography>
                    )}
                    {event.htmlLink && (
                      <Box sx={{ mt: 1 }}>
                        <a 
                          href={event.htmlLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: '#1976d2', 
                            textDecoration: 'none',
                            fontSize: '0.875rem'
                          }}
                        >
                          Ver en Google Calendar →
                        </a>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            </Box>
          );
        })()}

        {/* Eventos API Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Eventos del Calendario
          </Typography>
          
          {loading && (
            <Typography variant="body2" color="text.secondary">
              Cargando eventos...
            </Typography>
          )}
          
          {error && (
            <Typography variant="body2" color="error">
              Error al cargar eventos: {error}
            </Typography>
          )}
          
          {!loading && !error && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Eventos cargados: {items.length}
              </Typography>
              {items.length > 0 && (
                <Paper elevation={1} sx={{ p: 2, mt: 1, maxHeight: 200, overflow: 'auto' }}>
                  <pre style={{ fontSize: '0.8rem', margin: 0 }}>
                    {JSON.stringify(items, null, 2)}
                  </pre>
                </Paper>
              )}
            </Box>
          )}
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
            maxHeight: '80vh',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 0,
            overflow: 'hidden',
          }}
        >
          {selectedEvent && (
            <Box>
              {/* Modal Header */}
              <Box sx={{ p: 3, pb: 2, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {selectedEvent.summary}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Detalles del evento
                </Typography>
              </Box>

              {/* Modal Content */}
              <Box sx={{ p: 3, maxHeight: '60vh', overflow: 'auto' }}>
                {/* Date and Time */}
                {selectedEvent.start && selectedEvent.start.dateTime && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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

                <Divider sx={{ my: 2 }} />

                {/* Location */}
                {selectedEvent.location && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      📍 Ubicación
                    </Typography>
                    <Typography variant="body1" sx={{ ml: 2 }}>
                      {selectedEvent.location}
                    </Typography>
                  </Box>
                )}

                {/* Description */}
                {selectedEvent.description && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      📝 Descripción
                    </Typography>
                    <Typography variant="body1" sx={{ ml: 2, whiteSpace: 'pre-wrap' }}>
                      {selectedEvent.description}
                    </Typography>
                  </Box>
                )}

                {/* Status */}
                {selectedEvent.status && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      ✅ Estado
                    </Typography>
                    <Chip 
                      label={selectedEvent.status === 'confirmed' ? 'Confirmado' : selectedEvent.status}
                      color={selectedEvent.status === 'confirmed' ? 'success' : 'default'}
                      sx={{ ml: 2 }}
                    />
                  </Box>
                )}

                {/* Google Calendar Link */}
                {selectedEvent.htmlLink && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      🔗 Enlaces
                    </Typography>
                    <Button
                      variant="outlined"
                      href={selectedEvent.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ ml: 2 }}
                    >
                      Ver en Google Calendar
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Modal Footer */}
              <Box sx={{ p: 3, pt: 2, backgroundColor: 'grey.50', display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleCloseModal} variant="contained">
                  Cerrar
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default Calendar;