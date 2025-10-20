import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'utils': [
            './src/utils/api.ts',
            './src/utils/storage.ts',
            './src/utils/prompts.ts'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})



