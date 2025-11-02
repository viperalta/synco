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
  Chip,
  Button,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Pagination,
  Checkbox,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  RemoveRedEye as EyeIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  PermIdentity as PermIdentityIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarMonth as CalendarMonthIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  VerifiedUser as VerifiedUserIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedApiCall } from '../config/api';

const Pagos = () => {
  const { authenticatedApiCall: apiCall } = useAuth();
  
  // Función para obtener el período actual
  const getCurrentPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
  };
  
  const [payments, setPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyStatus, setVerifyStatus] = useState('verified');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState(getCurrentPeriod());
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const [totalDebt, setTotalDebt] = useState(0);
  const [loadingDebt, setLoadingDebt] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkVerifyDialogOpen, setBulkVerifyDialogOpen] = useState(false);
  const [bulkVerifyStatus, setBulkVerifyStatus] = useState('verified');

  const itemsPerPage = 10;

  // Generar períodos para filtro
  const generatePeriods = () => {
    const periods = [];
    const currentDate = new Date();
    
    for (let i = -6; i < 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const period = `${year}${month}`;
      
      // Formato: "Abril 2025" (sin "de")
      const label = date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      }).replace(/^\w/, (c) => c.toUpperCase()).replace(' de ', ' ');
      
      periods.push({ value: period, label });
    }
    
    return periods;
  };

  const loadPayments = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Solo filtrar por período en la API
      let endpoint = `/admin/payments`;
      const params = [];
      
      if (filterPeriod !== 'all') {
        params.push(`period=${filterPeriod}`);
      }
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }

      console.log('Cargando pagos:', endpoint);
      const response = await apiCall(endpoint);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error cargando pagos');
      }

      const data = await response.json();
      console.log('Pagos cargados:', data);
      
      // Guardar todos los pagos
      const allLoadedPayments = data.payments || [];
      setAllPayments(allLoadedPayments);
      setTotalPayments(data.total || 0);

    } catch (error) {
      console.error('Error cargando pagos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    setLoadingStatistics(true);
    
    try {
      let endpoint = '/admin/payments/statistics';
      
      // Solo filtrar por período
      if (filterPeriod !== 'all') {
        endpoint += `?period=${filterPeriod}`;
      }

      const response = await apiCall(endpoint);
      if (response.ok) {
        const stats = await response.json();
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoadingStatistics(false);
    }
  };

  const loadTotalDebt = async () => {
    // Solo cargar si hay un período seleccionado (no 'all')
    if (filterPeriod === 'all') {
      setTotalDebt(0);
      return;
    }

    setLoadingDebt(true);
    
    try {
      const response = await apiCall(`/admin/debts/${filterPeriod}`);
      
      if (response.ok) {
        const data = await response.json();
        setTotalDebt(data.total_debt || 0);
      } else if (response.status === 404) {
        // No hay deuda registrada para este período
        setTotalDebt(0);
      }
    } catch (error) {
      console.error('Error cargando deuda total:', error);
      // Manejar error 404 como deuda 0
      if (error.message && error.message.includes('404')) {
        setTotalDebt(0);
      } else {
        setTotalDebt(0);
      }
    } finally {
      setLoadingDebt(false);
    }
  };

  const loadMonthlySummary = async () => {
    // Solo cargar si hay un período seleccionado (no 'all')
    if (filterPeriod === 'all') {
      setMonthlySummary([]);
      return;
    }

    setLoadingSummary(true);
    
    try {
      const response = await apiCall(`/admin/debts/${filterPeriod}`);
      
      if (response.ok) {
        const debtData = await response.json();
        const debtors = debtData.debtors || [];
        
        // Crear mapa de pagos por usuario (solo verified y pending)
        const paymentsByUser = {};
        allPayments.forEach(payment => {
          if (payment.status === 'verified' || payment.status === 'pending') {
            if (!paymentsByUser[payment.user_id]) {
              paymentsByUser[payment.user_id] = 0;
            }
            paymentsByUser[payment.user_id] += payment.amount;
          }
        });
        
        // Crear resumen con deuda y pagos
        const summary = debtors.map(debtor => {
          const totalPaid = paymentsByUser[debtor.user_id] || 0;
          const isPaid = totalPaid >= debtor.amount;
          
          return {
            user_id: debtor.user_id,
            user_name: debtor.user_name,
            user_nickname: debtor.user_nickname,
            debt: debtor.amount,
            total_paid: totalPaid,
            status: isPaid ? 'paid' : 'unpaid'
          };
        });
        
        setMonthlySummary(summary);
      } else if (response.status === 404) {
        // No hay deuda registrada para este período
        setMonthlySummary([]);
      }
    } catch (error) {
      console.error('Error cargando resumen mensual:', error);
      setMonthlySummary([]);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadPayments();
    loadStatistics();
    loadTotalDebt();
    setPage(1); // Reset page when period changes
  }, [filterPeriod]);

  // Cargar resumen mensual cuando cambian los pagos o el período
  useEffect(() => {
    loadMonthlySummary();
  }, [allPayments, filterPeriod]);

  // Filtrar client-side por estado y búsqueda
  useEffect(() => {
    let filtered = [...allPayments];

    // Filtrar por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(payment => payment.status === filterStatus);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => {
        const userName = (payment.user_nickname || payment.user_name || '').toLowerCase();
        const notes = (payment.notes || '').toLowerCase();
        return userName.includes(searchLower) || notes.includes(searchLower);
      });
    }

    setFilteredPayments(filtered);
    
    // Paginar
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPayments(filtered.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  }, [allPayments, filterStatus, searchTerm, page, itemsPerPage]);

  // Limpiar selección cuando cambian los filtros
  useEffect(() => {
    setSelectedPayments([]);
  }, [filterStatus, filterPeriod, searchTerm]);

  const handleVerifyPayment = async () => {
    if (!selectedPayment) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await apiCall(`/admin/payments/${selectedPayment.id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({
          status: verifyStatus,
          notes: verifyNotes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error verificando pago');
      }

      const updatedPayment = await response.json();
      console.log('Pago verificado:', updatedPayment);
      
      setSuccess(`Pago ${verifyStatus === 'verified' ? 'verificado' : 'rechazado'} exitosamente`);
      setVerifyDialogOpen(false);
      setVerifyNotes('');
      
      // Recargar pagos
      loadPayments();
      loadStatistics();
      loadTotalDebt();

    } catch (error) {
      console.error('Error verificando pago:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async (payment) => {
    setReceiptLoading(true);
    setError('');
    
    try {
      const response = await apiCall(`/admin/payments/${payment.id}/download-url?expires_in=3600`);
      
      if (!response.ok) {
        throw new Error('Error obteniendo URL del comprobante');
      }

      const { download_url } = await response.json();
      setReceiptUrl(download_url);
      setReceiptDialogOpen(true);
      
    } catch (error) {
      console.error('Error obteniendo comprobante:', error);
      setError('Error obteniendo comprobante');
    } finally {
      setReceiptLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPeriod = (period) => {
    // Convierte "202510" a "Octubre 2025"
    if (!period || period.length !== 6) return period;
    
    const year = period.substring(0, 4);
    const month = period.substring(4, 6);
    
    // Crear fecha del primer día del mes para obtener el nombre del mes
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    // Obtener nombre del mes y eliminar "de" si existe
    const monthName = date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long' 
    }).replace(/^\w/, (c) => c.toUpperCase()).replace(' de ', ' ');
    
    return monthName;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'verified': return 'Verificado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRefresh = () => {
    loadPayments();
    loadStatistics();
    loadTotalDebt();
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await apiCall(`/admin/payments/${paymentToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error eliminando pago');
      }

      setSuccess('Pago eliminado exitosamente');
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
      
      // Recargar pagos
      loadPayments();
      loadStatistics();
      loadTotalDebt();

    } catch (error) {
      console.error('Error eliminando pago:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (payment) => {
    setPaymentToDelete(payment);
    setDeleteDialogOpen(true);
  };

  const handleTogglePaymentSelection = (paymentId) => {
    setSelectedPayments(prev => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId);
      } else {
        return [...prev, paymentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedPayments.length === payments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(payments.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiCall('/admin/payments/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({
          payment_ids: selectedPayments
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error eliminando pagos');
      }

      const data = await response.json();
      console.log('Respuesta de eliminación masiva:', data);
      
      setSuccess(`${data.deleted} pago(s) eliminado(s) exitosamente. ${data.not_found > 0 ? `${data.not_found} no encontrado(s).` : ''}`);
      setBulkDeleteDialogOpen(false);
      setSelectedPayments([]);
      
      // Recargar pagos
      loadPayments();
      loadStatistics();
      loadTotalDebt();

    } catch (error) {
      console.error('Error eliminando pagos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkVerify = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiCall('/admin/payments/bulk-verify', {
        method: 'POST',
        body: JSON.stringify({
          payment_ids: selectedPayments,
          status: bulkVerifyStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error verificando pagos');
      }

      const data = await response.json();
      console.log('Respuesta de verificación masiva:', data);
      
      setSuccess(`${data.verified} pago(s) ${bulkVerifyStatus === 'verified' ? 'verificado(s)' : 'rechazado(s)'} exitosamente. ${data.not_found > 0 ? `${data.not_found} no encontrado(s).` : ''}`);
      setBulkVerifyDialogOpen(false);
      setSelectedPayments([]);
      
      // Recargar pagos
      loadPayments();
      loadStatistics();
      loadTotalDebt();

    } catch (error) {
      console.error('Error verificando pagos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Pagos
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {/* Estadísticas y Deuda Total */}
      {(statistics || loadingStatistics) && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Deuda Total - solo si hay un período seleccionado */}
          {filterPeriod !== 'all' && (
            <Grid item xs={12} sm={6} sx={{ flex: '1 1 0', minWidth: 0 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Deuda Total
                  </Typography>
                  {loadingDebt ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Typography variant="h4" color="error.main">
                      {formatCurrency(totalDebt)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
          
          <Grid item xs={12} sm={6} md={filterPeriod !== 'all' ? undefined : 3} sx={{ 
            ...(filterPeriod !== 'all' ? { flex: '1 1 0', minWidth: 0 } : {})
          }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Monto Total
                </Typography>
                {loadingStatistics || loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Typography variant="h4">
                    {(() => {
                      // Calcular suma de pagos verificados y pendientes (excluye rechazados)
                      const validPayments = allPayments.filter(p => p.status !== 'rejected');
                      const totalAmount = validPayments.reduce((sum, p) => sum + p.amount, 0);
                      return formatCurrency(totalAmount);
                    })()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={filterPeriod !== 'all' ? undefined : 3} sx={{ 
            ...(filterPeriod !== 'all' ? { flex: '1 1 0', minWidth: 0 } : {})
          }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Pagos
                </Typography>
                {loadingStatistics || !statistics ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Typography variant="h4">
                    {statistics.total_payments}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={filterPeriod !== 'all' ? undefined : 3} sx={{ 
            ...(filterPeriod !== 'all' ? { flex: '1 1 0', minWidth: 0 } : {})
          }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Verificados
                </Typography>
                {loadingStatistics || !statistics ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Typography variant="h4" color="success.main">
                    {statistics.by_status?.verified?.count || 0}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={filterPeriod !== 'all' ? undefined : 3} sx={{ 
            ...(filterPeriod !== 'all' ? { flex: '1 1 0', minWidth: 0 } : {})
          }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pendientes
                </Typography>
                {loadingStatistics || !statistics ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Typography variant="h4" color="warning.main">
                    {statistics.by_status?.pending?.count || 0}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              label="Período"
            >
              <MenuItem value="all">Todos</MenuItem>
              {generatePeriods().map((period) => (
                <MenuItem key={period.value} value={period.value}>
                  {period.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Estado"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="verified">Verificado</MenuItem>
              <MenuItem value="rejected">Rechazado</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
            placeholder="Buscar por usuario o notas..."
          />

          <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => setBulkVerifyDialogOpen(true)}
              disabled={selectedPayments.length === 0}
            >
              Verificar Pagos ({selectedPayments.length})
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setBulkDeleteDialogOpen(true)}
              disabled={selectedPayments.length === 0}
            >
              Eliminar Pagos ({selectedPayments.length})
            </Button>
          </Box>
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

      {/* Tabla de pagos */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedPayments.length > 0 && selectedPayments.length < payments.length}
                    checked={payments.length > 0 && selectedPayments.length === payments.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Período</TableCell>
                <TableCell>Fecha Pago</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Comprobante</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">
                      No se encontraron pagos
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedPayments.includes(payment.id)}
                        onChange={() => handleTogglePaymentSelection(payment.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {payment.user_nickname || payment.user_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(payment.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatPeriod(payment.period)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(payment.payment_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(payment.status)}
                        color={getStatusColor(payment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {payment.receipt_image_url ? (
                        <Tooltip title="Ver comprobante">
                          <IconButton
                            size="small"
                            onClick={() => handleViewReceipt(payment)}
                            disabled={receiptLoading}
                          >
                            {receiptLoading ? <CircularProgress size={20} /> : <EyeIcon />}
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Sin comprobante
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setViewDialogOpen(true);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {payment.status === 'pending' && (
                          <Tooltip title="Verificar pago">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setVerifyDialogOpen(true);
                              }}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Eliminar pago">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDeleteDialog(payment)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Resumen Mensual */}
      {filterPeriod !== 'all' && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" fontWeight="medium" sx={{ mb: 3 }}>
            Resumen Mensual
          </Typography>
          
          <Paper elevation={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre Usuario</TableCell>
                    <TableCell>Nickname</TableCell>
                    <TableCell align="right">Deuda</TableCell>
                    <TableCell align="right">Total Pagado</TableCell>
                    <TableCell align="center">Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingSummary ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : monthlySummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">
                          No hay deuda registrada para este período
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    monthlySummary.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <Typography variant="body2">
                            {user.user_name || 'Sin nombre'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.user_nickname || 'Sin nickname'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(user.debt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(user.total_paid)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={user.status === 'paid' ? 'Al día' : 'Deuda impaga'}
                            color={user.status === 'paid' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* Dialog para ver detalles del pago */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalles del Pago</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Usuario */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Usuario
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.user_nickname || selectedPayment.user_name || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              {/* ID Usuario */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PermIdentityIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    ID Usuario
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {selectedPayment.user_id || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              {/* Monto */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AttachMoneyIcon color="success" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Monto
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="success.main">
                    {formatCurrency(selectedPayment.amount)}
                  </Typography>
                </Box>
              </Box>

              {/* Período */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarMonthIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Período
                  </Typography>
                  <Typography variant="body1">
                    {formatPeriod(selectedPayment.period)}
                  </Typography>
                </Box>
              </Box>

              {/* Fecha de Pago */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EventIcon color="primary" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Pago
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedPayment.payment_date)}
                  </Typography>
                </Box>
              </Box>

              {/* Estado */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon color={getStatusColor(selectedPayment.status)} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedPayment.status)}
                    color={getStatusColor(selectedPayment.status)}
                    size="small"
                  />
                </Box>
              </Box>

              {/* Notas */}
              {selectedPayment.notes && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <DescriptionIcon color="primary" sx={{ mt: 0.5 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notas
                    </Typography>
                    <Typography variant="body1">
                      {selectedPayment.notes}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Verificado por */}
              {selectedPayment.verified_by && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <VerifiedUserIcon color="success" />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Verificado por
                    </Typography>
                    <Typography variant="body1">
                      {selectedPayment.verified_by}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Fecha de verificación */}
              {selectedPayment.verified_at && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EventIcon color="success" />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Fecha de verificación
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedPayment.verified_at)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Comprobante */}
              {selectedPayment.receipt_image_url && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ReceiptIcon color="primary" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Comprobante
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<EyeIcon />}
                      onClick={() => handleViewReceipt(selectedPayment)}
                      disabled={receiptLoading}
                    >
                      {receiptLoading ? 'Cargando...' : 'Ver Comprobante'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para verificar pago */}
      <Dialog open={verifyDialogOpen} onClose={() => setVerifyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Verificar Pago</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" paragraph>
                ¿Deseas verificar o rechazar este pago?
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Usuario:</strong> {selectedPayment.user_nickname || selectedPayment.user_name || 'N/A'}<br/>
                <strong>ID:</strong> {selectedPayment.user_id}<br/>
                <strong>Monto:</strong> {formatCurrency(selectedPayment.amount)}<br/>
                <strong>Período:</strong> {formatPeriod(selectedPayment.period)}
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="verified">Verificado</MenuItem>
                  <MenuItem value="rejected">Rechazado</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Notas de verificación"
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Comentarios sobre la verificación..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleVerifyPayment}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Verificando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para mostrar comprobante */}
      <Dialog 
        open={receiptDialogOpen} 
        onClose={() => setReceiptDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>Comprobante de Pago</DialogTitle>
        <DialogContent>
          {receiptUrl && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img
                src={receiptUrl}
                alt="Comprobante de pago"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
                onError={(e) => {
                  console.error('Error cargando imagen:', e);
                  setError('Error cargando el comprobante');
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptDialogOpen(false)}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={async () => {
              if (receiptUrl) {
                try {
                  // Obtener el archivo como blob
                  const response = await fetch(receiptUrl);
                  const blob = await response.blob();
                  
                  // Crear URL del blob
                  const blobUrl = window.URL.createObjectURL(blob);
                  
                  // Crear elemento de descarga
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = `comprobante-${selectedPayment?.id || 'pago'}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  
                  // Limpiar
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(blobUrl);
                } catch (error) {
                  console.error('Error descargando archivo:', error);
                  setError('Error descargando el comprobante');
                }
              }
            }}
          >
            Descargar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          {paymentToDelete && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" paragraph>
                ¿Estás seguro de que deseas eliminar este pago?
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Usuario:</strong> {paymentToDelete.user_nickname || paymentToDelete.user_name || 'N/A'}<br/>
                <strong>ID:</strong> {paymentToDelete.id}<br/>
                <strong>Monto:</strong> {formatCurrency(paymentToDelete.amount)}<br/>
                <strong>Período:</strong> {formatPeriod(paymentToDelete.period)}
              </Typography>

              <Alert severity="warning">
                Esta acción no se puede deshacer.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeletePayment}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para confirmar eliminación masiva */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar Eliminación Masiva</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" paragraph>
              ¿Estás seguro de que deseas eliminar {selectedPayments.length} pago(s)?
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              Esta acción no se puede deshacer.
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Se eliminarán los siguientes pagos:
            </Typography>
            
            <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
              {payments
                .filter(p => selectedPayments.includes(p.id))
                .map((payment) => (
                  <Box key={payment.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>ID:</strong> {payment.id}<br/>
                      <strong>Usuario:</strong> {payment.user_nickname || payment.user_name || 'N/A'}<br/>
                      <strong>Monto:</strong> {formatCurrency(payment.amount)}<br/>
                      <strong>Período:</strong> {formatPeriod(payment.period)}
                    </Typography>
                  </Box>
                ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleBulkDelete}
            variant="contained"
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Eliminando...' : `Eliminar ${selectedPayments.length} pago(s)`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para verificación masiva */}
      <Dialog open={bulkVerifyDialogOpen} onClose={() => setBulkVerifyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Verificar Pagos Masivamente</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" paragraph>
              ¿Estás seguro de que deseas verificar {selectedPayments.length} pago(s)?
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={bulkVerifyStatus}
                onChange={(e) => setBulkVerifyStatus(e.target.value)}
                label="Estado"
              >
                <MenuItem value="verified">Verificado</MenuItem>
                <MenuItem value="rejected">Rechazado</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="warning" sx={{ mb: 2 }}>
              Esta acción no se puede deshacer.
            </Alert>
            
            <Typography variant="body2" color="text.secondary">
              Se verificarán los siguientes pagos:
            </Typography>
            
            <Box sx={{ mt: 2, maxHeight: 250, overflow: 'auto', border: '1px solid', borderColor: 'grey.300', borderRadius: 1, p: 1 }}>
              {payments
                .filter(p => selectedPayments.includes(p.id))
                .map((payment) => (
                  <Box key={payment.id} sx={{ mb: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>ID:</strong> {payment.id}<br/>
                      <strong>Usuario:</strong> {payment.user_nickname || payment.user_name || 'N/A'}<br/>
                      <strong>Monto:</strong> {formatCurrency(payment.amount)}<br/>
                      <strong>Período:</strong> {formatPeriod(payment.period)}
                    </Typography>
                  </Box>
                ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkVerifyDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleBulkVerify}
            variant="contained"
            color="success"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {loading ? 'Verificando...' : `${bulkVerifyStatus === 'verified' ? 'Verificar' : 'Rechazar'} ${selectedPayments.length} pago(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Pagos;
