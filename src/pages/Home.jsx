import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import pasesImage from '../assets/pases.png';

const Home = () => {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom color="primary">
        ¡Hola Mundo!
      </Typography>
      <Typography variant="h5" component="p" color="text.secondary">
        Bienvenido a la aplicación SYNCO de Pases Falsos
      </Typography>
      
      <Paper elevation={2} sx={{ mt: 4, p: 3, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="body1" paragraph>
          Esta es una página experimental para probar tecnologías que pudiesen ayudar al equipo de voleyball pases falsos.
        </Typography>
      </Paper>
      
      {/* Imagen del equipo */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Box
          component="img"
          src={pasesImage}
          alt="Equipo Pases Falsos"
          sx={{
            maxWidth: '100%',
            height: 'auto',
            maxHeight: '500px',
            borderRadius: 2,
            boxShadow: 3,
            border: '3px solid',
            borderColor: 'primary.main'
          }}
        />
      </Box>
    </Box>
  );
};

export default Home;
