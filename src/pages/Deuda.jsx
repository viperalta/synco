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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip,
  Checkbox,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Deuda = () => {
  const { authenticatedApiCall, getAuthToken } = useAuth();
  
  const [period, setPeriod] = useState('');
  const [users, setUsers] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [info, setInfo] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [debtsToSave, setDebtsToSave] = useState([]);
  const [editedDebts, setEditedDebts] = useState({});
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkDebtAmount, setBulkDebtAmount] = useState('');
  
  // Función para obtener el período actual
  const getCurrentPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
  };

  // Generar períodos para el selector
  const generatePeriods = () => {
    const periods = [];
    const currentDate = new Date();
    
    for (let i = -6; i < 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const period = `${year}${month}`;
      
      const label = date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      }).replace(/^\w/, (c) => c.toUpperCase()).replace(' de ', ' ');
      
      periods.push({ value: period, label });
    }
    
    return periods;
  };

  // Función para formatear el período
  const formatPeriod = (period) => {
    if (!period || period.length !== 6) return period;
    
    const year = period.substring(0, 4);
    const month = period.substring(4, 6);
    
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    const monthName = date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long' 
    }).replace(/^\w/, (c) => c.toUpperCase()).replace(' de ', ' ');
    
    return monthName;
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  // Cargar usuarios
  const loadUsers = async () => {
    if (!period) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authenticatedApiCall('/admin/users');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error cargando usuarios');
      }

      const data = await response.json();
      
      // Filtrar usuarios con rol 'player'
      const players = (data.users || []).filter(user => {
        return user.roles && user.roles.includes('player');
      });
      
      // Ordenar por nombre
      players.sort((a, b) => {
        const nameA = (a.nickname || a.name || '').toLowerCase();
        const nameB = (b.nickname || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      setUsers(players);
      
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar deudas
  const loadDebts = async () => {
    if (!period) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authenticatedApiCall(`/admin/debts/${period}`);
      
      const data = await response.json();
      console.log('Datos de deuda recibidos:', data);
      
      // El endpoint devuelve un objeto con debtors, no un array
      // Convertir a array para mantener compatibilidad con getDebtForUser
      const debtors = data.debtors || [];
      console.log('Debtors:', debtors);
      
      // Guardar como array para que funcione con flatMap
      setDebts([{ debtors: debtors }]);
      
      // Limpiar mensajes si hay deudas
      setSuccess('');
      setInfo('');
      
    } catch (error) {
      console.error('Error cargando deudas:', error);
      
      // Si es un error 404, intentar obtener el detalle del error
      if (error.message && error.message.includes('404')) {
        try {
          // Hacer la llamada nuevamente pero sin usar authenticatedApiCall para obtener el JSON del error
          const token = await getAuthToken();
          const backendUrl = import.meta.env.DEV 
            ? 'http://localhost:8000' 
            : 'https://api.pasesfalsos.cl';
          
          const directResponse = await fetch(`${backendUrl}/admin/debts/${period}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          });
          
          if (directResponse.status === 404) {
            const errorData = await directResponse.json();
            console.log('Error data:', errorData);
            
            // Verificar si el mensaje es de deuda no encontrada
            if (errorData.detail && errorData.detail.includes('Deuda no encontrada')) {
              // No es un error, simplemente no hay deuda registrada
              setDebts([]);
              setInfo('No se ha registrado deuda aún para este periodo');
              setError('');
              return;
            }
          }
        } catch (directError) {
          console.error('Error obteniendo detalle del error:', directError);
        }
      }
      
      // Si no es el caso especial de deuda no encontrada, mostrar el error
      setError(error.message);
      setDebts([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al cambiar el período
  useEffect(() => {
    setPeriod(getCurrentPeriod());
  }, []);

  useEffect(() => {
    if (period) {
      // Limpiar todos los estados primero para evitar mostrar datos antiguos
      setUsers([]);
      setDebts([]);
      setEditedDebts({});
      setInfo('');
      setSuccess('');
      setError('');
      setSelectedUsers([]);
      
      // Luego cargar los nuevos datos
      loadUsers();
      loadDebts();
    }
  }, [period]);

  // Preparar deudas para guardar
  const handleSaveDebts = () => {
    // Crear array de deudores desde los usuarios con su deuda actual
    const debtors = users.map(user => {
      // Buscar si el usuario tiene deuda editada
      const editedAmount = editedDebts[user._id];
      
      // Buscar si el usuario tiene deuda registrada
      const existingDebt = debts.flatMap(debt => debt.debtors || []).find(
        debtor => debtor.user_id === user._id
      );
      
      return {
        user_id: user._id,
        user_name: user.name,
        user_nickname: user.nickname || null,
        amount: editedAmount !== undefined ? editedAmount : (existingDebt?.amount || 0)
      };
    });
    
    setDebtsToSave(debtors);
    setSaveDialogOpen(true);
  };

  // Guardar deudas
  const confirmSaveDebts = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await authenticatedApiCall('/admin/debts', {
        method: 'POST',
        body: JSON.stringify({
          period,
          debtors: debtsToSave
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error guardando deudas');
      }

      const data = await response.json();
      console.log('Deudas guardadas:', data);
      
      setSuccess('Deudas guardadas exitosamente');
      setSaveDialogOpen(false);
      
      // Limpiar ediciones locales
      setEditedDebts({});
      
      // Recargar deudas
      loadDebts();
      
    } catch (error) {
      console.error('Error guardando deudas:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar deuda en el estado local
  const updateDebtAmount = (userId, amount) => {
    setEditedDebts(prev => ({
      ...prev,
      [userId]: parseFloat(amount) || 0
    }));
  };

  // Limpiar deuda (poner en 0)
  const clearDebt = (userId) => {
    setEditedDebts(prev => ({
      ...prev,
      [userId]: 0
    }));
  };

  // Toggle selección de usuario
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Seleccionar todos los usuarios
  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  // Asignar deuda masiva
  const handleBulkAssignDebt = () => {
    const amount = parseFloat(bulkDebtAmount) || 0;
    
    // Asignar la deuda a todos los usuarios seleccionados
    const newEditedDebts = { ...editedDebts };
    selectedUsers.forEach(userId => {
      newEditedDebts[userId] = amount;
    });
    
    setEditedDebts(newEditedDebts);
    setBulkDebtAmount('');
    // Limpiar selección después de asignar
    setSelectedUsers([]);
  };

  // Obtener deuda para un usuario
  const getDebtForUser = (userId) => {
    // Buscar si el usuario tiene deuda editada
    if (editedDebts[userId] !== undefined) {
      return editedDebts[userId];
    }
    
    // Si no, buscar en las deudas cargadas
    const existingDebt = debts.flatMap(debt => debt.debtors || []).find(
      debtor => debtor.user_id === userId
    );
    
    return existingDebt ? parseFloat(existingDebt.amount) : 0;
  };

  // Calcular total de deudas
  const calculateTotalDebt = () => {
    return users.reduce((total, user) => {
      return total + getDebtForUser(user._id);
    }, 0);
  };

  const totalDebt = calculateTotalDebt();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Deudas
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            loadUsers();
            loadDebts();
          }}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {/* Selector de período y asignación masiva */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              label="Período"
            >
              {generatePeriods().map((periodOption) => (
                <MenuItem key={periodOption.value} value={periodOption.value}>
                  {periodOption.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Asignación masiva de deuda */}
          {selectedUsers.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Agregar la siguiente deuda a los {selectedUsers.length} usuarios seleccionados:
              </Typography>
              <TextField
                type="number"
                size="small"
                value={bulkDebtAmount}
                onChange={(e) => setBulkDebtAmount(e.target.value)}
                placeholder="Monto"
                sx={{ width: 120 }}
                inputProps={{
                  min: 0,
                  step: 100
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleBulkAssignDebt}
              >
                Asignar Deuda
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Alertas */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {info && (
        <Alert severity="info" onClose={() => setInfo('')} sx={{ mb: 2 }}>
          {info}
        </Alert>
      )}

      {/* Totalizador de Deuda Total */}
      {!loading && users.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                Total a recaudar
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {formatPeriod(period)}
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
              {formatCurrency(totalDebt)}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Tabla de usuarios y deudas */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                    checked={users.length > 0 && selectedUsers.length === users.length}
                    onChange={selectAllUsers}
                  />
                </TableCell>
                <TableCell>Nombre Usuario</TableCell>
                <TableCell>Nickname</TableCell>
                <TableCell align="right">Deuda</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading || !period ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary">
                      No se encontraron usuarios con rol player
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const debtAmount = getDebtForUser(user._id);
                  
                  return (
                    <TableRow key={user._id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => toggleUserSelection(user._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.name || 'Sin nombre'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.nickname || 'Sin nickname'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title="Limpiar">
                            <IconButton
                              size="small"
                              onClick={() => clearDebt(user._id)}
                              sx={{ 
                                color: 'error.main',
                                '&:hover': { 
                                  backgroundColor: 'error.light',
                                  color: 'error.dark'
                                }
                              }}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <TextField
                            type="number"
                            value={debtAmount}
                            onChange={(e) => updateDebtAmount(user._id, e.target.value)}
                            inputProps={{ 
                              style: { textAlign: 'right' },
                              min: 0,
                              step: 100
                            }}
                            size="small"
                            sx={{ width: 120 }}
                            placeholder="0"
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Botón para guardar deudas */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveDebts}
          disabled={loading || !period || users.length === 0}
        >
          Guardar Deudas
        </Button>
      </Box>

      {/* Dialog para confirmar guardado */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Confirmar Guardado de Deudas</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" paragraph>
              Período: <strong>{formatPeriod(period)}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Se guardarán las siguientes deudas:
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Nickname</TableCell>
                    <TableCell align="right">Deuda</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {debtsToSave.map((debtor) => (
                    <TableRow key={debtor.user_id}>
                      <TableCell>{debtor.user_name}</TableCell>
                      <TableCell>{debtor.user_nickname || '-'}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(debtor.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total deudores: <strong>{debtsToSave.length}</strong>
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(debtsToSave.reduce((sum, d) => sum + d.amount, 0))}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={confirmSaveDebts}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Guardando...' : 'Confirmar Guardado'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Deuda;

