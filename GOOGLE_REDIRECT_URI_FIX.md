# 🔧 Solución: Error redirect_uri_mismatch

## ❌ **Problema:**
```
Error 400: redirect_uri_mismatch
You can't sign in because syncotest sent an invalid request.
```

## ✅ **Solución:**

### **Paso 1: Actualizar Google Cloud Console**

1. **Ve a Google Cloud Console**: https://console.cloud.google.com/
2. **Selecciona tu proyecto** (syncotest)
3. **Ve a "APIs & Services" > "Credentials"**
4. **Edita tu OAuth 2.0 Client ID**

### **Paso 2: Configurar URLs de redirección correctas**

**Authorized JavaScript origins:**
```
http://localhost:3003
https://pasesfalsos.cl
```

**Authorized redirect URIs:**
```
http://localhost:8000/auth/google/callback
https://api.pasesfalsos.cl/auth/google/callback
```

### **Paso 3: Verificar configuración del backend**

El backend debe estar configurado con estas variables de entorno:

```env
# Backend (.env)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
FRONTEND_URL=http://localhost:3003
```

### **Paso 4: Verificar que el backend esté funcionando**

Prueba estos endpoints:

```bash
# Verificar que el backend esté corriendo
curl http://localhost:8000/health

# Verificar endpoint de login
curl http://localhost:8000/auth/google/login
```

## 🔍 **Explicación del cambio:**

### **Antes (sistema anterior):**
- Frontend manejaba OAuth directamente
- Redirect URI: `http://localhost:3003/auth/callback`
- Google → Frontend → Backend

### **Ahora (nuevo sistema):**
- Backend maneja OAuth completamente
- Redirect URI: `http://localhost:8000/auth/google/callback`
- Google → Backend → Frontend

## 🚨 **Verificaciones importantes:**

1. **Backend corriendo**: Debe estar en `http://localhost:8000`
2. **Frontend corriendo**: Debe estar en `http://localhost:3003`
3. **Google Cloud Console**: URLs actualizadas correctamente
4. **Variables de entorno**: Backend configurado correctamente

## 📋 **Checklist de configuración:**

- [ ] Google Cloud Console actualizado con nuevas URLs
- [ ] Backend corriendo en puerto 8000
- [ ] Frontend corriendo en puerto 3003
- [ ] Variables de entorno del backend configuradas
- [ ] Probar login desde el frontend

## 🧪 **Prueba después de la configuración:**

1. **Abre el frontend**: `http://localhost:3003`
2. **Haz clic en "Continuar con Google"**
3. **Debería redirigir a**: `http://localhost:8000/auth/google/login`
4. **Google debería redirigir a**: `http://localhost:8000/auth/google/callback`
5. **Backend debería redirigir de vuelta a**: `http://localhost:3003`

Si sigues teniendo problemas, verifica que:
- El backend esté corriendo
- Las URLs en Google Cloud Console sean exactamente las mismas
- No haya espacios extra o caracteres especiales en las URLs
