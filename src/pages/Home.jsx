import React from 'react';
import { Typography, Box, Paper, Button, Stack } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import pasesImage from '../assets/pases.png';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();
  
  // Verificar si el usuario tiene rol player o admin
  const hasAccess = user?.roles?.includes('player') || user?.roles?.includes('admin');
  
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom color="primary">
        ¡Hola Pases!
      </Typography>
      <Typography variant="h5" component="p" color="text.secondary">
        Bienvenido al Portal de Pases Falsos
      </Typography>
      
      <Paper elevation={2} sx={{ mt: 4, p: 3, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="body1" paragraph>
          Esta es la página oficial del equipo de voleyball Pases Falsos.
        </Typography>
        
        {hasAccess && (
          <Stack 
            spacing={2} 
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ mt: 3 }}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<TableChartIcon />}
              href="https://docs.google.com/spreadsheets/d/189t1ipUnCSIwFobqpPDeH1EUUMR06ZYLTPNtxFVOTEc/edit?gid=515129#gid=515129"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                py: 1.5, 
                width: { xs: '100%', sm: 'auto' },
                flex: { sm: 1 } 
              }}
            >
              CUENTAS FALSAS
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DescriptionIcon />}
              href="https://docs.google.com/spreadsheets/d/14eC6E9VdRXkK7qVpkVkCcXMvvQakQ6tkNA4i7fTsivU/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                py: 1.5, 
                width: { xs: '100%', sm: 'auto' },
                flex: { sm: 1 } 
              }}
            >
              DETALLES COBROS
            </Button>
          </Stack>
        )}
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
