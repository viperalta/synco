// Service Worker para manejar share target con archivos
const CACHE_NAME = 'synco-share-cache-v1';
const DB_NAME = 'synco-shared-files';
const DB_VERSION = 1;
const STORE_NAME = 'files';

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

// Abrir IndexedDB
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Guardar archivo en IndexedDB
async function saveFileToIndexedDB(file, fileId) {
  try {
    const db = await openDB();
    const arrayBuffer = await file.arrayBuffer();
    
    const fileData = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      data: arrayBuffer
    };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(fileData);
      
      request.onsuccess = () => {
        console.log('Archivo guardado en IndexedDB:', fileId);
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error guardando archivo en IndexedDB:', error);
    throw error;
  }
}

// Manejar share target requests
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST' && event.request.url.includes('/share-target')) {
    event.respondWith(
      handleShareTarget(event.request)
    );
  } else {
    // Solo interceptar requests importantes para share target
    // Dejar que el navegador maneje el resto normalmente
    if (event.request.url.includes('/share-target')) {
      event.respondWith(fetch(event.request));
    }
    // Para otros requests, no hacer nada (no interceptar)
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

    // Generar ID único para el archivo
    const fileId = `shared-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Preparar datos para enviar al cliente
    const shareData = {
      title,
      text,
      url,
      fileId: file ? fileId : null,
      file: file ? {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      } : null
    };

    // Si hay archivo, guardarlo en IndexedDB
    if (file) {
      try {
        await saveFileToIndexedDB(file, fileId);
        console.log('Archivo guardado exitosamente en IndexedDB');
      } catch (error) {
        console.error('Error guardando archivo:', error);
        // Continuar aunque falle el guardado
      }
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
      params.set('fileId', fileId);
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
