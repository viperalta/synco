import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Función para obtener la URL base del backend
const getBackendUrl = () => {
  // En desarrollo, usar localhost:8000
  if (import.meta.env.DEV) {
    return 'http://localhost:8000';
  }
  
  // En producción, usar el dominio de la API
  return 'https://api.pasesfalsos.cl';
};

// Crear el contexto de autenticación
const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Componente proveedor del contexto de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  // Variables para evitar múltiples verificaciones de sesión simultáneas
  const sessionCheckPromiseRef = useRef(null);
  const lastSessionCheckRef = useRef(0);
  const SESSION_CHECK_COOLDOWN = 3000; // 3 segundos de cooldown

  // Función para verificar sesión existente usando cookies httpOnly
  const checkExistingSession = async () => {
    try {
      console.log('🔍 Verificando sesión existente...');
      
      // Si hay una verificación en progreso, esperar a que termine
      if (sessionCheckPromiseRef.current) {
        console.log('⏳ Esperando verificación de sesión en progreso...');
        return await sessionCheckPromiseRef.current;
      }
      
      // Verificar cooldown para evitar llamadas muy frecuentes
      const now = Date.now();
      if (now - lastSessionCheckRef.current < SESSION_CHECK_COOLDOWN) {
        console.log('⏰ Cooldown activo para verificación de sesión');
        return isAuthenticated; // Retornar estado actual
      }
      
      lastSessionCheckRef.current = now;
      
      sessionCheckPromiseRef.current = (async () => {
        try {
          // Si hay refresh_token, validar sesión con él para obtener nuevos tokens
          if (refreshToken) {
            const resp = await fetch(`${getBackendUrl()}/auth/check-session`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken })
            });
            if (resp.ok) {
              const data = await resp.json();
              setUser(data.user);
              setIsAuthenticated(true);
              if (data.access_token) {
                setAccessToken(data.access_token);
                localStorage.setItem('access_token', data.access_token);
              }
              if (data.refresh_token) {
                setRefreshToken(data.refresh_token);
                localStorage.setItem('refresh_token', data.refresh_token);
              }
              return true;
            }
          }
          const response = await fetch(`${getBackendUrl()}/auth/session`, {
            credentials: 'include', // Importante para enviar cookies
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log('✅ Sesión activa encontrada:', userData.user);
            console.log('🔍 Datos completos de la respuesta:', userData);
            
            // Actualizar estado de autenticación
            setUser(userData.user);
            setIsAuthenticated(true);
            
            // Guardar access token si está disponible
            if (userData.access_token) {
              console.log('🔑 Access token obtenido:', userData.access_token);
              setAccessToken(userData.access_token);
              
              // Guardar token en localStorage para persistencia
              localStorage.setItem('access_token', userData.access_token);
            } else {
              console.log('⚠️ No se encontró access_token en la respuesta');
            }

            // Guardar refresh_token si está disponible
            if (userData.refresh_token) {
              setRefreshToken(userData.refresh_token);
              localStorage.setItem('refresh_token', userData.refresh_token);
            }
            
            // Guardar email para silent login futuro
            if (userData.user && userData.user.email) {
              localStorage.setItem('user_email', userData.user.email);
            }
            
            return true;
          } else if (response.status === 401) {
            console.log('❌ Sesión expirada o inválida');
            // Limpiar estado local si la sesión es inválida
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('user_email');
            return false;
          } else {
            console.log('❌ Error verificando sesión:', response.status);
            return false;
          }
        } catch (error) {
          console.error('Error verificando sesión:', error);
          // En caso de error de red, no limpiar el estado local
          // para evitar desloguear al usuario por problemas temporales
          return false;
        } finally {
          // Limpiar la promesa después de completarse
          sessionCheckPromiseRef.current = null;
        }
      })();
      
      return await sessionCheckPromiseRef.current;
    } catch (error) {
      console.error('Error verificando sesión:', error);
      return false;
    }
  };

  // Función para intentar silent login usando GET con query parameter
  const attemptSilentLogin = async (email) => {
    try {
      console.log('🔇 Intentando silent login para:', email);
      
      // Usar GET con email como query parameter según especificación del backend
      const response = await fetch(
        `${getBackendUrl()}/auth/google/silent?email=${encodeURIComponent(email)}`,
        { 
          method: 'GET', 
          credentials: 'include' 
        }
      );
      
      if (response.ok) {
        console.log('✅ Silent login exitoso');
        // Verificar sesión después del silent login
        const sessionValid = await checkExistingSession();
        return sessionValid;
      } else {
        console.log('❌ Silent login falló:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error en silent login:', error);
      return false;
    }
  };


  // Función para verificar autenticación al cargar la aplicación
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      
      // Verificar si el usuario acaba de hacer logout
      if (justLoggedOut) {
        console.log('🚪 Usuario acaba de hacer logout, saltando verificación de sesión');
        setJustLoggedOut(false);
        setLoading(false);
        return;
      }
      
      // 1. Verificar si hay sesión activa
      const hasSession = await checkExistingSession();
      if (hasSession) {
        setLoading(false);
        return;
      }
      
      // 2. Si no hay sesión, intentar silent login
      const savedEmail = localStorage.getItem('user_email');
      if (savedEmail) {
        console.log('🔄 Intentando silent login con email guardado:', savedEmail);
        const silentLoginSuccess = await attemptSilentLogin(savedEmail);
        if (silentLoginSuccess) {
          setLoading(false);
          return;
        }
      }
      
      // 3. Si silent login falla, mostrar UI normal
      console.log('ℹ️ Silent login no disponible, mostrando UI normal');
      setLoading(false);
      
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setLoading(false);
    }
  };

  // Función para verificar si hay una sesión activa basada en cookies
  const hasActiveSession = () => {
    // Verificar si hay cookies de sesión
    return document.cookie.includes('session_token') || 
           document.cookie.includes('sessionid') ||
           document.cookie.includes('connect.sid');
  };

  // Función para limpiar todas las cookies de sesión manualmente
  const clearSessionCookies = () => {
    try {
      console.log('🧹 Limpiando cookies de sesión manualmente...');
      
      // Obtener el dominio actual
      const domain = window.location.hostname;
      const isLocalhost = domain === 'localhost' || domain === '127.0.0.1';
      
      // Lista de cookies de sesión comunes
      const sessionCookies = [
        'session_token',
        'sessionid', 
        'connect.sid',
        'auth_token',
        'access_token',
        'refresh_token'
      ];
      
      // Limpiar cada cookie de sesión
      sessionCookies.forEach(cookieName => {
        // Limpiar para el dominio actual
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        
        // Limpiar para subdominios si no es localhost
        if (!isLocalhost) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
        }
        
        // Para localhost, también intentar limpiar con diferentes configuraciones
        if (isLocalhost) {
          // Limpiar sin dominio específico
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          // Limpiar con localhost
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
          // Limpiar con 127.0.0.1
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=127.0.0.1;`;
        }
      });
      
      console.log('✅ Cookies de sesión limpiadas manualmente');
    } catch (error) {
      console.error('Error limpiando cookies manualmente:', error);
    }
  };

  // Función para debuggear el estado de las cookies
  const debugCookieState = () => {
    console.log('🍪 Estado actual de las cookies:');
    console.log('Document.cookie:', document.cookie);
    
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name) acc[name] = value;
      return acc;
    }, {});
    
    console.log('Cookies parseadas:', cookies);
    
    const sessionCookies = ['session_token', 'sessionid', 'connect.sid', 'auth_token'];
    const activeSessionCookies = sessionCookies.filter(name => cookies[name]);
    
    if (activeSessionCookies.length > 0) {
      console.log('⚠️ Cookies de sesión activas encontradas:', activeSessionCookies);
    } else {
      console.log('✅ No hay cookies de sesión activas');
    }
    
    return activeSessionCookies.length > 0;
  };

  // Función temporal para debuggear cookies con detalles completos
  const debugCookieDetails = () => {
    console.log('🔍 Debug detallado de cookies:');
    
    // Obtener todas las cookies con sus atributos
    const cookieDetails = document.cookie.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=');
      return { name, value };
    });
    
    console.log('Cookies con valores:', cookieDetails);
    
    // Verificar cookies de sesión específicas
    const sessionCookies = ['session_token', 'sessionid', 'connect.sid', 'auth_token'];
    sessionCookies.forEach(cookieName => {
      const cookie = cookieDetails.find(c => c.name === cookieName);
      if (cookie) {
        console.log(`✅ ${cookieName}: ${cookie.value}`);
      } else {
        console.log(`❌ ${cookieName}: No encontrada`);
      }
    });
    
    // Verificar headers de respuesta recientes
    console.log('💡 Para ver detalles completos de cookies, revisa:');
    console.log('1. DevTools → Application → Cookies');
    console.log('2. DevTools → Network → Response Headers → Set-Cookie');
  };

  // Función de login inteligente simplificada (sin popups)
  const loginWithGoogle = async () => {
    try {
      console.log('🚀 Iniciando login inteligente con Google');
      
      const savedEmail = localStorage.getItem('user_email');
      const sessionActive = hasActiveSession();
      
      if (savedEmail && sessionActive) {
        // Usuario ya logueado - verificar sesión
        console.log('👤 Usuario ya logueado, verificando sesión...');
        const sessionValid = await checkExistingSession();
        if (sessionValid) {
          return; // Ya está logueado
        }
      }
      
      if (savedEmail) {
        // Usuario registrado pero sin sesión - intentar silent login
        console.log('🔄 Usuario registrado, intentando silent login...');
        const silentLoginSuccess = await attemptSilentLogin(savedEmail);
        if (silentLoginSuccess) {
          return; // Silent login exitoso
        }
      }
      
      // Usuario nuevo o silent login falló - login normal
      console.log('🆕 Usuario nuevo o silent login falló, iniciando login normal');
      window.location.href = `${getBackendUrl()}/auth/google/login`;
      
    } catch (error) {
      console.error('Error en login inteligente:', error);
      // Fallback a login normal
      window.location.href = `${getBackendUrl()}/auth/google/login`;
    }
  };

  // Función para inicializar tokens desde localStorage
  const initializeTokens = () => {
    const savedToken = localStorage.getItem('access_token');
    const savedRefresh = localStorage.getItem('refresh_token');
    
    console.log('🔍 Inicializando tokens desde localStorage...');
    console.log('📦 Token guardado:', !!savedToken);
    console.log('📦 Refresh token guardado:', !!savedRefresh);
    
    if (savedRefresh) {
      setRefreshToken(savedRefresh);
    }

    if (savedToken) {
      // Setear token primero
      setAccessToken(savedToken);
      
      // Verificar expiración después de setear
      if (isAccessTokenExpired()) {
        console.log('⏰ Token expirado en localStorage, limpiando...');
        setAccessToken(null);
        localStorage.removeItem('access_token');
        return false;
      }
      
      console.log('🔑 Token válido encontrado en localStorage');
      return true;
    } else {
      console.log('❌ No hay tokens guardados en localStorage');
    }
    
    return false;
  };

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    const initializeAuth = async () => {
      // Inicializar tokens desde localStorage
      initializeTokens();
      
      // Primero procesar callback si existe
      await processLoginCallback();
      
      // Luego verificar estado de autenticación
      await checkAuthStatus();
    };
    
    initializeAuth();
  }, []);

  // Función para login normal con Google (con UI)
  const handleGoogleLogin = () => {
    console.log('🚀 Iniciando login normal con Google');
    window.location.href = `${getBackendUrl()}/auth/google/login`;
  };

  // Función para procesar callback con parámetros de URL
  const processLoginCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const loginStatus = urlParams.get('login');
      
      if (loginStatus === 'success') {
        console.log('✅ Login exitoso detectado en URL');
        // Verificar sesión y actualizar UI
        await checkExistingSession();
        
        // Limpiar parámetros de la URL
        const url = new URL(window.location);
        url.searchParams.delete('login');
        url.searchParams.delete('message');
        window.history.replaceState({}, document.title, url.pathname);
        
      } else if (loginStatus === 'error') {
        console.log('❌ Error de login detectado en URL');
        const errorMessage = urlParams.get('message') || 'Error desconocido';
        console.error('Error de login:', errorMessage);
        
        // Limpiar parámetros de la URL
        const url = new URL(window.location);
        url.searchParams.delete('login');
        url.searchParams.delete('message');
        window.history.replaceState({}, document.title, url.pathname);
      }
    } catch (error) {
      console.error('Error procesando callback:', error);
    }
  };

  // Función para cambiar cuenta (con selector de cuentas)
  const handleChangeAccount = () => {
    console.log('🔄 Iniciando cambio de cuenta');
    window.location.href = `${getBackendUrl()}/auth/google/login?prompt=select_account`;
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      console.log('🚪 Cerrando sesión...');
      
      // Debug: verificar estado de cookies antes del logout
      console.log('🔍 Estado de cookies antes del logout:');
      debugCookieState();
      
      // Hacer la llamada al backend para eliminar la cookie
      const response = await fetch(`${getBackendUrl()}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      // Verificar que la respuesta sea exitosa
      if (!response.ok) {
        console.warn('⚠️ El servidor no pudo cerrar la sesión correctamente:', response.status);
      } else {
        console.log('✅ Backend confirmó el logout exitosamente');
        
        // Verificar las cookies que el backend intentó eliminar
        const setCookieHeader = response.headers.get('set-cookie');
        if (setCookieHeader) {
          console.log('🍪 Cookie eliminada por el backend:', setCookieHeader);
        }
      }
      
      // Limpiar estado local
      setUser(null);
      setIsAuthenticated(false);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('user_email');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Marcar que el usuario acaba de hacer logout
      setJustLoggedOut(true);
      
      // Limpiar cookies manualmente como respaldo
      clearSessionCookies();
      
      // Hacer una verificación adicional de la sesión para asegurar que se eliminó
      console.log('🔍 Verificando sesión después del logout...');
      try {
        const sessionCheck = await fetch(`${getBackendUrl()}/auth/session`, {
          credentials: 'include',
          method: 'GET'
        });
        
        if (sessionCheck.ok) {
          console.warn('⚠️ El backend aún reporta una sesión activa después del logout');
          const sessionData = await sessionCheck.json();
          console.log('Datos de sesión:', sessionData);
        } else {
          console.log('✅ El backend confirma que no hay sesión activa');
        }
      } catch (error) {
        console.log('ℹ️ No se pudo verificar la sesión en el backend:', error.message);
      }
      
      // Debug: verificar estado de cookies después de la limpieza
      console.log('🔍 Estado de cookies después de la limpieza:');
      const stillHasCookies = debugCookieState();
      
      if (stillHasCookies) {
        console.warn('⚠️ Aún hay cookies de sesión activas después del logout');
      } else {
        console.log('✅ Todas las cookies de sesión fueron eliminadas correctamente');
      }
      
      console.log('✅ Sesión cerrada exitosamente');
      
      // NO recargar la página, solo limpiar el estado
      // Esto evita que se ejecute el silent login automático
      console.log('🔄 Estado limpiado, usuario deslogueado');
      
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      // Limpiar estado local incluso si hay error
      setUser(null);
      setIsAuthenticated(false);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('user_email');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Marcar que el usuario acaba de hacer logout
      setJustLoggedOut(true);
      
      // Limpiar cookies manualmente como respaldo
      clearSessionCookies();
      
      // Debug: verificar estado de cookies después del error
      console.log('🔍 Estado de cookies después del error:');
      debugCookieState();
      
      console.log('🔄 Estado limpiado después del error, usuario deslogueado');
    }
  };

  // Verificación de expiración basada en JWT (exp)
  const isAccessTokenExpired = () => {
    if (!accessToken) return true;
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  };


  // Función para renovar el access token
  const refreshAccessToken = async () => {
    try {
      console.log('🔄 Renovando access token...');
      const currentRefresh = refreshToken || localStorage.getItem('refresh_token');
      if (!currentRefresh) {
        console.log('❌ No hay refresh_token disponible, cerrando sesión');
        await handleLogout();
        throw new Error('No refresh token');
      }

      const response = await fetch(`${getBackendUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: currentRefresh })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token renovado exitosamente');
        
        setAccessToken(data.access_token);
        
        // Guardar token renovado en localStorage
        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          setRefreshToken(data.refresh_token);
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        
        return data.access_token;
      } else {
        console.log('❌ Error renovando token:', response.status);
        await handleLogout();
        throw new Error('No se pudo renovar el token');
      }
    } catch (error) {
      console.error('Error renovando token:', error);
      await handleLogout();
      throw error;
    }
  };

  // Variables para evitar múltiples llamadas simultáneas
  const tokenRefreshPromiseRef = useRef(null);
  const lastTokenRefreshRef = useRef(0);
  const TOKEN_REFRESH_COOLDOWN = 5000; // 5 segundos de cooldown

  // Función para obtener el token de autenticación
  const getAuthToken = async () => {
    console.log('🔑 getAuthToken llamado - accessToken:', !!accessToken, 'expired:', isAccessTokenExpired());
    
    // 1. Token válido existente
    if (accessToken && !isAccessTokenExpired()) {
      console.log('✅ Usando token existente válido');
      return accessToken;
    }
    
    // 2. Evitar llamadas simultáneas
    if (tokenRefreshPromiseRef.current) {
      console.log('⏳ Esperando llamada de token en progreso...');
      return await tokenRefreshPromiseRef.current;
    }
    
    // 3. Verificar cooldown
    const now = Date.now();
    if (now - lastTokenRefreshRef.current < TOKEN_REFRESH_COOLDOWN) {
      console.log('⏰ Cooldown activo, usando token existente si está disponible');
      return accessToken || null;
    }
    
    lastTokenRefreshRef.current = now;
    
    tokenRefreshPromiseRef.current = (async () => {
      try {
        // Prioridad 1: Renovar con refresh_token
        if (refreshToken || localStorage.getItem('refresh_token')) {
          console.log('🔄 Intentando renovar con refresh_token...');
          return await refreshAccessToken();
        }
        
        // Prioridad 2: Obtener token fresco desde /auth/session
        console.log('🔄 Obteniendo token fresco desde /auth/session...');
        const response = await fetch(`${getBackendUrl()}/auth/session`, {
          credentials: 'include',
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.access_token) {
            console.log('✅ Token fresco obtenido desde /auth/session');
            setAccessToken(data.access_token);
            localStorage.setItem('access_token', data.access_token);
            return data.access_token;
          }
        }
        
        console.log('⚠️ No se pudo obtener token fresco');
        return null;
      } finally {
        tokenRefreshPromiseRef.current = null;
      }
    })();
    
    return await tokenRefreshPromiseRef.current;
  };

  // Función para hacer llamadas autenticadas a la API
  const authenticatedApiCall = async (endpoint, options = {}) => {
    try {
      console.log('🌐 authenticatedApiCall iniciada para:', endpoint);
      
      // Obtener el token de autenticación
      const token = await getAuthToken();
      
      // Preparar headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      // Solo agregar Authorization si hay token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Token Bearer agregado a headers:', `Bearer ${token.substring(0, 20)}...`);
      } else {
        console.log('⚠️ No hay token disponible, usando solo cookies');
      }
      
      const url = `${getBackendUrl()}${endpoint}`;
      console.log('📡 Haciendo llamada a:', url);
      console.log('📋 Headers enviados:', headers);
      
      const response = await fetch(url, {
        ...options,
        credentials: 'include', // Importante para enviar cookies
        headers
      });
      
      console.log('📥 Respuesta recibida:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔒 401 - Intentando refrescar y reintentar');
          try {
            await refreshAccessToken();
            const retryHeaders = {
              'Content-Type': 'application/json',
              ...options.headers
            };
            const retryToken = localStorage.getItem('access_token');
            if (retryToken) retryHeaders['Authorization'] = `Bearer ${retryToken}`;
            const retryResponse = await fetch(`${getBackendUrl()}${endpoint}`, {
              ...options,
              credentials: 'include',
              headers: retryHeaders
            });
            if (!retryResponse.ok) {
              throw new Error(`Error del servidor: ${retryResponse.status}`);
            }
            return retryResponse;
          } catch (e) {
            throw new Error('Token de autenticación inválido o expirado');
          }
        } else if (response.status === 403) {
          console.log('🚫 Acceso denegado');
          throw new Error('No tienes permisos para realizar esta acción');
        } else if (response.status >= 500) {
          console.log('🔥 Error del servidor');
          throw new Error('Error interno del servidor. Inténtalo más tarde.');
        } else {
          console.log('❌ Error HTTP:', response.status);
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error en llamada autenticada:', error);
      
      // Si es un error de red, no limpiar la sesión
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.log('🌐 Error de red, manteniendo sesión local');
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      }
      
      throw error;
    }
  };


  const value = {
    user,
    loading,
    isAuthenticated,
    justLoggedOut,
    accessToken,
    refreshToken,
    setUser,
    setIsAuthenticated,
    handleGoogleLogin,
    handleChangeAccount,
    handleLogout,
    getAuthToken,
    refreshAccessToken,
    authenticatedApiCall,
    // Funciones de debug y utilidades
    debugCookieState,
    debugCookieDetails,
    clearSessionCookies,
    hasActiveSession,
    // Mantener compatibilidad con nombres anteriores
    loginWithGoogle: loginWithGoogle, // Usar la nueva función inteligente
    loginWithGoogleForceSelection: handleChangeAccount,
    logout: handleLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
