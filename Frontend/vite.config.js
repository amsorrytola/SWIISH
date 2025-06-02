import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      '@walletconnect/sign-client', 
      '@walletconnect/modal', 
      '@walletconnect/utils',
      '@walletconnect/types'
    ]
  },
  server: {
    host: true,
    port: 5173,
    cors: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '.ngrok.io',
      '.ngrok-free.app',
      '0b41-119-252-195-223.ngrok-free.app'
    ]
  },
  preview: {
    host: true,
    port: 5173,
    cors: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '.ngrok.io',
      '.ngrok-free.app',
      '0b41-119-252-195-223.ngrok-free.app'
    ]
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          walletconnect: ['@walletconnect/sign-client', '@walletconnect/modal']
        }
      }
    }
  }
})
