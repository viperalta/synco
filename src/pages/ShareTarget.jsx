import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  InsertDriveFile,
  Image,
  PictureAsPdf,
  Description,
  Upload,
  CheckCircle,
  Close
} from '@mui/icons-material';

const ShareTarget = () => {
  const [sharedFile, setSharedFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Verificar si hay datos compartidos disponibles en la URL
    if (window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const title = urlParams.get('title');
      const text = urlParams.get('text');
      const url = urlParams.get('url');
      const fileName = urlParams.get('fileName');
      const fileType = urlParams.get('fileType');
      const fileSize = urlParams.get('fileSize');
      const error = urlParams.get('error');
      
      console.log('Parámetros URL:', { title, text, url, fileName, fileType, fileSize, error });
      
      if (error) {
        setError('Error al procesar el archivo compartido');
      } else if (title || text || url || fileName) {
        const fileData = {
          title: title || 'Archivo compartido',
          text: text || '',
          url: url || ''
        };
        
        // Si hay datos de archivo en la URL, agregarlos
        if (fileName) {
          fileData.name = fileName;
          fileData.type = fileType;
          fileData.size = parseInt(fileSize) || 0;
          fileData.lastModified = Date.now();
        }
        
        setFileInfo(fileData);
        console.log('Datos de archivo establecidos desde URL:', fileData);
      }
    }

    // Escuchar mensajes del service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Generar preview de imagen si es una imagen
    generateImagePreview();

    // Cleanup
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // Efecto para regenerar preview cuando cambien los datos del archivo
  useEffect(() => {
    if (fileInfo && fileInfo.type?.startsWith('image/')) {
      // Si es una imagen pero no hay preview URL, mostrar mensaje de error
      if (!imagePreview) {
        setImageError(true);
      }
    }
  }, [fileInfo, imagePreview]);

  const handleServiceWorkerMessage = (event) => {
    const { type, data } = event.data;
    
    if (type === 'SHARE_DATA_RECEIVED') {
      console.log('Datos compartidos recibidos:', data);
      setFileInfo(data);
      
      // Si hay un archivo, procesarlo
      if (data.file) {
        handleRealFile(data.file);
      }
    }
    
    if (type === 'FILE_DATA_RECEIVED') {
      console.log('Datos de archivo recibidos:', data);
      setFileInfo(prev => ({
        ...prev,
        ...data
      }));
      
      // Si hay preview URL para imagen
      if (data.previewUrl) {
        setImagePreview(data.previewUrl);
      }
    }
  };

  const generateImagePreview = () => {
    // Solo generar preview mock si no hay datos reales de imagen
    if (!fileInfo || !fileInfo.type?.startsWith('image/')) {
      // Solo mostrar mock si estamos en modo demo
      if (window.location.search === '') {
        const mockImageUrl = 'https://via.placeholder.com/300x200/1976d2/ffffff?text=Imagen+Compartida';
        setImagePreview(mockImageUrl);
      }
    }
  };

  // Función para manejar archivos reales cuando estén disponibles
  const handleRealFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.onerror = () => {
        setImageError(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) {
      return <Image color="primary" sx={{ fontSize: 48 }} />;
    } else if (fileType === 'application/pdf') {
      return <PictureAsPdf color="error" sx={{ fontSize: 48 }} />;
    } else if (fileType?.startsWith('text/') || fileType?.includes('document')) {
      return <Description color="info" sx={{ fontSize: 48 }} />;
    } else {
      return <InsertDriveFile color="action" sx={{ fontSize: 48 }} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Tamaño desconocido';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileTypeLabel = (fileType) => {
    if (fileType?.startsWith('image/')) return 'Imagen';
    if (fileType === 'application/pdf') return 'PDF';
    if (fileType?.startsWith('text/')) return 'Texto';
    if (fileType?.includes('document')) return 'Documento';
    return 'Archivo';
  };

  const handleFileUpload = async () => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Simular subida de archivo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadSuccess(true);
      setIsUploading(false);
    } catch (err) {
      setError('Error al subir el archivo. Inténtalo de nuevo.');
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    window.close();
  };

  // Datos de archivo para demostración (solo si no hay datos reales)
  const mockFileInfo = {
    name: 'comprobante_pago.jpg',
    type: 'image/jpeg',
    size: 245760,
    lastModified: Date.now()
  };

  // Usar datos reales si están disponibles, sino usar mock solo para demo
  const displayFileInfo = fileInfo || (window.location.search === '' ? mockFileInfo : null);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      p: { xs: 1, sm: 2 },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Paper elevation={3} sx={{ 
        p: { xs: 2, sm: 3 }, 
        maxWidth: { xs: '100%', sm: 500 }, 
        width: '100%',
        textAlign: 'center',
        mx: { xs: 0, sm: 'auto' }
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: { xs: 2, sm: 3 }
        }}>
          <Typography 
            variant="h5" 
            component="h1" 
            color="primary" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            Subir Archivo
          </Typography>
          <Tooltip title="Cerrar">
            <IconButton onClick={handleClose} color="inherit" size="small">
              <Close />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ mb: { xs: 2, sm: 3 } }} />

        {/* File Information Card */}
        {displayFileInfo ? (
          <Card sx={{ mb: { xs: 2, sm: 3 }, textAlign: 'left' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <Box sx={{ 
                  mr: { xs: 0, sm: 2 }, 
                  mb: { xs: 1, sm: 0 },
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  {getFileIcon(displayFileInfo.type)}
                </Box>
                <Box sx={{ flexGrow: 1, width: '100%' }}>
                  <Typography 
                    variant="h6" 
                    component="h2" 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 1,
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                      wordBreak: 'break-word'
                    }}
                  >
                    {displayFileInfo.name || displayFileInfo.title || 'Archivo sin nombre'}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    flexWrap: 'wrap',
                    justifyContent: { xs: 'center', sm: 'flex-start' }
                  }}>
                    <Chip 
                      label={getFileTypeLabel(displayFileInfo.type)} 
                      color="primary" 
                      size="small" 
                    />
                    <Chip 
                      label={formatFileSize(displayFileInfo.size)} 
                      color="secondary" 
                      size="small" 
                    />
                  </Box>
                </Box>
              </Box>
            
            {/* Image Preview */}
            {displayFileInfo.type?.startsWith('image/') && imagePreview && !imageError && (
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 1, 
                    fontWeight: 'bold',
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  Vista previa:
                </Typography>
                <CardMedia
                  component="img"
                  image={imagePreview}
                  alt="Vista previa del archivo"
                  sx={{
                    maxHeight: { xs: 200, sm: 300 },
                    width: '100%',
                    objectFit: 'contain',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                  onError={() => setImageError(true)}
                />
              </Box>
            )}

            {/* Error fallback for image */}
            {displayFileInfo.type?.startsWith('image/') && imageError && (
              <Box sx={{ 
                mb: 2, 
                p: 2, 
                bgcolor: 'grey.100', 
                borderRadius: 1,
                textAlign: 'center'
              }}>
                <Image color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No se pudo cargar la vista previa de la imagen
                </Typography>
              </Box>
            )}
            
            {displayFileInfo.text && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {displayFileInfo.text}
              </Typography>
            )}
            
            {displayFileInfo.url && (
              <Typography variant="body2" color="text.secondary">
                <strong>URL:</strong> {displayFileInfo.url}
              </Typography>
            )}
          </CardContent>
        </Card>
        ) : (
          <Card sx={{ mb: 3, textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No se detectó ningún archivo compartido
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Intenta compartir un archivo desde otra aplicación
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        {!uploadSuccess ? (
          <Box>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Upload />}
              onClick={handleFileUpload}
              disabled={isUploading}
              sx={{ 
                mb: 2, 
                minWidth: { xs: '100%', sm: 200 },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {isUploading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Subiendo...
                </>
              ) : (
                'Subir Comprobante'
              )}
            </Button>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        ) : (
          <Box>
            <Alert 
              severity="success" 
              icon={<CheckCircle />}
              sx={{ mb: 2 }}
            >
              ¡Has subido exitosamente el archivo!
            </Alert>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleClose}
              sx={{ 
                minWidth: { xs: '100%', sm: 200 },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Cerrar
            </Button>
          </Box>
        )}

        {/* Instructions */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mt: { xs: 2, sm: 3 }, 
            fontStyle: 'italic',
            textAlign: { xs: 'center', sm: 'left' },
            px: { xs: 1, sm: 0 }
          }}
        >
          Este archivo fue compartido desde otra aplicación hacia SYNCO.
          Puedes subirlo como comprobante para futuras funcionalidades.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ShareTarget;
