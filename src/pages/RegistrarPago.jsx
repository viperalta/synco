import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedApiCall } from '../config/api';

const RegistrarPago = () => {
  const { authenticatedApiCall: apiCall, user } = useAuth();
  
  // Función para obtener el período actual por defecto
  const getCurrentPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
  };
  
  const [formData, setFormData] = useState({
    amount: '',
    period: getCurrentPeriod(),
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentId, setPaymentId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [isDragOver, setIsDragOver] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  
  // Estados para pago por usuario (admin)
  const [paymentMode, setPaymentMode] = useState('personal'); // 'personal' o 'user'
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Verificar si el usuario es admin
  const isAdmin = user?.roles?.includes('admin');

  // Función para obtener usuarios (solo para admin)
  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    try {
      setLoadingUsers(true);
      const response = await apiCall('/admin/users', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      
      const data = await response.json();
      // Filtrar solo usuarios con rol "player"
      const players = (data.users || []).filter(user => 
        user.roles && user.roles.includes('player')
      );
      setUsers(players);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error al cargar la lista de usuarios');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Cargar usuarios cuando se cambia a modo "user"
  useEffect(() => {
    if (isAdmin && paymentMode === 'user') {
      // Solo cargar si no tenemos usuarios aún
      if (users.length === 0) {
        fetchUsers();
      }
    }
  }, [paymentMode, isAdmin, users.length]);

  // Limpiar usuario seleccionado cuando se cambia de modo
  useEffect(() => {
    if (paymentMode === 'personal') {
      setSelectedUserId('');
    }
  }, [paymentMode]);

  // Generar períodos para el mes anterior, actual y siguiente
  const generatePeriods = () => {
    const periods = [];
    const currentDate = new Date();
    
    // Generar solo 3 períodos: anterior, actual y siguiente
    for (let i = -1; i <= 1; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const period = `${year}${month}`;
      
      // Formato: "Octubre 2025"
      const label = date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      }).replace(/^\w/, (c) => c.toUpperCase());
      
      periods.push({ value: period, label });
    }
    
    // Reordenar para que el período actual esté en el medio
    // [anterior, actual, siguiente]
    return periods;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateFile = (file) => {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Solo se permiten: JPG, PNG, GIF y PDF');
      return false;
    }
    
    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 2MB');
      return false;
    }
    
    return true;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setError('');
      }
    }
  };

  const uploadFileToS3 = async (file, uploadUrl) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error('Error subiendo archivo'));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Error de red'));
      });
      
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setUploadStatus('idle');

    try {
      // Validar datos del formulario
      if (!formData.amount || !formData.period) {
        throw new Error('Por favor completa todos los campos obligatorios');
      }

      if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
        throw new Error('El monto debe ser un número válido mayor a 0');
      }

      // Crear el pago
      const paymentData = {
        amount: parseFloat(formData.amount),
        period: formData.period,
        notes: formData.notes || ''
      };

      // Si es admin y está en modo "user", agregar user_id
      if (isAdmin && paymentMode === 'user') {
        if (!selectedUserId) {
          throw new Error('Por favor selecciona un usuario');
        }
        paymentData.user_id = selectedUserId;
      }

      console.log('Creando pago:', paymentData);
      const createResponse = await apiCall('/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.detail || 'Error creando el pago');
      }

      const createdPayment = await createResponse.json();
      console.log('Pago creado:', createdPayment);
      setPaymentId(createdPayment.id);

      // Si hay archivo seleccionado, subirlo
      if (selectedFile) {
        setUploadStatus('uploading');
        
        // Obtener URL de subida
        const fileExtension = selectedFile.name.split('.').pop();
        const uploadUrlResponse = await apiCall(`/payments/${createdPayment.id}/upload-url?file_extension=${fileExtension}&expires_in=3600`, {
          method: 'POST'
        });

        if (!uploadUrlResponse.ok) {
          throw new Error('Error obteniendo URL de subida');
        }

        const { upload_url, file_key } = await uploadUrlResponse.json();
        console.log('URL de subida obtenida:', upload_url);

        // Subir archivo a S3
        await uploadFileToS3(selectedFile, upload_url);
        console.log('Archivo subido a S3');

        // Confirmar subida
        const confirmResponse = await apiCall(`/payments/${createdPayment.id}/confirm-upload`, {
          method: 'POST',
          body: JSON.stringify({ file_key })
        });

        if (!confirmResponse.ok) {
          throw new Error('Error confirmando subida del archivo');
        }

        const confirmedPayment = await confirmResponse.json();
        console.log('Subida confirmada:', confirmedPayment);
        setUploadStatus('success');
      }

      setSuccess('Pago registrado exitosamente');
      
      // Limpiar formulario
      setFormData({
        amount: '',
        period: getCurrentPeriod(),
        notes: ''
      });
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Si está en modo "user", mantener el usuario seleccionado para facilitar múltiples pagos
      // El admin puede cambiar el usuario si necesita registrar para otro

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setUploadStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Registrar Pago
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Registra un nuevo pago y adjunta el comprobante correspondiente.
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mt: 2, maxWidth: 600, mx: 'auto' }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Switch para admin: Pago Personal / Pagar por usuario */}
            {isAdmin && (
              <FormControlLabel
                control={
                  <Switch
                    checked={paymentMode === 'user'}
                    onChange={(e) => setPaymentMode(e.target.checked ? 'user' : 'personal')}
                    color="primary"
                  />
                }
                label={paymentMode === 'personal' ? 'Pago Personal' : 'Pagar por usuario'}
                sx={{ mb: 1 }}
              />
            )}

            {/* Selector de usuario (solo para admin en modo "user") */}
            {isAdmin && paymentMode === 'user' && (
              <Box>
                {loadingUsers ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 3,
                      gap: 2
                    }}
                  >
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="text.secondary">
                      Cargando usuarios...
                    </Typography>
                  </Box>
                ) : (
                  <FormControl fullWidth required>
                    <InputLabel>Registrar pago a nombre de</InputLabel>
                    <Select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      label="Registrar pago a nombre de"
                    >
                      {users.map((user) => (
                        <MenuItem key={user._id} value={user._id}>
                          {user.nickname || user.name || user.email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            )}

            {/* Subida de archivo */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Comprobante de Pago
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Adjunta el comprobante del pago (transferencia, boleta, etc.)
                </Typography>
                
                {/* Desktop: Zona de Drag and Drop */}
                <Box
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    border: '2px dashed',
                    borderColor: isDragOver ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: isDragOver ? 'primary.50' : 'transparent',
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'primary.50',
                    }
                  }}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <CloudUploadIcon 
                    sx={{ 
                      fontSize: 48, 
                      color: isDragOver ? 'primary.main' : 'grey.400',
                      mb: 2 
                    }} 
                  />
                  <Typography variant="h6" gutterBottom>
                    {isDragOver ? 'Suelta el archivo aquí' : 'Arrastra y suelta tu archivo aquí'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    o haz clic para seleccionar un archivo
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Formatos permitidos: JPG, PNG, GIF, PDF (máximo 2MB)
                  </Typography>
                  
                  <input
                    accept=".jpg,.jpeg,.png,.gif,.pdf"
                    style={{ display: 'none' }}
                    id="file-upload"
                    type="file"
                    onChange={handleFileSelect}
                  />
                </Box>

                {/* Mobile: Botón simple */}
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Subir Comprobante
                    <input
                      accept=".jpg,.jpeg,.png,.gif,.pdf"
                      style={{ display: 'none' }}
                      type="file"
                      onChange={handleFileSelect}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                    Formatos: JPG, PNG, GIF, PDF (máx. 2MB)
                  </Typography>
                </Box>
                
                {/* Archivo seleccionado */}
                {selectedFile && (
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      icon={<AttachFileIcon />}
                      label={`${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`}
                      onDelete={() => setSelectedFile(null)}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                )}

                {/* Progreso de subida */}
                {uploadStatus === 'uploading' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Subiendo archivo...
                    </Typography>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="caption" color="text.secondary">
                      {uploadProgress}%
                    </Typography>
                  </Box>
                )}

                {/* Estado de subida */}
                {uploadStatus === 'success' && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="body2" color="success.main">
                      Archivo subido exitosamente
                    </Typography>
                  </Box>
                )}

                {uploadStatus === 'error' && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorIcon color="error" />
                    <Typography variant="body2" color="error.main">
                      Error subiendo archivo
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Monto */}
            <TextField
              label="Monto"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              required
              fullWidth
              inputProps={{ min: 0, step: 1 }}
              helperText="Ingresa el monto del pago en pesos chilenos"
            />

            {/* Período */}
            <FormControl fullWidth required>
              <InputLabel>Período</InputLabel>
              <Select
                name="period"
                value={formData.period}
                onChange={handleInputChange}
                label="Período"
              >
                {generatePeriods().map((period) => (
                  <MenuItem key={period.value} value={period.value}>
                    {period.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Notas */}
            {!showNotes ? (
              <Button
                variant="text"
                onClick={() => setShowNotes(true)}
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                + Agregar nota
              </Button>
            ) : (
              <Box>
                <TextField
                  label="Notas (opcional)"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  helperText="Información adicional sobre el pago"
                />
                <Button
                  variant="text"
                  onClick={() => setShowNotes(false)}
                  sx={{ mt: 1, textTransform: 'none' }}
                  size="small"
                >
                  Ocultar nota
                </Button>
              </Box>
            )}

            {/* Alertas */}
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" onClose={() => setSuccess('')}>
                {success}
              </Alert>
            )}

            {/* Botón de envío */}
            <CardActions sx={{ justifyContent: 'flex-end', px: 0 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              >
                {loading ? 'Registrando...' : 'Registrar Pago'}
              </Button>
            </CardActions>
          </Box>
        </form>
      </Paper>

      {/* Información adicional */}
      <Paper elevation={1} sx={{ p: 2, mt: 3, bgcolor: 'grey.50', maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Información Importante
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          • El comprobante es opcional pero recomendado para facilitar la verificación
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          • Formatos de archivo permitidos: JPG, PNG, GIF, PDF
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          • Tamaño máximo de archivo: 2MB
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Una vez registrado, el pago será revisado por la Gerencia de Finanzas
        </Typography>
      </Paper>
    </Box>
  );
};

export default RegistrarPago;
