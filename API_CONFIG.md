# Configuración de API - SYNCO

## 🚀 Entornos de Despliegue

### Desarrollo Local
- **API URL**: `http://localhost:8000`
- **Proxy**: Configurado en `vite.config.js` para redirigir `/api/*` a `localhost:8000`
- **Configuración**: Automática via `src/config/api.js`

### Producción (Vercel)
- **API URL**: `https://synco-api.vercel.app`
- **Sin Proxy**: Llamadas directas a la API de Vercel
- **Configuración**: Automática via `src/config/api.js`

## 🔧 Cómo Funciona

### 1. Configuración Automática
El archivo `src/config/api.js` detecta automáticamente el entorno:
```javascript
const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:8000'  // Desarrollo
  }
  return 'https://synco-api.vercel.app'  // Producción
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
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

// Construir URL automáticamente
const apiUrl = buildApiUrl(API_ENDPOINTS.EVENTOS(calendarId));
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
