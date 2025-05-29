import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  server: {
    fs: {
      strict: false,
    },
  },
});
