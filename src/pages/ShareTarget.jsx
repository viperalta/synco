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
    // Verificar si hay datos compartidos disponibles
    if (window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const title = urlParams.get('title');
      const text = urlParams.get('text');
      const url = urlParams.get('url');
      const error = urlParams.get('error');
      
      if (error) {
        setError('Error al procesar el archivo compartido');
      } else if (title || text || url) {
        setFileInfo({
          title: title || 'Archivo compartido',
          text: text || '',
          url: url || ''
        });
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
    // Solo generar preview mock si no hay datos reales
    if (!fileInfo || !fileInfo.type?.startsWith('image/')) {
      const mockImageUrl = 'https://via.placeholder.com/300x200/1976d2/ffffff?text=Imagen+Compartida';
      setImagePreview(mockImageUrl);
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

  const displayFileInfo = fileInfo || mockFileInfo;

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Paper elevation={3} sx={{ 
        p: 3, 
        maxWidth: 500, 
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1" color="primary" sx={{ fontWeight: 'bold' }}>
            Subir Archivo
          </Typography>
          <Tooltip title="Cerrar">
            <IconButton onClick={handleClose} color="inherit">
              <Close />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* File Information Card */}
        <Card sx={{ mb: 3, textAlign: 'left' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ mr: 2 }}>
                {getFileIcon(displayFileInfo.type)}
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {displayFileInfo.name || displayFileInfo.title || 'Archivo sin nombre'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Vista previa:
                </Typography>
                <CardMedia
                  component="img"
                  image={imagePreview}
                  alt="Vista previa del archivo"
                  sx={{
                    maxHeight: 300,
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
              sx={{ mb: 2, minWidth: 200 }}
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
              sx={{ minWidth: 200 }}
            >
              Cerrar
            </Button>
          </Box>
        )}

        {/* Instructions */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, fontStyle: 'italic' }}>
          Este archivo fue compartido desde otra aplicación hacia SYNCO.
          Puedes subirlo como comprobante para futuras funcionalidades.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ShareTarget;
