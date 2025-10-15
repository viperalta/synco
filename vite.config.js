import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    historyApiFallback: true,
    // Proxy solo para desarrollo local
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // Solo para desarrollo
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          console.log('🔄 Proxy de desarrollo configurado para: http://localhost:8000')
        }
      }
    }
  },
})
