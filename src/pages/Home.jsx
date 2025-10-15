import React from 'react';
import { Typography, Box, Paper } from '@mui/material';

const Home = () => {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom color="primary">
        ¡Hola Mundo!
      </Typography>
      <Typography variant="h5" component="p" color="text.secondary">
        Bienvenido a la aplicación SYNCO
      </Typography>
      <Paper elevation={2} sx={{ mt: 4, p: 3, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="body1" paragraph>
          Esta es la página de inicio de tu aplicación React con Material-UI.
        </Typography>
        <Typography variant="body1">
          Navega por el menú lateral para explorar las diferentes secciones.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Home;
