import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

const CreateEvent = () => {
  const { authenticatedApiCall } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    startDate: null,
    startTime: null,
    endDate: null,
    endTime: null,
    location: '',
    calendar_id: 'd7dd701e2bb45dee1e2863fddb2b15354bd4f073a1350338cb66b9ee7789f9bb@group.calendar.google.com'
  });

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleDateChange = (field) => (newValue) => {
    setFormData(prev => ({
      ...prev,
      [field]: newValue
    }));
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return null;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const seconds = String(time.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validar campos requeridos
      if (!formData.summary.trim()) {
        throw new Error('El título del evento es requerido');
      }
      
      if (!formData.startDate || !formData.startTime) {
        throw new Error('La fecha y hora de inicio son requeridas');
      }
      
      if (!formData.endDate || !formData.endTime) {
        throw new Error('La fecha y hora de fin son requeridas');
      }

      // Formatear fechas y horas
      const startDateTime = formatDateTime(formData.startDate, formData.startTime);
      const endDateTime = formatDateTime(formData.endDate, formData.endTime);

      if (!startDateTime || !endDateTime) {
        throw new Error('Error al formatear las fechas');
      }

      // Validar que la fecha de fin sea posterior a la de inicio
      const startDate = new Date(startDateTime);
      const endDate = new Date(endDateTime);
      
      if (endDate <= startDate) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // Preparar datos para enviar
      const eventData = {
        summary: formData.summary.trim(),
        description: formData.description.trim(),
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        location: formData.location.trim(),
        calendar_id: formData.calendar_id
      };

      console.log('Enviando evento:', eventData);

      // Hacer la llamada a la API
      const response = await authenticatedApiCall('/eventos', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Evento creado exitosamente:', result);
        setSuccess(true);
        
        // Limpiar formulario
        setFormData({
          summary: '',
          description: '',
          startDate: null,
          startTime: null,
          endDate: null,
          endTime: null,
          location: '',
          calendar_id: 'd7dd701e2bb45dee1e2863fddb2b15354bd4f073a1350338cb66b9ee7789f9bb@group.calendar.google.com'
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error del servidor: ${response.status}`);
      }

    } catch (err) {
      console.error('Error creando evento:', err);
      setError(err.message || 'Error al crear el evento');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      summary: '',
      description: '',
      startDate: null,
      startTime: null,
      endDate: null,
      endTime: null,
      location: '',
      calendar_id: 'd7dd701e2bb45dee1e2863fddb2b15354bd4f073a1350338cb66b9ee7789f9bb@group.calendar.google.com'
    });
    setError(null);
    setSuccess(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
            Crear Nuevo Evento
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Completa los campos para crear un nuevo evento en el calendario
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              ¡Evento creado exitosamente!
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Primera fila: Título, Fecha Inicio, Hora Inicio */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Título del Evento *"
                  value={formData.summary}
                  onChange={handleInputChange('summary')}
                  required
                  variant="outlined"
                  placeholder="Ej: Reunión de Equipo"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Fecha de Inicio *"
                  value={formData.startDate}
                  onChange={handleDateChange('startDate')}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TimePicker
                  label="Hora de Inicio *"
                  value={formData.startTime}
                  onChange={handleDateChange('startTime')}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              {/* Segunda fila: Fecha Fin, Hora Fin, Ubicación */}
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Fecha de Fin *"
                  value={formData.endDate}
                  onChange={handleDateChange('endDate')}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TimePicker
                  label="Hora de Fin *"
                  value={formData.endTime}
                  onChange={handleDateChange('endTime')}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Ubicación"
                  value={formData.location}
                  onChange={handleInputChange('location')}
                  variant="outlined"
                  placeholder="Ej: Sala de Conferencias A"
                />
              </Grid>

              {/* Tercera fila: Descripción (ocupa toda la fila) */}
              <Grid item xs={12} sm={12} md={12} lg={12} xl={12} sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  multiline
                  rows={3}
                  variant="outlined"
                  placeholder="Ej: Reunión semanal del equipo de desarrollo"
                  sx={{ width: '100%' }}
                />
              </Grid>

            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Botones de acción */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={handleReset}
                disabled={loading}
                size="large"
              >
                Limpiar
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Creando...' : 'Crear Evento'}
              </Button>
            </Box>
          </Box>

          {/* Información adicional */}
          <Card sx={{ mt: 4, bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información del Evento
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Los campos marcados con * son obligatorios
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • El evento se creará en el calendario del grupo específico
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Las fechas y horas se guardarán en formato UTC
              </Typography>
            </CardContent>
          </Card>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default CreateEvent;
