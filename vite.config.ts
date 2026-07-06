import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Uganda National Bridge Management System — standalone deploy of the unified
// NRMS codebase mounting only the NBMS entry (src/nbms.tsx via index.html).
// Deployed to GitHub Pages at /uganda_nbms/.
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/uganda_nbms/' : '/',
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 5175, open: false },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-leaflet':  ['leaflet', 'react-leaflet'],
          'vendor-recharts': ['recharts'],
          'vendor-uuid':     ['uuid'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
});
