import React from 'react';
import { Box, Typography } from '@mui/material';

const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdFr2qmihpfwLxS4p7agzPPXCxsBTJjus-SajuVNeh9SvMDJA/viewform?embedded=true';

const Encuesta = () => {
  return (
    <Box sx={{ width: '100%', height: 'calc(100vh - 120px)', minHeight: 600, pb: 8 }}>
      <Typography variant="h5" component="h1" gutterBottom color="primary" sx={{ mb: 2 }}>
        Encuesta de Satisfacción 2026
      </Typography>
      
      <Box
        component="iframe"
        src={GOOGLE_FORM_URL}
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 600,
          border: 0,
          borderRadius: 1,
        }}
        title="Encuesta de Satisfacción 2026"
      />
    
    </Box>
  );
};

export default Encuesta;
