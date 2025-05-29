import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'e76d-45-251-49-135.ngrok-free.app'
    ],
  },
});
