import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  plugins: [react(), mkcert()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    exclude: ['gifski-wasm']
  },
  server: {
    https: true
  }
});
