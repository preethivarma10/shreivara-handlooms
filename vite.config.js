import { resolve } from 'path';
import fs, { copyFileSync, existsSync } from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const target = process.env.VITE_APP_TARGET; // 'storefront' | 'admin' | undefined

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-products-dev-server',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url.startsWith('/api/products')) {
            return next();
          }

          const catalogPath = resolve(import.meta.dirname, 'src', 'data', 'catalog.json');
          const getCatalog = () => {
            if (existsSync(catalogPath)) {
              try {
                return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
              } catch (_) {}
            }
            return [];
          };

          const saveCatalog = (data) => {
            fs.writeFileSync(catalogPath, JSON.stringify(data, null, 2), 'utf8');
          };

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');

          if (req.method === 'GET') {
            const list = getCatalog();
            res.statusCode = 200;
            return res.end(JSON.stringify(list));
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const newProduct = JSON.parse(body);
                const current = getCatalog();
                const updated = [newProduct, ...current.filter((p) => p.sku !== newProduct.sku)];
                saveCatalog(updated);
                res.statusCode = 201;
                return res.end(JSON.stringify({ success: true, product: newProduct }));
              } catch (err) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }

          if (req.method === 'DELETE') {
            const urlObj = new URL(req.url, 'http://localhost');
            const sku = urlObj.searchParams.get('sku');
            if (sku) {
              const current = getCatalog();
              saveCatalog(current.filter((p) => p.sku !== sku));
            }
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true }));
          }

          next();
        });
      }
    },
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