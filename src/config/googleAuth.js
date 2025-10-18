// Configuración de Google OAuth2 para Silent Authentication con PKCE
// IMPORTANTE: En el nuevo sistema, el backend maneja toda la lógica de OAuth

// Función para obtener la URL base de la API
const getApiBaseUrl = () => {
  // En desarrollo, usar localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:8000';
  }
  
  // En producción, usar el dominio de la API
  return 'https://api.pasesfalsos.cl';
};

export const GOOGLE_OAUTH_CONFIG = {
  // URLs de los endpoints del backend
  LOGIN_URL: `${getApiBaseUrl()}/auth/google/login`,
  SILENT_LOGIN_URL: `${getApiBaseUrl()}/auth/google/silent`,
  CALLBACK_URL: `${getApiBaseUrl()}/auth/google/callback`,
  SESSION_URL: `${getApiBaseUrl()}/auth/session`,
  LOGOUT_URL: `${getApiBaseUrl()}/auth/logout`,
  
  // Configuración de la aplicación
  SCOPE: 'openid email profile',
  ACCESS_TYPE: 'offline'
};

// Función para construir la URL de autorización (ahora redirige al backend)
export const buildAuthUrl = (prompt = 'select_account') => {
  const { LOGIN_URL } = GOOGLE_OAUTH_CONFIG;
  
  // El backend maneja toda la lógica de OAuth, solo redirigimos
  const authUrl = new URL(LOGIN_URL);
  if (prompt !== 'consent') {
    authUrl.searchParams.set('prompt', prompt);
  }
  
  return authUrl.toString();
};

// Función para intercambiar código por access token (ya no es necesaria)
// El backend maneja esto directamente
export const exchangeCodeForToken = async (code) => {
  console.warn('⚠️ exchangeCodeForToken ya no es necesaria en el nuevo sistema');
  throw new Error('Esta función ya no es necesaria. El backend maneja la autenticación.');
};

// Función para limpiar el cache de OAuth (ya no es necesaria)
export const clearOAuthCache = () => {
  console.warn('⚠️ clearOAuthCache ya no es necesaria en el nuevo sistema');
  // No hay nada que limpiar en el nuevo sistema
};
