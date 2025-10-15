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
} from '@mui/material';
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

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Fetch items from API when component mounts
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('https://synco-api.vercel.app/items/');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setItems(data);
        console.log('Items loaded:', data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
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
          
          return (
            <TableCell
              key={dayIndex}
              align="center"
              onClick={() => day && handleDayClick(day)}
              sx={{
                height: 80,
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
              }}
            >
              {day && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: isSelected || isToday ? 'bold' : 'normal',
                      fontSize: '1rem',
                    }}
                  >
                    {day}
                  </Typography>
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
        Calendario
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

        {/* API Data Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Datos de la API
          </Typography>
          
          {loading && (
            <Typography variant="body2" color="text.secondary">
              Cargando datos...
            </Typography>
          )}
          
          {error && (
            <Typography variant="body2" color="error">
              Error al cargar datos: {error}
            </Typography>
          )}
          
          {!loading && !error && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Items cargados: {items.length}
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
    </Box>
  );
};

export default Calendar;