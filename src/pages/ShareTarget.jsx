import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const DB_NAME = 'synco-shared-files';
const DB_VERSION = 1;
const STORE_NAME = 'files';

// Función para abrir IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Función para obtener archivo de IndexedDB
const getFileFromIndexedDB = async (fileId) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fileId);
      
      request.onsuccess = () => {
        if (request.result) {
          const fileData = request.result;
          // Convertir ArrayBuffer a Blob y luego a File
          const blob = new Blob([fileData.data], { type: fileData.type });
          const file = new File([blob], fileData.name, {
            type: fileData.type,
            lastModified: fileData.lastModified || Date.now()
          });
          resolve(file);
        } else {
          reject(new Error('Archivo no encontrado en IndexedDB'));
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error obteniendo archivo de IndexedDB:', error);
    throw error;
  }
};

// Función para eliminar archivo de IndexedDB
const deleteFileFromIndexedDB = async (fileId) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(fileId);
      
      request.onsuccess = () => {
        console.log('Archivo eliminado de IndexedDB:', fileId);
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error eliminando archivo de IndexedDB:', error);
  }
};

const ShareTarget = () => {
  const { authenticatedApiCall: apiCall, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
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
  const [showNotes, setShowNotes] = useState(false);
  const [fileId, setFileId] = useState(null);
  const [initializing, setInitializing] = useState(true);

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

  // Cargar archivo compartido desde IndexedDB o parámetros de URL
  useEffect(() => {
    const loadSharedFile = async () => {
      try {
        setInitializing(true);
        
        // Esperar a que la autenticación termine de cargar
        if (authLoading) {
          return;
        }

        // Obtener fileId de los parámetros de URL
        const urlFileId = searchParams.get('fileId');
        const fileName = searchParams.get('fileName');
        const fileType = searchParams.get('fileType');
        const fileSize = searchParams.get('fileSize');
        
        if (urlFileId) {
          setFileId(urlFileId);
          try {
            // Intentar obtener el archivo de IndexedDB
            const file = await getFileFromIndexedDB(urlFileId);
            setSelectedFile(file);
            console.log('Archivo cargado desde IndexedDB:', file.name);
          } catch (error) {
            console.error('Error cargando archivo de IndexedDB:', error);
            // Si no se puede cargar, crear un archivo mock con los metadatos de la URL
            if (fileName && fileType) {
              setError('No se pudo cargar el archivo completo. Por favor, intenta compartir el archivo nuevamente.');
            }
          }
        } else if (fileName && fileType) {
          // Si hay metadata pero no fileId, puede ser que el archivo se perdió
          setError('El archivo compartido no se pudo cargar. Por favor, intenta compartir el archivo nuevamente.');
        }

        // También escuchar mensajes del service worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        }

        setInitializing(false);
      } catch (error) {
        console.error('Error inicializando ShareTarget:', error);
        setInitializing(false);
      }
    };

    loadSharedFile();

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [authLoading, searchParams]);

  // Manejar mensajes del service worker
  const handleServiceWorkerMessage = async (event) => {
    const { type, data } = event.data;
    
    if (type === 'SHARE_DATA_RECEIVED') {
      console.log('Datos compartidos recibidos:', data);
      
      if (data.fileId) {
        setFileId(data.fileId);
        try {
          const file = await getFileFromIndexedDB(data.fileId);
          setSelectedFile(file);
          console.log('Archivo cargado desde mensaje del service worker:', file.name);
        } catch (error) {
          console.error('Error cargando archivo desde mensaje:', error);
        }
      }
    }
  };

  // Guardar fileId en sessionStorage si no está autenticado (para restaurarlo después del login)
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated && fileId) {
      // Guardar el fileId en sessionStorage antes de que RoleProtectedRoute redirija
      sessionStorage.setItem('pending_share_fileId', fileId);
      // También guardar los parámetros de la URL
      const currentParams = new URLSearchParams(searchParams);
      sessionStorage.setItem('pending_share_params', currentParams.toString());
    }
  }, [isAuthenticated, authLoading, fileId, searchParams]);

  // Restaurar archivo compartido después del login
  useEffect(() => {
    const restoreSharedFile = async () => {
      if (!isAuthenticated || authLoading) {
        return;
      }

      const pendingFileId = sessionStorage.getItem('pending_share_fileId');
      if (pendingFileId && !selectedFile) {
        try {
          const file = await getFileFromIndexedDB(pendingFileId);
          setSelectedFile(file);
          setFileId(pendingFileId);
          
          // Restaurar parámetros de URL si no están presentes
          const currentFileId = searchParams.get('fileId');
          if (!currentFileId && pendingFileId) {
            const pendingParams = sessionStorage.getItem('pending_share_params');
            if (pendingParams) {
              // Actualizar URL con los parámetros guardados usando setSearchParams
              const params = new URLSearchParams(pendingParams);
              setSearchParams(params, { replace: true });
            } else {
              // Si no hay parámetros guardados, agregar al menos el fileId
              const newParams = new URLSearchParams(searchParams);
              newParams.set('fileId', pendingFileId);
              setSearchParams(newParams, { replace: true });
            }
          }
          
          // Limpiar sessionStorage
          sessionStorage.removeItem('pending_share_fileId');
          sessionStorage.removeItem('pending_share_params');
          
          console.log('Archivo compartido restaurado después del login:', file.name);
        } catch (error) {
          console.error('Error restaurando archivo compartido:', error);
          setError('No se pudo restaurar el archivo compartido. Por favor, intenta compartir el archivo nuevamente.');
          // Limpiar sessionStorage incluso si hay error
          sessionStorage.removeItem('pending_share_fileId');
          sessionStorage.removeItem('pending_share_params');
        }
      }
    };

    restoreSharedFile();
  }, [isAuthenticated, authLoading, selectedFile, searchParams]);

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

        // Eliminar archivo de IndexedDB después de subirlo exitosamente
        if (fileId) {
          await deleteFileFromIndexedDB(fileId);
        }
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
      setFileId(null);

      // Redirigir después de un breve delay
      setTimeout(() => {
        navigate('/mis-pagos');
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setUploadStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras se inicializa
  if (initializing) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 2 }}>
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Cargando archivo compartido...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Registrar Pago desde Compartido
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Completa el monto y el período para registrar el pago con el comprobante compartido.
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mt: 2, maxWidth: 600, mx: 'auto' }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Información del archivo compartido */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Comprobante de Pago
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Archivo compartido desde otra aplicación
                </Typography>
                
                {/* Archivo seleccionado */}
                {selectedFile && (
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      icon={<AttachFileIcon />}
                      label={`${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`}
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
                disabled={loading || !selectedFile}
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
          • El comprobante se obtuvo del archivo compartido desde otra aplicación
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

export default ShareTarget;
