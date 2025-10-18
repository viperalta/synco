# 🔧 Configuración de Google OAuth2 - Instrucciones

## ❌ **Problema Actual:**
Google Identity Services no se está cargando correctamente porque faltan las variables de entorno.

## ✅ **Solución:**

### **Paso 1: Crear archivo .env**
Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Configuración de Google OAuth2
VITE_GOOGLE_CLIENT_ID=tu_client_id_real_aqui
VITE_GOOGLE_CLIENT_SECRET=tu_client_secret_real_aqui

# URL de la API (opcional)
VITE_API_BASE_URL=http://localhost:8000
```

### **Paso 2: Obtener credenciales de Google**

1. **Ve a Google Cloud Console**: https://console.cloud.google.com/
2. **Selecciona tu proyecto** o crea uno nuevo
3. **Ve a "APIs & Services" > "Credentials"**
4. **Crea credenciales OAuth 2.0 Client ID**:
   - **Application type**: Web application
   - **Name**: SYNCO - Pases Falsos
   - **Authorized redirect URIs**: 
     - `http://localhost:5173/auth/callback` (desarrollo)
     - `https://tu-dominio.com/auth/callback` (producción)

5. **Copia el Client ID y Client Secret**

### **Paso 3: Actualizar .env**
Reemplaza `tu_client_id_real_aqui` y `tu_client_secret_real_aqui` con tus credenciales reales:

```env
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```

### **Paso 4: Reiniciar la aplicación**
```bash
# Detener la aplicación (Ctrl+C)
# Luego ejecutar nuevamente
npm run dev
```

## 🔍 **Verificación:**

1. **Abre la página de login**
2. **Mira el panel de debug** (solo en desarrollo)
3. **Verifica que todos los indicadores estén en verde**:
   - ✅ Google Loaded: true
   - ✅ Silent Auth Ready: true
   - ✅ window.google: true
   - ✅ google.accounts: true

## 🚨 **Problemas Comunes:**

### **"VITE_GOOGLE_CLIENT_ID no está configurado"**
- **Solución**: Crea el archivo `.env` con tu Client ID real

### **"Google Identity Services no está disponible"**
- **Solución**: Verifica que el Client ID sea correcto y que la aplicación esté en la lista de dominios autorizados

### **"window.google existe pero no tiene la propiedad 'accounts'"**
- **Solución**: El script de Google no se cargó completamente, reinicia la aplicación

## 📱 **Después de la configuración:**

Una vez configurado correctamente, tendrás:
- ✅ **Autenticación silenciosa** para usuarios registrados
- ✅ **Flujo OAuth tradicional** como fallback
- ✅ **Sesiones largas** con refresh tokens
- ✅ **Experiencia de usuario mejorada**

## 🔒 **Seguridad:**

- **Nunca** subas el archivo `.env` a Git
- **Usa** credenciales diferentes para desarrollo y producción
- **Rota** las credenciales periódicamente
