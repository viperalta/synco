# 🔧 Solución para Error 400 - Access Token

## ❌ **Error Actual:**
```
Error al obtener access token: 400
```

## 🔍 **Causas Posibles:**

### **1. Client Secret no configurado**
- **Problema**: `VITE_GOOGLE_CLIENT_SECRET` no está en el archivo `.env`
- **Solución**: Agregar el Client Secret al archivo `.env`

### **2. Client ID incorrecto**
- **Problema**: El Client ID no coincide con el de Google Cloud Console
- **Solución**: Verificar que el Client ID sea correcto

### **3. Redirect URI no coincide**
- **Problema**: La redirect URI no está autorizada en Google Cloud Console
- **Solución**: Agregar `http://localhost:5173/auth/callback` a las URIs autorizadas

### **4. Código de autorización expirado**
- **Problema**: El código de Google expiró (válido por 10 minutos)
- **Solución**: Intentar el login nuevamente

## ✅ **Solución Paso a Paso:**

### **Paso 1: Verificar archivo .env**
Crea o actualiza el archivo `.env` en la raíz del proyecto:

```env
VITE_GOOGLE_CLIENT_ID=tu_client_id_real_aqui
VITE_GOOGLE_CLIENT_SECRET=tu_client_secret_real_aqui
```

### **Paso 2: Obtener Client Secret**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **"APIs & Services" > "Credentials"**
4. Haz clic en tu **OAuth 2.0 Client ID**
5. **Copia el Client Secret** (no el Client ID)

### **Paso 3: Verificar Redirect URIs**
En Google Cloud Console, asegúrate de tener:
- **Authorized JavaScript origins**: `http://localhost:5173`
- **Authorized redirect URIs**: `http://localhost:5173/auth/callback`

### **Paso 4: Reiniciar la aplicación**
```bash
# Detener la aplicación (Ctrl+C)
# Luego ejecutar nuevamente
npm run dev
```

## 🧪 **Verificación:**

1. **Abre la consola del navegador** (F12)
2. **Haz clic en "Continuar con Google"**
3. **Mira los logs** en la consola:
   - Debería mostrar: `✅ Access token obtenido exitosamente`
   - Si hay error, mostrará detalles específicos

## 🚨 **Errores Comunes:**

### **"Google OAuth no está configurado"**
- **Solución**: Configura las variables de entorno

### **"invalid_client"**
- **Solución**: Verifica que el Client ID y Client Secret sean correctos

### **"redirect_uri_mismatch"**
- **Solución**: Agrega la redirect URI correcta en Google Cloud Console

### **"invalid_grant"**
- **Solución**: El código expiró, intenta el login nuevamente

## 📝 **Logs de Debug:**

La función ahora mostrará logs detallados:
- ✅ **Parámetros enviados** a Google
- ✅ **Status de la respuesta**
- ✅ **Headers de la respuesta**
- ✅ **Detalles del error** si falla

Esto te ayudará a identificar exactamente qué está causando el error 400.
