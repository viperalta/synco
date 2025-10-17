// Configuración de la API
const API_DOMAINS = {
  PRIMARY: 'https://api.pasesfalsos.cl',
  FALLBACK: 'https://synco-api.vercel.app'
}

// Función para verificar si un dominio está disponible
const checkDomainAvailability = async (url) => {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    })
    return true
  } catch (error) {
    return false
  }
}

// Función para obtener la URL base de la API con fallback
const getApiBaseUrl = async () => {
  // En desarrollo, usar localhost:8000
  if (import.meta.env.DEV) {
    return 'http://localhost:8000'
  }
  
  // En producción, intentar primero el dominio personalizado
  const isPrimaryAvailable = await checkDomainAvailability(API_DOMAINS.PRIMARY)
  if (isPrimaryAvailable) {
    return API_DOMAINS.PRIMARY
  }
  
  // Si no está disponible, usar el fallback
  return API_DOMAINS.FALLBACK
}

// URL base de la API (se inicializará dinámicamente)
let API_BASE_URL = null

// Función para inicializar la URL base
export const initializeApiUrl = async () => {
  if (!API_BASE_URL) {
    API_BASE_URL = await getApiBaseUrl()
    console.log(`🔗 API configurada para: ${API_BASE_URL}`)
  }
  return API_BASE_URL
}

// Función para obtener la URL base actual
export const getCurrentApiBaseUrl = () => {
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
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    
    if (!response.ok) {
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
