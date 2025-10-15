import React from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

const Contact = () => {
  const contactInfo = [
    {
      type: 'Teléfono',
      value: '+1 (555) 123-4567',
      icon: <PhoneIcon />,
      color: 'primary',
      action: 'Llamar',
    },
    {
      type: 'Email',
      value: 'contacto@synco.com',
      icon: <EmailIcon />,
      color: 'secondary',
      action: 'Enviar Email',
    },
    {
      type: 'Dirección',
      value: '123 Calle Principal, Ciudad, País',
      icon: <LocationIcon />,
      color: 'success',
      action: 'Ver en Mapa',
    },
  ];

  const handleContactAction = (type, value) => {
    switch (type) {
      case 'Teléfono':
        window.open(`tel:${value}`);
        break;
      case 'Email':
        window.open(`mailto:${value}`);
        break;
      case 'Dirección':
        // You could integrate with Google Maps or another mapping service
        alert(`Dirección: ${value}`);
        break;
      default:
        break;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom color="primary" align="center">
        Contacto
      </Typography>
      
      <Typography variant="h6" component="p" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Ponte en contacto con nosotros
      </Typography>

      <Grid container spacing={3}>
        {contactInfo.map((contact, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Chip
                    icon={contact.icon}
                    label={contact.type}
                    color={contact.color}
                    variant="outlined"
                    sx={{ fontSize: '1rem', py: 2, px: 1 }}
                  />
                </Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {contact.value}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="contained"
                  color={contact.color}
                  onClick={() => handleContactAction(contact.type, contact.value)}
                  sx={{ px: 3 }}
                >
                  {contact.action}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={2} sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Información Adicional
        </Typography>
        <Typography variant="body1" paragraph>
          Estamos disponibles de lunes a viernes de 9:00 AM a 6:00 PM.
        </Typography>
        <Typography variant="body1">
          Para consultas urgentes, puedes contactarnos por teléfono o enviarnos un email.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Contact;
