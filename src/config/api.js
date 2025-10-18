// Configuración de la API
const API_DOMAINS = {
  PRIMARY: 'https://api.pasesfalsos.cl',
  FALLBACK: 'https://synco-api.vercel.app'
}

// Función para verificar si un dominio está disponible
const checkDomainAvailability = async (url) => {
  try {
    // Crear un AbortController para el timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // Timeout de 5 segundos
    
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      cache: 'no-cache',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.warn(`⚠️ Dominio no disponible: ${url}`, error.message)
    return false
  }
}

// Función para obtener la URL base de la API con fallback
const getApiBaseUrl = async () => {
  // En desarrollo, SIEMPRE usar localhost:8000
  if (import.meta.env.DEV) {
    console.log('🔧 Modo desarrollo: usando localhost:8000')
    return 'http://localhost:8000'
  }
  
  // En producción, intentar primero el dominio personalizado
  console.log('🚀 Modo producción: verificando dominios...')
  const isPrimaryAvailable = await checkDomainAvailability(API_DOMAINS.PRIMARY)
  if (isPrimaryAvailable) {
    console.log(`✅ Usando dominio primario: ${API_DOMAINS.PRIMARY}`)
    return API_DOMAINS.PRIMARY
  }
  
  // Si no está disponible, usar el fallback
  console.log(`🔄 Usando dominio fallback: ${API_DOMAINS.FALLBACK}`)
  return API_DOMAINS.FALLBACK
}

// URL base de la API (se inicializará dinámicamente)
let API_BASE_URL = null

// Función para inicializar la URL base
export const initializeApiUrl = async () => {
  if (!API_BASE_URL) {
    // En desarrollo, usar directamente localhost sin verificación asíncrona
    if (import.meta.env.DEV) {
      API_BASE_URL = 'http://localhost:8000'
      console.log(`🔧 API configurada para desarrollo: ${API_BASE_URL}`)
    } else {
      // En producción, hacer la verificación asíncrona
      API_BASE_URL = await getApiBaseUrl()
      console.log(`🔗 API configurada para producción: ${API_BASE_URL}`)
    }
  }
  return API_BASE_URL
}

// Función para obtener la URL base actual
export const getCurrentApiBaseUrl = () => {
  // En desarrollo, siempre devolver localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:8000'
  }
  
  // En producción, usar la URL inicializada o el fallback
  return API_BASE_URL || API_DOMAINS.FALLBACK
}

// Endpoints específicos
export const API_ENDPOINTS = {
  EVENTOS: (calendarId) => `/eventos/${calendarId}`,
  ITEMS: '/items'
}

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint) => {
  const baseUrl = getCurrentApiBaseUrl()
  return `${baseUrl}${endpoint}`
}

// Función para hacer llamadas a la API con retry automático
export const apiCall = async (endpoint, options = {}) => {
  const baseUrl = getCurrentApiBaseUrl()
  const url = `${baseUrl}${endpoint}`
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Importante para enviar cookies en todas las llamadas
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    
    if (!response.ok) {
      // Para errores 401, crear un error más específico
      if (response.status === 401) {
        const error = new Error(`HTTP error! status: ${response.status}`)
        error.status = 401
        throw error
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response
  } catch (error) {
    // Si falla y estamos usando el dominio primario, intentar con el fallback
    if (baseUrl === API_DOMAINS.PRIMARY) {
      console.warn(`⚠️ Fallo con dominio primario, intentando con fallback: ${error.message}`)
      const fallbackUrl = `${API_DOMAINS.FALLBACK}${endpoint}`
      
      try {
        const fallbackResponse = await fetch(fallbackUrl, {
          ...options,
          credentials: 'include', // Importante para enviar cookies en fallback también
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        })
        
        if (!fallbackResponse.ok) {
          throw new Error(`HTTP error! status: ${fallbackResponse.status}`)
        }
        
        console.log(`✅ Fallback exitoso usando: ${API_DOMAINS.FALLBACK}`)
        return fallbackResponse
      } catch (fallbackError) {
        console.error(`❌ Fallo también con dominio fallback: ${fallbackError.message}`)
        throw fallbackError
      }
    }
    
    throw error
  }
}

// Log de configuración (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log(`🔗 API configurada para: ${getCurrentApiBaseUrl()}`)
}
