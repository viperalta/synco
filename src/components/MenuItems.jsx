import React from 'react';
import { Link } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  ContactPhone as ContactIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const MenuItems = ({ onItemClick }) => {
  const { user } = useAuth();

  console.log('🔍 MenuItems - Usuario actual:', user);
  console.log('🔍 MenuItems - Roles del usuario:', user?.roles);

  const getMenuItems = () => {
    const menuItems = [];
    
    // Home - Todos los usuarios pueden verlo
    menuItems.push({ text: 'Home', icon: <HomeIcon />, path: '/' });
    
    // Calendario - Temporalmente visible para todos los usuarios
    menuItems.push({ text: 'Calendario', icon: <CalendarIcon />, path: '/calendario' });
    
    // Contacto - Todos los usuarios pueden verlo
    menuItems.push({ text: 'Contacto', icon: <ContactIcon />, path: '/contacto' });
    
    // Usuarios - Solo administradores
    if (user?.roles?.includes('admin')) {
      menuItems.push({ text: 'Usuarios', icon: <PeopleIcon />, path: '/usuarios' });
    }

    console.log('📋 MenuItems generados:', menuItems.map(item => item.text));
    return menuItems;
  };

  return (
    <List>
      {getMenuItems().map((item) => (
        <ListItem key={item.text} disablePadding>
          <ListItemButton component={Link} to={item.path} onClick={onItemClick}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default MenuItems;
