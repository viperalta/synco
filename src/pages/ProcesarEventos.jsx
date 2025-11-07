import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  MilitaryTech as MilitaryTechIcon,
  CalendarMonth as CalendarMonthIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const ProcesarEventos = () => {
  const { authenticatedApiCall } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [processingRanking, setProcessingRanking] = useState(false);
  const [rankingData, setRankingData] = useState([]);
  const [showRanking, setShowRanking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // ID del calendario de Google Calendar
  const calendarId = 'd7dd701e2bb45dee1e2863fddb2b15354bd4f073a1350338cb66b9ee7789f9bb@group.calendar.google.com';
  
  // Lista de asistentes a ENTRENO
  const ENTRENO = [
    'Vicho', 'Cony', 'Lucas', 'Bastian', 'Buri', 'Diego', 'Catalina', 
    'Gabi', 'Javi Rivas', 'Javi Soto', 'Jorge', 'Kev', 'Kitsu', 'Mariano', 
    'Romy', 'Fernando', 'Andre'
  ];

  // Función para obtener el período actual en formato YYYYMM
  const getCurrentPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
  };

  // Generar períodos: desde Noviembre 2025 hasta el mes actual
  const generatePeriods = () => {
    const periods = [];
    const currentDate = new Date();
    const startDate = new Date(2025, 10, 1); // Noviembre 2025 (mes 10 porque enero es 0)
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    // Generar desde noviembre 2025 hasta el mes actual
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    let date = new Date(startDate);
    
    while (date <= currentDate) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const period = `${year}${month}`;
      
      // Formato: "Noviembre 2025"
      const monthName = monthNames[date.getMonth()];
      const label = `${monthName} ${year}`;
      
      periods.push({ value: period, label });
      
      // Avanzar al siguiente mes
      date.setMonth(date.getMonth() + 1);
    }
    
    // Ordenar de más reciente a más antiguo (mes actual primero)
    return periods.reverse();
  };

  // Cargar eventos del período seleccionado
  const loadEventos = async (period) => {
    if (!period) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Incluir el calendarId en el endpoint con el parámetro period
      const endpoint = `/eventos/${calendarId}?period=${period}`;
      console.log('Cargando eventos:', endpoint);
      
      const response = await authenticatedApiCall(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Eventos cargados:', data);
      
      // Asegurarse de que data sea un array
      // La respuesta puede venir como { items: [...] } o directamente como array
      const eventosArray = Array.isArray(data) 
        ? data 
        : (data.items || data.eventos || []);
      setEventos(eventosArray);
      
      // Procesar ranking automáticamente después de cargar eventos
      if (eventosArray.length > 0) {
        procesarRankingAutomatico(eventosArray);
      }
      
    } catch (error) {
      console.error('Error cargando eventos:', error);
      setError(error.message || 'Error al cargar los eventos');
      setEventos([]);
    } finally {
      setLoading(false);
    }
  };

  // Inicializar con el período actual
  useEffect(() => {
    const currentPeriod = getCurrentPeriod();
    setSelectedPeriod(currentPeriod);
  }, []);

  // Cargar eventos cuando cambia el período seleccionado
  useEffect(() => {
    if (selectedPeriod) {
      // Limpiar ranking cuando cambia el período
      setRankingData([]);
      setShowRanking(false);
      loadEventos(selectedPeriod);
    }
  }, [selectedPeriod]);

  const periods = generatePeriods();

  // Contar eventos que son ENTRENO y que ya hayan ocurrido
  const contarEntrenos = () => {
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0); // Normalizar a inicio del día
    
    return eventos.filter(evento => {
      const titulo = (evento.title || evento.summary || '').toUpperCase();
      if (!titulo.includes('ENTRENO')) {
        return false;
      }
      
      // Verificar que el evento ya haya ocurrido
      let fechaInicio;
      if (evento.start && evento.start.dateTime) {
        fechaInicio = new Date(evento.start.dateTime);
      } else if (evento.start && evento.start.date) {
        fechaInicio = new Date(evento.start.date);
      } else {
        return false;
      }
      
      fechaInicio.setHours(0, 0, 0, 0);
      return fechaInicio < ahora;
    }).length;
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Función para parsear la descripción del evento y extraer asistencias
  const parsearDescripcion = (description) => {
    if (!description || description.trim() === '') {
      return { asistentes: [], noAsistentes: [] };
    }

    const asistentes = [];
    const noAsistentes = [];

    // Buscar sección de asistentes confirmados
    const asistentesMatch = description.match(/✅ ASISTENTES CONFIRMADOS:\s*\n([\s\S]*?)(?=❌|$)/);
    if (asistentesMatch) {
      const asistentesText = asistentesMatch[1];
      // Extraer nombres (formato: "1. Nombre" o solo "Nombre")
      const asistentesLines = asistentesText.split('\n').filter(line => line.trim());
      asistentesLines.forEach(line => {
        // Remover numeración y espacios
        const nombre = line.replace(/^\d+\.\s*/, '').trim();
        if (nombre) {
          asistentes.push(nombre);
        }
      });
    }

    // Buscar sección de no asistentes
    const noAsistentesMatch = description.match(/❌ NO ASISTIRÁN:\s*\n([\s\S]*?)(?=🕒|$)/);
    if (noAsistentesMatch) {
      const noAsistentesText = noAsistentesMatch[1];
      // Extraer nombres (formato: "1. Nombre" o solo "Nombre")
      const noAsistentesLines = noAsistentesText.split('\n').filter(line => line.trim());
      noAsistentesLines.forEach(line => {
        // Remover numeración y espacios
        const nombre = line.replace(/^\d+\.\s*/, '').trim();
        if (nombre) {
          noAsistentes.push(nombre);
        }
      });
    }

    return { asistentes, noAsistentes };
  };

  // Procesar ranking desde descripción (versión automática que recibe eventos como parámetro)
  const procesarRankingAutomatico = async (eventosParaProcesar) => {
    if (!eventosParaProcesar || eventosParaProcesar.length === 0) {
      setRankingData([]);
      setShowRanking(false);
      return;
    }

    setProcessingRanking(true);
    setShowRanking(false);

    try {
      const ahora = new Date();
      ahora.setHours(0, 0, 0, 0); // Normalizar a inicio del día
      
      // Filtrar eventos que contengan "ENTRENO" en el título y que ya hayan ocurrido
      const entrenos = eventosParaProcesar.filter(evento => {
        const titulo = (evento.title || evento.summary || '').toUpperCase();
        if (!titulo.includes('ENTRENO')) {
          return false;
        }
        
        // Verificar que el evento ya haya ocurrido
        let fechaInicio;
        if (evento.start && evento.start.dateTime) {
          fechaInicio = new Date(evento.start.dateTime);
        } else if (evento.start && evento.start.date) {
          fechaInicio = new Date(evento.start.date);
        } else {
          return false;
        }
        
        fechaInicio.setHours(0, 0, 0, 0);
        return fechaInicio < ahora;
      });

      if (entrenos.length === 0) {
        setRankingData([]);
        setShowRanking(false);
        setProcessingRanking(false);
        return;
      }

      console.log(`📊 Procesando ${entrenos.length} entrenamientos para Ranking...`);

      // Obtener asistencias desde la descripción
      const rankingMap = {};
      
      // Inicializar estadísticas para cada usuario
      ENTRENO.forEach(usuario => {
        rankingMap[usuario] = {
          usuario,
          asistencia: 0,
          noAsistencia: 0,
          noResponde: 0,
          total: 0
        };
      });

      // Procesar cada entrenamiento
      for (const entrenamiento of entrenos) {
        const description = entrenamiento.description || '';
        const { asistentes, noAsistentes } = parsearDescripcion(description);

        // Crear sets de usuarios que respondieron
        const respondedUsers = new Set();
        const attendingUsers = new Set();
        const notAttendingUsers = new Set();

        asistentes.forEach(nombre => {
          respondedUsers.add(nombre);
          attendingUsers.add(nombre);
        });

        noAsistentes.forEach(nombre => {
          respondedUsers.add(nombre);
          notAttendingUsers.add(nombre);
        });

        // Para cada usuario en ENTRENO, clasificar su respuesta
        ENTRENO.forEach(usuario => {
          rankingMap[usuario].total++;

          if (attendingUsers.has(usuario)) {
            rankingMap[usuario].asistencia++;
          } else if (notAttendingUsers.has(usuario)) {
            rankingMap[usuario].noAsistencia++;
          } else {
            // No respondió
            rankingMap[usuario].noResponde++;
          }
        });
      }

      // Convertir el mapa a array y calcular porcentajes
      const rankingArray = Object.values(rankingMap).map(stat => ({
        ...stat,
        porcentajeAsistencia: stat.total > 0 ? ((stat.asistencia / stat.total) * 100).toFixed(1) : '0.0',
        porcentajeNoAsistencia: stat.total > 0 ? ((stat.noAsistencia / stat.total) * 100).toFixed(1) : '0.0',
        porcentajeNoResponde: stat.total > 0 ? ((stat.noResponde / stat.total) * 100).toFixed(1) : '0.0'
      }));

      // Ordenar por porcentaje de asistencia (mayor a menor)
      rankingArray.sort((a, b) => {
        const porcentajeA = parseFloat(a.porcentajeAsistencia);
        const porcentajeB = parseFloat(b.porcentajeAsistencia);
        return porcentajeB - porcentajeA;
      });

      // Calcular ranking (manejar empates)
      let ranking = 1;
      rankingArray.forEach((stat, index) => {
        if (index === 0) {
          stat.ranking = 1;
        } else {
          const porcentajeActual = parseFloat(stat.porcentajeAsistencia);
          const porcentajeAnterior = parseFloat(rankingArray[index - 1].porcentajeAsistencia);
          
          if (porcentajeActual !== porcentajeAnterior) {
            ranking = index + 1;
          }
          stat.ranking = ranking;
        }
      });

      // Ordenar primero por ranking (menor a mayor) y luego alfabéticamente por nombre
      rankingArray.sort((a, b) => {
        // Primero por ranking
        if (a.ranking !== b.ranking) {
          return a.ranking - b.ranking;
        }
        // Si tienen el mismo ranking, ordenar alfabéticamente
        return a.usuario.localeCompare(b.usuario, 'es');
      });

      setRankingData(rankingArray);
      setShowRanking(true);
      console.log('✅ Ranking calculado desde descripción:', rankingArray);

    } catch (error) {
      console.error('Error procesando ranking:', error);
      setRankingData([]);
      setShowRanking(false);
    } finally {
      setProcessingRanking(false);
    }
  };


  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <MilitaryTechIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Ranking Asistencia Entrenamientos
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth>
            <InputLabel id="period-select-label">Período</InputLabel>
            <Select
              labelId="period-select-label"
              id="period-select"
              value={selectedPeriod}
              label="Período"
              onChange={(e) => setSelectedPeriod(e.target.value)}
              startAdornment={<CalendarMonthIcon sx={{ mr: 1, color: 'text.secondary' }} />}
            >
              {periods.map((period) => (
                <MenuItem key={period.value} value={period.value}>
                  {period.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {showRanking && rankingData.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                    Ranking
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Usuario</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                    {isMobile ? 'Asistencias(%)' : 'Asistencias'}
                  </TableCell>
                  {!isMobile && (
                    <>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                        % Asistencia
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                        No Asistencia
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                        % No Asistencia
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                        No Responde
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">
                        % No Responde
                      </TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {rankingData.map((stat, index) => (
                  <TableRow key={stat.usuario} hover>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                          {stat.ranking}
                        </Typography>
                        {stat.ranking <= 3 && (
                          <MilitaryTechIcon 
                            sx={{ 
                              fontSize: '1.2rem',
                              color: stat.ranking === 1 ? '#FFD700' : // Dorado
                                     stat.ranking === 2 ? '#C0C0C0' : // Plata
                                     '#CD7F32' // Bronce
                            }} 
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 'medium',
                        cursor: isMobile ? 'pointer' : 'default',
                        '&:hover': isMobile ? { textDecoration: 'underline' } : {}
                      }}
                      onClick={() => {
                        if (isMobile) {
                          setSelectedUser(stat);
                          setModalOpen(true);
                        }
                      }}
                    >
                      {stat.usuario}
                    </TableCell>
                    <TableCell align="center">
                      {isMobile ? (
                        <Typography variant="body2" fontWeight="bold">
                          {stat.asistencia} ({stat.porcentajeAsistencia}%)
                        </Typography>
                      ) : (
                        <Chip 
                          label={stat.asistencia} 
                          color="success" 
                          size="small"
                        />
                      )}
                    </TableCell>
                    {!isMobile && (
                      <>
                        <TableCell align="center">
                          <Typography variant="body2" color="success.main" fontWeight="bold">
                            {stat.porcentajeAsistencia}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={stat.noAsistencia} 
                            color="error" 
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="error.main" fontWeight="bold">
                            {stat.porcentajeNoAsistencia}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={stat.noResponde} 
                            color="warning" 
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="warning.main" fontWeight="bold">
                            {stat.porcentajeNoResponde}%
                          </Typography>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Modal para mostrar información completa en mobile */}
      <Dialog 
        open={modalOpen} 
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {selectedUser?.usuario}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Ranking: {selectedUser.ranking}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="success.main" fontWeight="bold" gutterBottom>
                  Asistencias
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={selectedUser.asistencia} 
                    color="success" 
                    size="small"
                  />
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    {selectedUser.porcentajeAsistencia}%
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="error.main" fontWeight="bold" gutterBottom>
                  No Asistencia
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={selectedUser.noAsistencia} 
                    color="error" 
                    size="small"
                  />
                  <Typography variant="body2" color="error.main" fontWeight="bold">
                    {selectedUser.porcentajeNoAsistencia}%
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="warning.main" fontWeight="bold" gutterBottom>
                  No Responde
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={selectedUser.noResponde} 
                    color="warning" 
                    size="small"
                  />
                  <Typography variant="body2" color="warning.main" fontWeight="bold">
                    {selectedUser.porcentajeNoResponde}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProcesarEventos;

