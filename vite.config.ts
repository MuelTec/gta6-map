import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' permite hospedar em GitHub Pages em qualquer caminho (usuario.github.io/repo/)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
  },
});
