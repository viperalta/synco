import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../config/api';

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

  // Función para verificar sesión existente usando cookies httpOnly
  const checkExistingSession = async () => {
    try {
      console.log('🔍 Verificando sesión existente...');
      
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
        
        // Actualizar estado de autenticación
        setUser(userData.user);
        setIsAuthenticated(true);
        
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
    }
  };

  // Función para intentar silent login usando popup
  const attemptSilentLogin = async (email) => {
    return new Promise((resolve) => {
      try {
        console.log('🔇 Intentando silent login para:', email);
        
        // Crear popup para silent login
        const popup = window.open(
          `${getBackendUrl()}/auth/google/silent?email=${encodeURIComponent(email)}`,
          'google-silent-login',
          'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,toolbar=no,menubar=no,location=no'
        );
        
        if (!popup || popup.closed) {
          console.log('❌ Popup bloqueado por el navegador');
          resolve(false);
          return;
        }
        
        // Escuchar respuesta del popup
        const handleMessage = (event) => {
          console.log('📨 Mensaje recibido del popup:', event.data);
          
          if (event.data.type === 'LOGIN_OK') {
            console.log('✅ Silent login exitoso');
            // Silent login exitoso, verificar sesión
            checkExistingSession().then(() => {
              resolve(true);
            });
            cleanup();
          } else if (event.data.type === 'LOGIN_FAILED') {
            console.log('❌ Silent login falló:', event.data.error);
            resolve(false);
            cleanup();
          }
        };
        
        // Función para limpiar recursos
        const cleanup = () => {
          if (popup && !popup.closed) {
            popup.close();
          }
          window.removeEventListener('message', handleMessage);
        };
        
        // Agregar listener para mensajes
        window.addEventListener('message', handleMessage);
        
        // Verificar si el popup se cerró manualmente
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            console.log('⏰ Popup cerrado manualmente');
            clearInterval(checkClosed);
            resolve(false);
            cleanup();
          }
        }, 1000);
        
        // Timeout después de 15 segundos
        setTimeout(() => {
          console.log('⏰ Timeout en silent login');
          clearInterval(checkClosed);
          resolve(false);
          cleanup();
        }, 15000);
        
      } catch (error) {
        console.error('Error en silent login:', error);
        resolve(false);
      }
    });
  };

  // Función para manejar errores de popup bloqueado
  const handlePopupBlocked = () => {
    console.log('⚠️ Popup bloqueado, ofreciendo alternativa');
    // Mostrar mensaje al usuario o usar redirección completa
    const useRedirect = confirm(
      'Tu navegador bloqueó la ventana emergente. ¿Quieres continuar con el login en la misma ventana?'
    );
    
    if (useRedirect) {
      window.location.href = `${getBackendUrl()}/auth/google/login`;
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

  // Función de login inteligente que detecta el tipo de usuario
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
        
        // Si silent login falla, verificar si fue por popup bloqueado
        console.log('❌ Silent login falló, verificando causa...');
        
        // Intentar detectar si el popup fue bloqueado
        try {
          const testPopup = window.open('', 'test-popup', 'width=1,height=1');
          if (!testPopup || testPopup.closed) {
            handlePopupBlocked();
            return;
          } else {
            testPopup.close();
          }
        } catch (e) {
          // Popup definitivamente bloqueado
          handlePopupBlocked();
          return;
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

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    const initializeAuth = async () => {
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
      localStorage.removeItem('user_email');
      
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
      localStorage.removeItem('user_email');
      
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

  // Función para obtener el token de autenticación (mantener compatibilidad)
  const getAuthToken = () => {
    // En el nuevo sistema, el token se maneja via cookies httpOnly
    // Esta función se mantiene para compatibilidad pero no es necesaria
    return null;
  };

  // Función para hacer llamadas autenticadas a la API
  const authenticatedApiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`/api${endpoint}`, {
        ...options,
        credentials: 'include', // Importante para enviar cookies
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, limpiar sesión
          console.log('🔒 Sesión expirada, limpiando estado local');
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('user_email');
          
          // Opcional: redirigir al login si es una página protegida
          if (window.location.pathname !== '/login') {
            console.log('🔄 Redirigiendo al login...');
            window.location.href = '/login';
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

  // Función para verificar si un usuario existe (mantener compatibilidad)
  const checkUserExists = async (email) => {
    try {
      const response = await authenticatedApiCall('/auth/check-user', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.exists;
      }
      return false;
    } catch (error) {
      console.error('Error verificando usuario:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    justLoggedOut,
    setUser,
    setIsAuthenticated,
    handleGoogleLogin,
    handleChangeAccount,
    handleLogout,
    getAuthToken,
    authenticatedApiCall,
    checkUserExists,
    // Funciones de debug y utilidades
    debugCookieState,
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
