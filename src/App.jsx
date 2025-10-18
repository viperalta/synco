import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Container,
  Paper,
  Avatar,
  AppBar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  ContactPhone as ContactIcon,
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Import page components
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Contact from './pages/Contact';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';

// Import components
import UserProfile from './components/UserProfile';
import ProtectedRoute from './components/ProtectedRoute';

// Import contexts
import { AuthProvider } from './contexts/AuthContext';

// Import API configuration
import { initializeApiUrl } from './config/api';

// Import logo
import logopases from './assets/logopases.png';

const drawerWidth = 240;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Inicializar la configuración de la API al cargar la aplicación
  useEffect(() => {
    initializeApiUrl().catch(error => {
      console.error('Error inicializando API:', error);
    });
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Calendario', icon: <CalendarIcon />, path: '/calendario' },
    { text: 'Contacto', icon: <ContactIcon />, path: '/contacto' },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', flexDirection: 'column', py: 2 }}>
          {/* Logo */}
          <Box sx={{ mb: 2 }}>
            <Avatar
              src={logopases}
              alt="Pases Falsos Logo"
              sx={{ 
                width: 120, 
                height: 120,
                border: '2px solid',
                borderColor: 'primary.main',
                boxShadow: 2
              }}
            />
          </Box>
          
          {/* Title */}
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              textAlign: 'center',
              color: 'primary.main'
            }}
          >
            SYNCO
          </Typography>
          <Typography 
            variant="subtitle2" 
            component="div" 
            sx={{ 
              textAlign: 'center',
              color: 'text.secondary',
              mt: 0.5
            }}
          >
            Pases Falsos
          </Typography>
        </Box>
      </Toolbar>
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={Link} to={item.path} onClick={() => setMobileOpen(false)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {/* User Profile */}
      <Box sx={{ px: 2, pb: 2, mt: 'auto' }}>
        <UserProfile />
      </Box>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            
            {/* AppBar para mobile */}
            <AppBar
              position="fixed"
              sx={{
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                ml: { sm: `${drawerWidth}px` },
                display: { xs: 'block', sm: 'none' },
              }}
            >
              <Toolbar>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div">
                  SYNCO - Pases Falsos
                </Typography>
              </Toolbar>
            </AppBar>

            <Box
              component="nav"
              sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
              aria-label="mailbox folders"
            >
              <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                  keepMounted: true,
                }}
                sx={{
                  display: { xs: 'block', sm: 'none' },
                  '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
              >
                {drawer}
              </Drawer>
              <Drawer
                variant="permanent"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
                open
              >
                {drawer}
              </Drawer>
            </Box>
            <Box
              component="main"
              sx={{
                flexGrow: 1,
              p: { xs: 0.25, sm: 3 },
                width: { sm: `calc(100% - ${drawerWidth}px)` },
              }}
            >
              <Toolbar sx={{ display: { xs: 'block', sm: 'none' } }} />
              <Container maxWidth="lg">
                <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, minHeight: '80vh' }}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    } />
                    <Route path="/calendario" element={
                      <ProtectedRoute>
                        <Calendar />
                      </ProtectedRoute>
                    } />
                    <Route path="/contacto" element={
                      <ProtectedRoute>
                        <Contact />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </Paper>
              </Container>
            </Box>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;