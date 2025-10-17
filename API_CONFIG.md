# Configuración de API - SYNCO

## 🚀 Entornos de Despliegue

### Desarrollo Local
- **API URL**: `http://localhost:8000`
- **Proxy**: Configurado en `vite.config.js` para redirigir `/api/*` a `localhost:8000`
- **Configuración**: Automática via `src/config/api.js`

### Producción (Vercel)
- **API URL Primaria**: `https://api.pasesfalsos.cl` (dominio personalizado)
- **API URL Fallback**: `https://synco-api.vercel.app` (dominio de Vercel)
- **Configuración**: Automática con fallback via `src/config/api.js`
- **Características**: 
  - Detección automática de disponibilidad del dominio primario
  - Fallback automático al dominio de Vercel si el primario no está disponible
  - Retry automático en caso de fallos

## 🔧 Cómo Funciona

### 1. Configuración Automática con Fallback
El archivo `src/config/api.js` detecta automáticamente el entorno y maneja múltiples dominios:
```javascript
const API_DOMAINS = {
  PRIMARY: 'https://api.pasesfalsos.cl',
  FALLBACK: 'https://synco-api.vercel.app'
}

const getApiBaseUrl = async () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:8000'  // Desarrollo
  }
  
  // En producción, intentar primero el dominio personalizado
  const isPrimaryAvailable = await checkDomainAvailability(API_DOMAINS.PRIMARY)
  if (isPrimaryAvailable) {
    return API_DOMAINS.PRIMARY
  }
  
  // Si no está disponible, usar el fallback
  return API_DOMAINS.FALLBACK
}
```

### 2. Proxy de Desarrollo
En desarrollo local, Vite redirige las llamadas `/api/*` a `localhost:8000`:
```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

### 3. Uso en Componentes
```javascript
import { buildApiUrl, apiCall, API_ENDPOINTS } from '../config/api';

// Construir URL automáticamente
const apiUrl = buildApiUrl(API_ENDPOINTS.EVENTOS(calendarId));

// Hacer llamadas con retry automático
const response = await apiCall(API_ENDPOINTS.EVENTOS(calendarId), {
  method: 'GET'
});
```

### 4. Inicialización de la API
La aplicación inicializa automáticamente la configuración de la API al cargar:
```javascript
// En App.jsx
useEffect(() => {
  initializeApiUrl().catch(error => {
    console.error('Error inicializando API:', error);
  });
}, []);
```

## 📋 Endpoints Disponibles

- **Eventos**: `/eventos/{calendarId}`
- **Items**: `/items`

## 🐛 Debugging

### Desarrollo
```bash
npm run dev
# Verás en consola: 🔗 API configurada para: http://localhost:8000
# Verás en consola: 🔄 Proxy de desarrollo configurado para: http://localhost:8000
```

### Producción
```bash
npm run build && npm run preview
# Verás en consola: 🔗 API configurada para: https://synco-api.vercel.app
```

## ✅ Ventajas de esta Configuración

1. **Automática**: No necesitas cambiar código entre entornos
2. **Centralizada**: Toda la configuración de API en un solo lugar
3. **Type-safe**: Endpoints definidos como constantes
4. **Debugging**: Logs claros para identificar problemas
5. **Flexible**: Fácil agregar nuevos endpoints
6. **Resiliente**: Fallback automático entre dominios
7. **Retry**: Reintentos automáticos en caso de fallos
8. **Multi-dominio**: Soporte para dominios personalizados y de Vercel

## 🔄 Flujo de Fallback

1. **Inicio**: La aplicación intenta usar `https://api.pasesfalsos.cl`
2. **Verificación**: Se verifica la disponibilidad del dominio primario
3. **Fallback**: Si el primario no está disponible, usa `https://synco-api.vercel.app`
4. **Retry**: En caso de fallo en llamadas, intenta automáticamente con el dominio alternativo
5. **Logs**: Se registran todos los cambios de dominio para debugging
