import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dotenv from 'dotenv'


dotenv.config()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5234', // Backend server URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
         
    }
  }
})
