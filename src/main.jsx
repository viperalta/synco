import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css' // Removed default CSS to use Material-UI styling
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
