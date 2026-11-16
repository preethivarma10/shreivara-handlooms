import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════
// Supabase Cloud Configuration
//
// Default Project URL: https://galouvizafkfuhjhfhsb.supabase.co
// Priority Order:
// 1. Vite environment variables (import.meta.env.VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
// 2. Custom manual runtime override stored in localStorage (if valid)
// 3. Hardcoded default Project URL: https://galouvizafkfuhjhfhsb.supabase.co
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_SUPABASE_URL = 'https://galouvizafkfuhjhfhsb.supabase.co';

/**
 * Strips trailing slashes and any trailing /rest/v1/ or /rest/v1
 * so Supabase client connection requests never fail with 404s.
 */
export function cleanSupabaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1\/?$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL
  ? cleanSupabaseUrl(String(import.meta.env.VITE_SUPABASE_URL))
  : (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)
      ? cleanSupabaseUrl(String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL))
      : '');

const localUrl = typeof window !== 'undefined' && window.localStorage
  ? cleanSupabaseUrl(window.localStorage.getItem('shreivara_supabase_url') || '')
  : '';

// Project URL Resolution:
// Prefer import.meta.env.VITE_SUPABASE_URL or valid localStorage override, falling back directly to DEFAULT_SUPABASE_URL
const resolvedUrl = cleanSupabaseUrl(
  (envUrl && !envUrl.includes('your-project-id') && !envUrl.includes('YOUR_SUPABASE') ? envUrl : '') ||
  (localUrl && !localUrl.includes('your-project-id') && !localUrl.includes('YOUR_SUPABASE') ? localUrl : '') ||
  DEFAULT_SUPABASE_URL
);

export const SUPABASE_URL = resolvedUrl;

// Anon Key Resolution:
// Prefer import.meta.env.VITE_SUPABASE_ANON_KEY, or valid key in localStorage (e.g. starting with eyJ...)
const envKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY
  ? String(import.meta.env.VITE_SUPABASE_ANON_KEY).trim()
  : (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY)
      ? String(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY).trim()
      : '');

const localKey = typeof window !== 'undefined' && window.localStorage
  ? (window.localStorage.getItem('shreivara_supabase_anon_key') || '').trim()
  : '';

export const SUPABASE_ANON_KEY = (
  (envKey && !envKey.includes('your-supabase-anon-key') && !envKey.includes('YOUR_SUPABASE') ? envKey : '') ||
  (localKey && !localKey.includes('your-supabase-anon-key') && !localKey.includes('YOUR_SUPABASE') ? localKey : '') ||
  ''
);

export const hasManualSupabaseOverride = Boolean(localUrl || localKey);

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('YOUR_SUPABASE') &&
  !SUPABASE_URL.includes('your-project-id') &&
  !SUPABASE_URL.includes('shreivara-placeholder') &&
  !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE') &&
  !SUPABASE_ANON_KEY.includes('your-supabase-anon-key') &&
  !SUPABASE_ANON_KEY.includes('dummy')
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createClient(
      DEFAULT_SUPABASE_URL,
      SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'
    );

/**
 * Fetch products from Supabase 'products' table.
 * If onlyAvailable is true, fetches only items where available === true.
 * Returns null if Supabase is not configured or on failure.
 */
export async function fetchProductsFromSupabase({ onlyAvailable = false } = {}) {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    let query = supabase.from('products').select('*');
    if (onlyAvailable) {
      query = query.eq('available', true);
    }
    let res = await query.order('created_at', { ascending: false });

    // Fallback: If table has no created_at column, retry without ordering
    if (res.error) {
      let retryQuery = supabase.from('products').select('*');
      if (onlyAvailable) {
        retryQuery = retryQuery.eq('available', true);
      }
      const retry = await retryQuery;
      if (!retry.error) {
        res = retry;
      } else {
        // Fallback: if available column does not exist
        const simple = await supabase.from('products').select('*');
        if (!simple.error) {
          res = {
            data: onlyAvailable ? (simple.data || []).filter((item) => item.available !== false) : simple.data,
            error: null
          };
        } else {
          console.warn('Supabase fetch products error:', res.error.message);
          return null;
        }
      }
    }

    const data = res.data;
    if (Array.isArray(data) && data.length > 0) {
      // Normalize field names across various schema definitions (snake_case or camelCase)
      return data.map((item, idx) => {
        const sellingPrice = Number(item.selling_price ?? item.sellingPrice ?? item.price ?? 3999);
        const originalPrice = Number(
          item.original_price ??
          item.originalPrice ??
          item.mrp ??
          item.price ??
          (sellingPrice > 0 ? Math.round(sellingPrice * 1.25) : 4999)
        );
        const unparsedImage = item.image_url || item.images || item.image || item.imageUrl || item.photo || '';
        const rawImage = Array.isArray(unparsedImage) ? unparsedImage[0] : unparsedImage;
        const description = item.description || item.offer_details || item.offerDetails || '';

        return {
          ...item,
          id: item.id || `prod-${idx}`,
          sku: String(item.sku || item.id || `SHR-${String(idx + 1).padStart(3, '0')}`),
          name: item.name || item.title || 'Handloom Piece',
          category: item.category || 'Kanchi Pattu',
          sellingPrice,
          originalPrice: originalPrice || sellingPrice,
          price: item.price ?? sellingPrice,
          description,
          offerDetails: item.offer_details || item.offerDetails || '',
          image: rawImage || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
          imageUrl: rawImage,
          image_url: item.image_url || rawImage,
          images: item.images || rawImage,
          stock: Number(item.stock ?? 5),
          sizes: item.sizes ?? '',
          available: item.available !== false,
        };
      });
    }
    return data;
  } catch (err) {
    console.warn('Error fetching from Supabase:', err);
    return null;
  }
}

/**
 * Insert a product directly into Supabase 'products' table:
 * (sku, name, category, original_price, selling_price, stock, sizes, offer_details, image, available)
 */
export async function insertProductToSupabase(productData) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Supabase is not configured.') };
  try {
    const payload = {
      sku: productData.sku,
      name: productData.name,
      category: productData.category,
      original_price: Number(productData.originalPrice ?? productData.original_price ?? 0),
      selling_price: Number(productData.sellingPrice ?? productData.selling_price ?? 0),
      stock: Number(productData.stock ?? 5),
      sizes: productData.sizes || '',
      offer_details: productData.offerDetails || productData.offer_details || '',
      image: productData.image || productData.image_url || '',
      images: Array.isArray(productData.imagesList)
        ? JSON.stringify(productData.imagesList)
        : (productData.images || productData.image || ''),
      available: productData.available !== false,
    };

    let { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select();

    // Fallback: If 'images' column does not exist yet, strip it and retry
    if (error && error.message && error.message.includes("'images'")) {
      const { images: _drop, ...payloadNoImages } = payload;
      const retry2 = await supabase.from('products').insert([payloadNoImages]).select();
      if (!retry2.error) { data = retry2.data; error = null; }
    }

    // Fallback: If table column schema differs (e.g. image_url / description / price)
    if (error && (error.message.includes('image') || error.message.includes('column'))) {
      const altPayload = {
        sku: productData.sku,
        name: productData.name,
        category: productData.category,
        price: Number(productData.sellingPrice ?? productData.selling_price ?? 0),
        original_price: Number(productData.originalPrice ?? productData.original_price ?? 0),
        selling_price: Number(productData.sellingPrice ?? productData.selling_price ?? 0),
        stock: Number(productData.stock ?? 5),
        sizes: productData.sizes || '',
        description: productData.offerDetails || productData.offer_details || '',
        offer_details: productData.offerDetails || productData.offer_details || '',
        image_url: productData.image || productData.image_url || '',
        image: productData.image || productData.image_url || '',
        available: productData.available !== false,
      };
      const altResult = await supabase.from('products').insert([altPayload]).select();
      if (!altResult.error) {
        data = altResult.data;
        error = null;
      }
    }

    return { data, error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Direct handler: handleAddProduct
 */
export async function handleAddProduct(productData) {
  if (!supabase || !isSupabaseConfigured) {
    alert("Supabase is not configured yet. Please set your Supabase URL and Anon Key in .env or via the Admin Dashboard.");
    return { error: new Error('Supabase is not configured') };
  }

  const { data, error } = await insertProductToSupabase(productData);

  if (!error) {
    alert("Product added to storefront successfully!");
  } else {
    alert("Error adding product to Supabase: " + error.message);
  }

  return { data, error };
}

/**
 * Update an existing product in Supabase 'products' table.
 */
export async function updateProductInSupabase(sku, productData) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Supabase is not configured.') };
  try {
    const payload = {
      name: productData.name,
      category: productData.category,
      original_price: Number(productData.originalPrice ?? productData.original_price ?? 0),
      selling_price: Number(productData.sellingPrice ?? productData.selling_price ?? 0),
      stock: Number(productData.stock ?? 5),
      sizes: productData.sizes || '',
      offer_details: productData.offerDetails || productData.offer_details || '',
      available: productData.available !== false,
      ...(productData.image ? { image: productData.image } : {}),
      ...(productData.imagesList || productData.images ? {
        images: Array.isArray(productData.imagesList)
          ? JSON.stringify(productData.imagesList)
          : (productData.images || '')
      } : {}),
    };

    let { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('sku', sku)
      .select();

    if (error && (error.message.includes('image') || error.message.includes('column'))) {
      const altPayload = {
        name: productData.name,
        category: productData.category,
        price: Number(productData.sellingPrice ?? productData.selling_price ?? 0),
        original_price: Number(productData.originalPrice ?? productData.original_price ?? 0),
        selling_price: Number(productData.sellingPrice ?? productData.selling_price ?? 0),
        stock: Number(productData.stock ?? 5),
        sizes: productData.sizes || '',
        description: productData.offerDetails || productData.offer_details || '',
        offer_details: productData.offerDetails || productData.offer_details || '',
        available: productData.available !== false,
        ...(productData.image ? { image_url: productData.image, image: productData.image } : {}),
      };
      const altResult = await supabase.from('products').update(altPayload).eq('sku', sku).select();
      if (!altResult.error) {
        data = altResult.data;
        error = null;
      }
    }

    return { data, error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Delete a product from Supabase by SKU.
 */
export async function deleteProductFromSupabase(sku) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Supabase is not configured.') };
  try {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('sku', sku);

    return { data, error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Toggle product availability in Supabase.
 */
export async function toggleProductAvailabilityInSupabase(sku, available) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Supabase is not configured.') };
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ available })
      .eq('sku', sku);

    return { data, error };
  } catch (err) {
    return { error: err };
  }
}

export default supabase;
