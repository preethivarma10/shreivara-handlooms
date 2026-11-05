import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

let memoryProducts = null;

function getSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (url && key && !url.includes('YOUR_SUPABASE') && !key.includes('YOUR_SUPABASE')) {
    try {
      return createClient(url, key);
    } catch (_) {}
  }
  return null;
}

function getLocalCatalog() {
  if (memoryProducts && Array.isArray(memoryProducts) && memoryProducts.length > 0) {
    return memoryProducts;
  }
  try {
    const catalogPath = path.join(process.cwd(), 'src', 'data', 'catalog.json');
    if (fs.existsSync(catalogPath)) {
      const raw = fs.readFileSync(catalogPath, 'utf8');
      memoryProducts = JSON.parse(raw);
      return memoryProducts;
    }
  } catch (_) {}
  return [];
}

function saveLocalCatalog(list) {
  memoryProducts = list;
  try {
    const catalogPath = path.join(process.cwd(), 'src', 'data', 'catalog.json');
    fs.writeFileSync(catalogPath, JSON.stringify(list, null, 2), 'utf8');
  } catch (_) {}
}

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const supabase = getSupabaseClient();

  if (event.httpMethod === 'GET') {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          const normalized = data.map((item, idx) => ({
            sku: String(item.sku || item.id || `SHR-${idx + 1}`),
            name: item.name || item.title || 'Handloom Piece',
            category: item.category || 'Kanchi Pattu',
            originalPrice: Number(item.original_price ?? item.originalPrice ?? item.mrp ?? item.price ?? 4999),
            sellingPrice: Number(item.selling_price ?? item.sellingPrice ?? item.price ?? 3999),
            stock: Number(item.stock ?? 5),
            sizes: item.sizes || '',
            offerDetails: item.offer_details ?? item.offerDetails ?? '',
            image: item.image || item.image_url || item.imageUrl || item.photo || '',
            available: item.available !== false,
          }));
          return { statusCode: 200, headers, body: JSON.stringify(normalized) };
        }
      } catch (err) {
        console.warn('Supabase fetch failed in Netlify function:', err);
      }
    }
    const local = getLocalCatalog();
    return { statusCode: 200, headers, body: JSON.stringify(local) };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      if (!body.sku || !body.name) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing sku or name' }) };
      }

      const newProduct = {
        sku: String(body.sku).trim(),
        name: String(body.name).trim(),
        category: String(body.category || 'Kanchi Pattu').trim(),
        originalPrice: Number(body.originalPrice || body.sellingPrice || 4999),
        sellingPrice: Number(body.sellingPrice || body.originalPrice || 3999),
        stock: Number(body.stock ?? 5),
        sizes: String(body.sizes || ''),
        offerDetails: String(body.offerDetails || ''),
        image: String(body.image || ''),
        available: body.available !== false,
      };

      if (supabase) {
        try {
          await supabase.from('products').insert([{
            sku: newProduct.sku,
            name: newProduct.name,
            category: newProduct.category,
            original_price: newProduct.originalPrice,
            selling_price: newProduct.sellingPrice,
            stock: newProduct.stock,
            sizes: newProduct.sizes,
            offer_details: newProduct.offerDetails,
            image: newProduct.image,
            available: newProduct.available,
          }]);
        } catch (_) {}
      }

      const current = getLocalCatalog();
      const updated = [newProduct, ...current.filter((p) => p.sku !== newProduct.sku)];
      saveLocalCatalog(updated);

      return { statusCode: 201, headers, body: JSON.stringify({ success: true, product: newProduct }) };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
}
