import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks cache well between deploys. The book catalog is its own lazy chunk
        // (src/data/catalog.ts), so it never blocks the first paint.
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['motion'],
        },
      },
    },
    // the catalog chunk is intentionally large (about 3.5 MB, ~0.7 MB gzipped) and loaded on demand
    chunkSizeWarningLimit: 4000,
  },
});
