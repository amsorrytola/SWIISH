import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@walletconnect/sign-client', '@walletconnect/modal', '@walletconnect/utils']
  },
  server: {
    host: true,
    port: 5173
  }
})
