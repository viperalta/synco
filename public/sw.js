// Service Worker para manejar share target con archivos
const CACHE_NAME = 'synco-share-cache-v1';

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

// Activar service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(self.clients.claim());
});

// Manejar share target requests
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST' && event.request.url.includes('/share-target')) {
    event.respondWith(
      handleShareTarget(event.request)
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});

// Manejar datos compartidos
async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title') || '';
    const text = formData.get('text') || '';
    const url = formData.get('url') || '';

    console.log('Share target recibido:', { title, text, url, hasFile: !!file });

    // Preparar datos para enviar al cliente
    const shareData = {
      title,
      text,
      url,
      file: file ? {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      } : null
    };

    // Si hay archivo, procesarlo
    if (file) {
      const fileData = await processFile(file);
      shareData.previewUrl = fileData.previewUrl;
    }

    // Guardar datos en sessionStorage usando postMessage
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      // Enviar datos al cliente principal
      clients[0].postMessage({
        type: 'SHARE_DATA_RECEIVED',
        data: shareData
      });
    }

    // Redirigir a la página share-target con parámetros
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (text) params.set('text', text);
    if (url) params.set('url', url);
    if (file) {
      params.set('fileName', file.name);
      params.set('fileType', file.type);
      params.set('fileSize', file.size);
    }
    
    const redirectUrl = `/share-target?${params.toString()}`;
    console.log('Redirigiendo a:', redirectUrl);
    
    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    console.error('Error procesando share target:', error);
    return Response.redirect('/share-target?error=1', 302);
  }
}

// Procesar archivo para obtener datos adicionales
async function processFile(file) {
  const fileData = {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified
  };

  // Si es una imagen, crear URL para preview
  if (file.type.startsWith('image/')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      const url = URL.createObjectURL(blob);
      fileData.previewUrl = url;
    } catch (error) {
      console.error('Error creando preview de imagen:', error);
    }
  }

  return fileData;
}
