import React from 'react';
import {
  Typography,
  Box,
  Paper,
} from '@mui/material';

const Contact = () => {
  return (
    <Box sx={{ 
      p: 3, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '60vh'
    }}>
      <Typography variant="h4" component="h1" gutterBottom color="primary" align="center">
        Contacto
      </Typography>
      
      <Typography variant="h6" component="p" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Síguenos en Instagram
      </Typography>

      <Paper elevation={3} sx={{ p: 3, textAlign: 'center', maxWidth: '500px', width: '100%' }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Últimas publicaciones
        </Typography>
        
        <Box
          sx={{
            width: '100%',
            height: '400px',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <iframe
            src="https://www.instagram.com/pasesfalsos.volley/embed/"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            allowTransparency="true"
            title="Instagram Feed - Pases Falsos"
            style={{
              border: 'none',
              borderRadius: '8px'
            }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Síguenos en <a href="https://www.instagram.com/pasesfalsos.volley/" target="_blank" rel="noopener noreferrer">@pasesfalsos.volley</a>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Contact;
