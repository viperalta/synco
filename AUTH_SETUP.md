# Configuración de Autenticación Google OAuth

## Archivos Implementados

### 1. Contexto de Autenticación
- `src/contexts/AuthContext.jsx` - Contexto React para manejar el estado de autenticación

### 2. Componentes
- `src/components/LoginButton.jsx` - Botón de login con Google
- `src/components/UserProfile.jsx` - Perfil de usuario autenticado
- `src/components/ProtectedRoute.jsx` - Componente para proteger rutas

### 3. Páginas
- `src/pages/Login.jsx` - Página de login

### 4. Integración
- `src/App.jsx` - Aplicación principal con AuthProvider y rutas protegidas

## Configuración de la API

La autenticación está configurada para trabajar con los siguientes endpoints de tu API:

### Endpoints Requeridos

1. **POST /auth/google** - Procesar access token o credencial JWT de Google
   - Body: `{ "access_token": "google_access_token" }` (flujo OAuth tradicional)
   - Body: `{ "credential": "google_jwt_credential" }` (autenticación silenciosa)
   - Debe devolver: `{ "access_token": "jwt_access_token", "refresh_token": "jwt_refresh_token", "token_type": "bearer", "expires_in": 5184000, "user": { "id", "name", "email", "picture" } }`

2. **POST /auth/refresh** - Renovar access token
   - Body: `{ "refresh_token": "jwt_refresh_token" }`
   - Debe devolver: `{ "access_token": "new_jwt_access_token", "token_type": "bearer", "expires_in": 5184000 }`

3. **POST /auth/revoke** - Revocar refresh token
   - Body: `{ "refresh_token": "jwt_refresh_token" }`
   - Debe devolver: `{ "message": "Token revocado exitosamente" }`

4. **GET /auth/me** - Verificar token válido
   - Headers: `Authorization: Bearer <access_token>`
   - Debe devolver: `{ "id", "name", "email", "picture" }`

5. **POST /auth/logout** - Cerrar sesión
   - Headers: `Authorization: Bearer <access_token>`
   - Debe devolver: `{ "message": "Sesión cerrada exitosamente" }`

## Flujo de Autenticación

### **Autenticación Silenciosa (Recomendada):**
1. Usuario hace clic en "Continuar con Google"
2. **Si ya está registrado**: Se autentica silenciosamente y aparece inmediatamente en el home
3. **Si no está registrado**: Se muestra el flujo OAuth tradicional
4. Se llama a `POST /auth/google` con la credencial JWT
5. La API devuelve access token, refresh token y datos del usuario
6. Ambos tokens se guardan en localStorage
7. El usuario es redirigido a la raíz (`/`)

### **Flujo OAuth Tradicional (Fallback):**
1. Usuario hace clic en "Continuar con Google"
2. Usuario es redirigido a Google para autenticarse
3. Google redirige de vuelta a `/auth/callback?code=...`
4. El frontend intercambia el código por un access token de Google
5. Se llama a `POST /auth/google` con el access token
6. La API devuelve access token, refresh token y datos del usuario
7. Ambos tokens se guardan en localStorage
8. El usuario es redirigido a la raíz (`/`)

### **Características Adicionales:**
- **Renovación automática**: Cuando el access token expira, se renueva automáticamente usando el refresh token
- **Sesiones largas**: El refresh token dura 30 días, manteniendo la sesión activa
- **Autenticación silenciosa**: Los usuarios registrados no necesitan pasar por el flujo OAuth completo

## Rutas Protegidas

Todas las rutas principales están protegidas:
- `/` (Home)
- `/calendario` (Calendar)
- `/contacto` (Contact)

Solo la ruta `/login` es pública.

## Uso en Componentes

```jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout, authenticatedApiCall } = useAuth();
  
  // Hacer llamadas autenticadas (con renovación automática)
  const fetchData = async () => {
    const response = await authenticatedApiCall('/mi-endpoint');
    const data = await response.json();
  };
}
```

## Sistema de Refresh Tokens

### **Características:**
- **Access Token**: Válido por 24 horas, se renueva automáticamente
- **Refresh Token**: Válido por 30 días, se usa para renovar access tokens
- **Renovación automática**: Los tokens se renuevan sin intervención del usuario
- **Revocación**: Los refresh tokens se pueden revocar individualmente

### **Almacenamiento:**
- `authToken`: Access token JWT (localStorage)
- `refreshToken`: Refresh token JWT (localStorage)

### **Flujo de Renovación:**
1. Llamada API con access token
2. Si recibe 401 (token expirado)
3. Automáticamente usa refresh token para obtener nuevo access token
4. Reintenta la llamada original con el nuevo token
5. Si refresh token también expiró, limpia la sesión y redirige a login

## Configuración de Google OAuth2

### 1. Crear proyecto en Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la Google+ API

### 2. Configurar credenciales OAuth2
1. Ve a "APIs & Services" > "Credentials"
2. Crea credenciales OAuth 2.0 Client ID
3. Configura:
   - **Application type**: Web application
   - **Authorized redirect URIs**: `http://localhost:5173/auth/callback` (desarrollo)
   - **Authorized redirect URIs**: `https://tu-dominio.com/auth/callback` (producción)

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto:
```env
VITE_GOOGLE_CLIENT_ID=tu_client_id_aqui
VITE_GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
```

### 4. Actualizar configuración
Edita `src/config/googleAuth.js` y reemplaza:
- `tu_client_id_aqui` con tu Client ID real
- `tu_client_secret_aqui` con tu Client Secret real

## Próximos Pasos

1. **Configurar Google OAuth2** (ver sección anterior)
2. **Configurar los endpoints en tu API backend**
3. **Probar el flujo completo de autenticación**
4. **Ajustar el diseño según sea necesario**
5. **Implementar manejo de errores más específico**
