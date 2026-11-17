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
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbG91dml6YWZrZnVoamhmaHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1NTM4NjYsImV4cCI6MjExMDEyOTg2Nn0.BkAsiHvXVZN6cAeFMk0Q5T3mbn0CbZHQo5WImFEJFeo';

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
  DEFAULT_SUPABASE_ANON_KEY
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
        // Multi-image parsing: handles both 'images' array and 'image' (single string or JSON array string)
        const parseImagesValue = (val) => {
          if (!val) return [];
          if (Array.isArray(val)) {
            const out = [];
            for (const el of val) {
              if (!el) continue;
              const s = String(el).trim();
              if (s.startsWith('[')) {
                try {
                  const parsed = JSON.parse(s);
                  if (Array.isArray(parsed)) {
                    out.push(...parsed.map(String).map((x) => x.trim()).filter(Boolean));
                    continue;
                  }
                } catch (_) {}
              }
              if (s) out.push(s);
            }
            return out;
          }
          if (typeof val === 'string' && val.trim()) {
            const trimmed = val.trim();
            if (trimmed.startsWith('[')) {
              try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed.map(String).map((x) => x.trim()).filter(Boolean);
              } catch (_) {}
            }
            return [trimmed];
          }
          return [];
        };

        let productImages = parseImagesValue(item.images);
        if (productImages.length === 0) productImages = parseImagesValue(item.imagesList);
        if (productImages.length === 0) productImages = parseImagesValue(item.image);
        if (productImages.length === 0) productImages = parseImagesValue(item.image_url);
        if (productImages.length === 0) productImages = parseImagesValue(item.imageUrl);
        if (productImages.length === 0) {
          productImages = ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'];
        }

        const rawImage = productImages[0];
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
          image: rawImage,
          imageUrl: rawImage,
          image_url: rawImage,
          images: productImages,
          imagesList: productImages,
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
 * Sends BOTH 'images' (clean string array) and 'image' (primary image URL)
 * with automatic fallback if the 'images' column does not exist yet.
 */
export async function insertProductToSupabase(productData) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Supabase is not configured.') };
  try {
    const rawImages = productData.images || productData.imagesList || [];
    const cleanImages = (Array.isArray(rawImages)
      ? rawImages
      : (typeof rawImages === 'string' && rawImages.trim().startsWith('[')
          ? (() => { try { const p = JSON.parse(rawImages); return Array.isArray(p) ? p : []; } catch { return []; } })()
          : [productData.image || rawImages]
        )
    ).map(String).map((s) => s.trim()).filter(Boolean);

    const primaryImage = cleanImages[0] || productData.image || productData.image_url || '';

    const payload = {
      sku: productData.sku,
      name: productData.name,
      category: productData.category,
      original_price: Number(productData.originalPrice ?? productData.original_price ?? 0),
      selling_price: Number(productData.sellingPrice ?? productData.selling_price ?? 0),
      stock: Number(productData.stock ?? 5),
      sizes: productData.sizes || '',
      offer_details: productData.offerDetails || productData.offer_details || '',
      image: primaryImage,
      images: cleanImages,
      available: productData.available !== false,
    };

    let { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select();

    // Retry 1: If 'images' column is of type text (JSON string) instead of array
    if (error && (error.message.includes('images') || error.message.includes('array'))) {
      const retryWithString = await supabase
        .from('products')
        .insert([{ ...payload, images: JSON.stringify(cleanImages) }])
        .select();
      if (!retryWithString.error) {
        data = retryWithString.data;
        error = null;
      } else {
        error = retryWithString.error;
      }
    }

    // Retry 2: If 'images' column does not exist in schema cache
    if (error && error.message && (error.message.includes("'images'") || error.message.includes('images'))) {
      const fallbackImage = cleanImages.length > 1 ? JSON.stringify(cleanImages) : primaryImage;
      const { images: _drop, ...payloadNoImages } = payload;
      const retryNoImages = await supabase
        .from('products')
        .insert([{ ...payloadNoImages, image: fallbackImage }])
        .select();
      if (!retryNoImages.error) {
        data = retryNoImages.data;
        error = null;
      }
    }

    // Retry 3: If table schema uses alternate column names (e.g. price / image_url)
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
        image_url: primaryImage,
        image: primaryImage,
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
 * Sends BOTH 'images' (clean string array) and 'image' (primary image URL)
 * with automatic fallback if 'images' column is missing or typed differently.
 */
export async function updateProductInSupabase(sku, productData) {
  if (!supabase || !isSupabaseConfigured) return { error: new Error('Supabase is not configured.') };
  try {
    const rawImages = productData.images || productData.imagesList || [];
    const cleanImages = (Array.isArray(rawImages)
      ? rawImages
      : (typeof rawImages === 'string' && rawImages.trim().startsWith('[')
          ? (() => { try { const p = JSON.parse(rawImages); return Array.isArray(p) ? p : []; } catch { return []; } })()
          : [productData.image || rawImages]
        )
    ).map(String).map((s) => s.trim()).filter(Boolean);

    const primaryImage = cleanImages[0] || productData.image || productData.image_url || '';

    const payload = {
      name: productData.name,
      category: productData.category,
      original_price: Number(productData.originalPrice ?? productData.original_price ?? 0),
      selling_price: Number(productData.sellingPrice ?? productData.selling_price ?? 0),
      stock: Number(productData.stock ?? 5),
      sizes: productData.sizes || '',
      offer_details: productData.offerDetails || productData.offer_details || '',
      available: productData.available !== false,
      image: primaryImage,
      images: cleanImages,
    };

    let { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('sku', sku)
      .select();

    // Retry 1: If 'images' is text (JSON string) instead of array
    if (error && (error.message.includes('images') || error.message.includes('array'))) {
      const retryStr = await supabase
        .from('products')
        .update({ ...payload, images: JSON.stringify(cleanImages) })
        .eq('sku', sku)
        .select();

      if (!retryStr.error) {
        data = retryStr.data;
        error = null;
      } else {
        error = retryStr.error;
      }
    }

    // Retry 2: If 'images' column does not exist in schema cache
    if (error && (error.message.includes("'images'") || error.message.includes('images') || error.message.includes('column'))) {
      const fallbackImage = cleanImages.length > 1 ? JSON.stringify(cleanImages) : primaryImage;
      const { images: _drop, ...payloadNoImages } = payload;
      const retryNoImages = await supabase
        .from('products')
        .update({ ...payloadNoImages, image: fallbackImage })
        .eq('sku', sku)
        .select();

      if (!retryNoImages.error) {
        data = retryNoImages.data;
        error = null;
      }
    }

    return { data, error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Compresses an image file on the client side using HTML5 Canvas.
 * Returns { blob: Blob, dataUrl: string, originalSize: number, compressedSize: number }
 */
export async function compressImageFile(file, maxWidth = 1200, maxHeight = 1600, quality = 0.78) {
  if (!file || !(file instanceof File)) return null;
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result;
      if (typeof rawDataUrl !== 'string') {
        resolve(null);
        return;
      }
      if (file.type === 'image/svg+xml') {
        resolve({ blob: file, dataUrl: rawDataUrl, originalSize: file.size, compressedSize: file.size });
        return;
      }
      const img = new Image();
      img.onerror = () => resolve({ blob: file, dataUrl: rawDataUrl, originalSize: file.size, compressedSize: file.size });
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ blob: file, dataUrl: rawDataUrl, originalSize: file.size, compressedSize: file.size });
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          canvas.toBlob(
            (blob) => {
              resolve({
                blob: blob || file,
                dataUrl: compressedDataUrl,
                originalSize: file.size,
                compressedSize: blob?.size || file.size,
              });
            },
            'image/jpeg',
            quality
          );
        } catch (_) {
          resolve({ blob: file, dataUrl: rawDataUrl, originalSize: file.size, compressedSize: file.size });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image file to Supabase Storage bucket 'product-images'.
 * Compresses the image client-side before upload (canvas resize) to stay well within Supabase free storage tier.
 * Returns { url, publicUrl, error, warning }.
 * If Supabase Storage bucket is not yet created, falls back gracefully to client-compressed image so product creation is never blocked.
 *
 * @param {File} file - The image file to upload
 * @param {string} [folder='products'] - Sub-folder inside the bucket
 * @returns {Promise<{ url: string|null, publicUrl: string|null, error: string|null, warning: string|null }>}
 */
export async function uploadImageToStorage(file, folder = 'products') {
  if (!file || !(file instanceof File)) {
    return { url: null, publicUrl: null, error: 'No valid image file provided.', warning: null };
  }

  // 1. Client-side compression for mobile speed & storage tier efficiency
  const compressed = await compressImageFile(file);
  const uploadBlob = compressed?.blob || file;
  const fallbackDataUrl = compressed?.dataUrl || null;

  if (!supabase || !isSupabaseConfigured) {
    return {
      url: fallbackDataUrl,
      publicUrl: null,
      error: null,
      warning: 'Supabase is not configured; saved image locally as compressed data.',
    };
  }

  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `${folder}/${timestamp}-${rand}.${cleanExt}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, uploadBlob, {
        cacheControl: '31536000',
        upsert: false,
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.warn('Supabase Storage upload warning:', uploadError.message);
      return {
        url: fallbackDataUrl,
        publicUrl: null,
        error: null,
        warning: `Saved as compressed photo. (Supabase Storage: ${uploadError.message}. Run the SQL snippet to activate cloud storage bucket.)`,
      };
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(path);

    const publicUrl = data?.publicUrl || null;
    return {
      url: publicUrl || fallbackDataUrl,
      publicUrl,
      error: null,
      warning: null,
    };
  } catch (err) {
    console.warn('uploadImageToStorage error:', err);
    return {
      url: fallbackDataUrl,
      publicUrl: null,
      error: null,
      warning: 'Storage upload failed; saved locally as compressed image.',
    };
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
