import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Las peticiones que empiecen por /auth se reenvían al backend de Spring Boot
      '/auth': 'http://localhost:8080',
    },
  },
})