import React from 'react';
import { Typography, Box, Paper, Button, Stack, Card, CardMedia } from '@mui/material';
import { keyframes } from '@mui/system';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import pasesImage from '../assets/pases.png';
import conyImage from '../assets/cony mvp.png';
import jorgeImage from '../assets/jorge.png';
import { useAuth } from '../contexts/AuthContext';

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

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
      
      {/* Sección Premios Pases Falsos 2025 */}
      <Box sx={{ mt: 6, maxWidth: 800, mx: 'auto', px: 2 }}>
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom 
          color="primary"
          sx={{ mb: 3, fontWeight: 'bold' }}
        >
          Premios Pases Falsos 2025
        </Typography>
        
        <Typography 
          variant="body1" 
          paragraph 
          sx={{ mb: 4, textAlign: 'left', lineHeight: 1.8 }}
        >
          El día Sábado 15 de Noviembre se celebraron los Premios Pases Falsos. 
          En ellos se premiaron en diferentes categorías a los jugadores de Pases. 
          Se destaca a continuación a los 2 ganadores del Premio Espíritu Pases Falsos:{' '}
          <Typography component="span" fontWeight="bold">Constanza Munilla</Typography> y{' '}
          <Typography component="span" fontWeight="bold">Jorge Ortiz</Typography>.
        </Typography>
        
        {/* Cards estilo Instax Mini */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          sx={{ 
            justifyContent: 'center', 
            alignItems: { xs: 'center', sm: 'flex-start' } 
          }}
        >
          {/* Card Constanza */}
          <Card
            sx={{
              position: 'relative',
              width: { xs: 280, sm: 280 },
              maxWidth: 280,
              mx: 'auto',
              borderRadius: 2,
              boxShadow: 4,
              overflow: 'visible',
              background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
              border: '8px solid #fff',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 40,
                height: 8,
                backgroundColor: '#fff',
                borderRadius: '4px 4px 0 0',
                zIndex: 1,
              }
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                paddingTop: '75%', // Aspect ratio 4:3
                overflow: 'hidden',
                backgroundColor: '#f0f0f0',
              }}
            >
              <CardMedia
                component="img"
                image={conyImage}
                alt="Constanza Munilla"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {/* Icono de premio flotante */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 2,
                  animation: `${floatAnimation} 3s ease-in-out infinite`,
                }}
              >
                <EmojiEventsIcon
                  sx={{
                    fontSize: 40,
                    color: '#FFD700',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff', minHeight: 60 }}>
              <Typography variant="body2" fontWeight="bold" color="text.primary">
                Constanza Munilla
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Premio Espíritu Pases Falsos
              </Typography>
            </Box>
          </Card>
          
          {/* Card Jorge */}
          <Card
            sx={{
              position: 'relative',
              width: { xs: 280, sm: 280 },
              maxWidth: 280,
              mx: 'auto',
              borderRadius: 2,
              boxShadow: 4,
              overflow: 'visible',
              background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
              border: '8px solid #fff',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 40,
                height: 8,
                backgroundColor: '#fff',
                borderRadius: '4px 4px 0 0',
                zIndex: 1,
              }
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                paddingTop: '75%', // Aspect ratio 4:3
                overflow: 'hidden',
                backgroundColor: '#f0f0f0',
              }}
            >
              <CardMedia
                component="img"
                image={jorgeImage}
                alt="Jorge Ortiz"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {/* Icono de premio flotante */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 2,
                  animation: `${floatAnimation} 3s ease-in-out infinite`,
                }}
              >
                <EmojiEventsIcon
                  sx={{
                    fontSize: 40,
                    color: '#FFD700',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff', minHeight: 60 }}>
              <Typography variant="body2" fontWeight="bold" color="text.primary">
                Jorge Ortiz
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Premio Espíritu Pases Falsos
              </Typography>
            </Box>
          </Card>
        </Stack>
      </Box>
      
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
