import { resolve } from 'path';
import { copyFileSync, existsSync } from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const target = process.env.VITE_APP_TARGET; // 'storefront' | 'admin' | undefined

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'admin-build-organizer',
      closeBundle() {
        if (target === 'admin') {
          const distDir = resolve(import.meta.dirname, 'dist');
          const adminHtml = resolve(distDir, 'admin.html');
          const indexHtml = resolve(distDir, 'index.html');
          if (existsSync(adminHtml)) {
            copyFileSync(adminHtml, indexHtml);
          }
        }
      }
    }
  ],
  build: {
    rollupOptions: {
      input:
        target === 'admin'
          ? { admin: resolve(import.meta.dirname, 'admin.html') }
          : target === 'storefront'
            ? { main: resolve(import.meta.dirname, 'index.html') }
            : {
                main: resolve(import.meta.dirname, 'index.html'),
                admin: resolve(import.meta.dirname, 'admin.html')
              }
    }
  }
});