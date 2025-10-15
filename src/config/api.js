// Configuración de la API
const getApiBaseUrl = () => {
  // En desarrollo, usar localhost:8000
  if (import.meta.env.DEV) {
    return 'http://localhost:8000'
  }
  
  // En producción, usar la API de Vercel
  return 'https://synco-api.vercel.app'
}

// URL base de la API
export const API_BASE_URL = getApiBaseUrl()

// Endpoints específicos
export const API_ENDPOINTS = {
  EVENTOS: (calendarId) => `/eventos/${calendarId}`,
  ITEMS: '/items'
}

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`
}

// Log de configuración (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log(`🔗 API configurada para: ${API_BASE_URL}`)
}
