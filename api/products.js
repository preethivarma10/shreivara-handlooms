import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Memory fallback cache across warm serverless invocations
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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabaseClient();

  // ── GET: Fetch Products ──
  if (req.method === 'GET') {
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
          return res.status(200).json(normalized);
        }
      } catch (err) {
        console.warn('Supabase fetch failed in API:', err);
      }
    }

    // Fallback to local catalog
    const local = getLocalCatalog();
    return res.status(200).json(local);
  }

  // ── POST: Add New Product ──
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || !body.sku || !body.name) {
      return res.status(400).json({ error: 'Missing required fields: sku and name' });
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

    // If Supabase is connected, write to Supabase
    if (supabase) {
      try {
        const { error: sbError } = await supabase.from('products').insert([{
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
        if (sbError) console.warn('Supabase insert notice in API:', sbError.message);
      } catch (err) {
        console.warn('Supabase insert error in API:', err);
      }
    }

    const current = getLocalCatalog();
    const updated = [newProduct, ...current.filter((p) => p.sku !== newProduct.sku)];
    saveLocalCatalog(updated);

    return res.status(201).json({ success: true, product: newProduct });
  }

  // ── DELETE: Remove Product ──
  if (req.method === 'DELETE') {
    const { sku } = req.query || (typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {});
    if (!sku) return res.status(400).json({ error: 'Missing sku' });

    if (supabase) {
      try {
        await supabase.from('products').delete().eq('sku', sku);
      } catch (_) {}
    }

    const current = getLocalCatalog();
    const updated = current.filter((p) => p.sku !== sku);
    saveLocalCatalog(updated);

    return res.status(200).json({ success: true, sku });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
