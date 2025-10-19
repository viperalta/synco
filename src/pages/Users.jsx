import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  Card,
  CardContent,
  CardActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Box as MuiBox,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    nickname: '',
    roles: []
  });
  const [updating, setUpdating] = useState(false);
  const [roleFilter, setRoleFilter] = useState([]);
  const [searchText, setSearchText] = useState('');
  const { getAuthToken, authenticatedApiCall } = useAuth();
  
  // Detectar si estamos en mobile
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  console.log('🔍 Users component - authenticatedApiCall disponible:', typeof authenticatedApiCall);

  // Función para obtener usuarios
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Iniciando fetchUsers...');
      
      const response = await authenticatedApiCall('/admin/users', {
        method: 'GET'
      });
      
      console.log('✅ Respuesta recibida:', response.status);
      const data = await response.json();
      console.log('📊 Datos de usuarios recibidos:', data);
      console.log('👥 Lista de usuarios:', data.users);
      if (data.users && data.users.length > 0) {
        console.log('🔍 Primer usuario como ejemplo:', data.users[0]);
        console.log('🆔 ID del primer usuario:', data.users[0]._id);
      }
      setUsers(data.users || []);
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      if (err.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (err.status === 403) {
        setError('No tienes permisos para acceder a esta información.');
      } else {
        setError('Error al cargar los usuarios. Verifica tu conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  // Función para abrir modal con detalles del usuario
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  // Función para cerrar modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  // Función para abrir modal de edición
  const handleEditUser = (user) => {
    console.log('🔍 Usuario seleccionado para editar:', user);
    console.log('🆔 ID del usuario:', user._id);
    console.log('📝 Datos del usuario:', {
      _id: user._id,
      nickname: user.nickname,
      roles: user.roles,
      email: user.email,
      name: user.name
    });
    
    setEditingUser(user);
    setEditForm({
      nickname: user.nickname || '',
      roles: user.roles || []
    });
    setEditModalOpen(true);
  };

  // Función para cerrar modal de edición
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingUser(null);
    setEditForm({
      nickname: '',
      roles: []
    });
    setUpdating(false);
  };

  // Función para actualizar usuario
  const handleUpdateUser = async () => {
    if (!editingUser) {
      console.log('❌ No hay usuario seleccionado para editar');
      return;
    }

    if (!editingUser._id) {
      console.log('❌ El usuario no tiene ID válido:', editingUser);
      setError('Error: El usuario no tiene un ID válido');
      return;
    }

    try {
      setUpdating(true);
      console.log('🔄 Actualizando usuario:', editingUser._id);
      console.log('📝 Datos a enviar:', editForm);
      console.log('🌐 URL de la llamada:', `/admin/users/${editingUser._id}`);

      const response = await authenticatedApiCall(`/admin/users/${editingUser._id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        console.log('✅ Usuario actualizado exitosamente');
        // Actualizar la lista de usuarios
        await fetchUsers();
        handleCloseEditModal();
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Error actualizando usuario:', err);
      setError(`Error al actualizar el usuario: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Función para manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES');
  };

  // Opciones de roles disponibles
  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'player', label: 'Jugador' },
    { value: 'coach', label: 'Entrenador' }
  ];

  // Función para filtrar usuarios por roles y texto
  const filteredUsers = users.filter(user => {
    // Filtro por roles
    const matchesRole = roleFilter.length === 0 || 
      roleFilter.some(filterRole => user.roles?.includes(filterRole));
    
    // Filtro por texto (busca en nombre, email y nickname)
    const matchesText = searchText === '' || 
      user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.nickname?.toLowerCase().includes(searchText.toLowerCase());
    
    return matchesRole && matchesText;
  });

  // Función para obtener color del chip según el rol
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'player':
        return 'primary';
      case 'coach':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Función para traducir rol
  const translateRole = (role) => {
    const roleOption = roleOptions.find(option => option.value === role);
    return roleOption ? roleOption.label : role;
  };

  // Componente de Card para mobile
  const UserCard = ({ user }) => (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar 
            src={user.picture} 
            alt={user.name}
            sx={{ width: 50, height: 50 }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div">
              {user.name || 'Sin nombre'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {user.roles?.map((role) => (
              <Chip
                key={role}
                label={translateRole(role)}
                size="small"
                color={getRoleColor(role)}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        <IconButton
          onClick={() => handleViewUser(user)}
          color="primary"
          size="small"
          title="Ver detalles"
        >
          <VisibilityIcon />
        </IconButton>
        <IconButton
          onClick={() => handleEditUser(user)}
          color="secondary"
          size="small"
          title="Editar usuario"
        >
          <EditIcon />
        </IconButton>
      </CardActions>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: 2
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.secondary">
            Cargando usuarios...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert 
          severity="error" 
          action={
            <IconButton color="inherit" size="small" onClick={fetchUsers}>
              <RefreshIcon />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Usuarios
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administra todos los usuarios del sistema
        </Typography>
      </Box>

      {/* Filtros */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Buscar usuarios"
              placeholder="Nombre, email o nickname..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="role-filter-label">Filtrar por roles</InputLabel>
              <Select
                labelId="role-filter-label"
                id="role-filter"
                multiple
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                input={<OutlinedInput label="Filtrar por roles" />}
                sx={{ minWidth: '200px' }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Filtrar por roles
                      </Typography>
                    ) : (
                      selected.map((value) => (
                        <Chip
                          key={value}
                          label={roleOptions.find(option => option.value === value)?.label}
                          size="small"
                          color={getRoleColor(value)}
                          variant="outlined"
                        />
                      ))
                    )}
                  </Box>
                )}
              >
                {roleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {isMobile ? (
        // Vista de Cards para Mobile
        <Box>
          {filteredUsers.map((user) => (
            <UserCard key={user._id} user={user} />
          ))}
        </Box>
      ) : (
        // Vista de Tabla para Desktop
        <Paper elevation={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Avatar</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Nickname</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha Creación</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Avatar 
                        src={user.picture} 
                        alt={user.name}
                        sx={{ width: 40, height: 40 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {user.name || 'Sin nombre'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.nickname || 'Sin nickname'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {user.roles?.map((role) => (
                          <Chip
                            key={role}
                            label={translateRole(role)}
                            size="small"
                            color={getRoleColor(role)}
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Activo' : 'Inactivo'}
                        color={user.is_active ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(user.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={() => handleViewUser(user)}
                          color="primary"
                          size="small"
                          title="Ver detalles"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleEditUser(user)}
                          color="secondary"
                          size="small"
                          title="Editar usuario"
                        >
                          <EditIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Modal de detalles del usuario */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              src={selectedUser?.picture} 
              alt={selectedUser?.name}
              sx={{ width: 50, height: 50 }}
            />
            <Box>
              <Typography variant="h6">
                {selectedUser?.name || 'Sin nombre'}
                {selectedUser?.nickname && ` (${selectedUser.nickname})`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedUser?.email}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Roles y permisos */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Roles y Permisos
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Roles Asignados
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedUser?.roles?.map((role) => (
                      <Chip
                        key={role}
                        label={translateRole(role)}
                        color={getRoleColor(role)}
                        variant="filled"
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            {/* Fechas */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información de Fechas
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de Creación
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedUser?.created_at)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Última Actualización
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedUser?.updated_at)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseModal} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de edición de usuario */}
      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              src={editingUser?.picture} 
              alt={editingUser?.name}
              sx={{ width: 40, height: 40 }}
            />
            <Box>
              <Typography variant="h6">
                Editar Usuario
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {editingUser?.name} - {editingUser?.email}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {/* Campo Nickname */}
            <TextField
              fullWidth
              label="Nickname"
              value={editForm.nickname}
              onChange={(e) => handleFormChange('nickname', e.target.value)}
              variant="outlined"
              placeholder="Ingresa el nickname del usuario"
            />
            
            {/* Selector de Roles */}
            <FormControl fullWidth>
              <InputLabel id="roles-select-label">Roles</InputLabel>
              <Select
                labelId="roles-select-label"
                multiple
                value={editForm.roles}
                onChange={(e) => handleFormChange('roles', e.target.value)}
                input={<OutlinedInput label="Roles" />}
                renderValue={(selected) => (
                  <MuiBox sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={translateRole(value)} 
                        color={getRoleColor(value)}
                        size="small"
                      />
                    ))}
                  </MuiBox>
                )}
              >
                {roleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Puedes seleccionar múltiples roles o ninguno
              </Typography>
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleCloseEditModal} 
            variant="outlined"
            disabled={updating}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateUser} 
            variant="contained"
            disabled={updating}
            startIcon={updating ? <CircularProgress size={20} /> : null}
          >
            {updating ? 'Actualizando...' : 'Actualizar Usuario'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Users;
