import { createClient } from '@supabase/supabase-js';

// Reads from Vite environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
// or allows runtime configuration stored in localStorage
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const localUrl = typeof window !== 'undefined' ? localStorage.getItem('shreivara_supabase_url') : '';
const localKey = typeof window !== 'undefined' ? localStorage.getItem('shreivara_supabase_anon_key') : '';

export const SUPABASE_URL = (envUrl || localUrl || '').trim();
export const SUPABASE_ANON_KEY = (envKey || localKey || '').trim();

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('YOUR_SUPABASE') &&
  !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE')
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * Fetch all products from Supabase 'products' table.
 * Returns null if Supabase is not configured or on failure.
 */
export async function fetchProductsFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.warn('Supabase fetch products error:', error.message);
      return null;
    }
    if (Array.isArray(data) && data.length > 0) {
      // Normalize field names if snake_case or different column names were used
      return data.map((item, idx) => {
        const originalPrice = Number(item.original_price ?? item.originalPrice ?? item.mrp ?? item.price ?? item.selling_price ?? 0);
        const sellingPrice = Number(item.selling_price ?? item.sellingPrice ?? item.price ?? item.original_price ?? 0);
        return {
          sku: String(item.sku || item.id || `SHR-${idx + 1}`),
          name: item.name || item.title || 'Handloom Piece',
          category: item.category || 'Kanchi Pattu',
          originalPrice: originalPrice || sellingPrice || 4999,
          sellingPrice: sellingPrice || originalPrice || 3999,
          stock: Number(item.stock ?? 5),
          sizes: item.sizes ?? '',
          offerDetails: item.offer_details ?? item.offerDetails ?? '',
          image: item.image || item.image_url || item.imageUrl || item.photo || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
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
 * Insert a product into Supabase 'products' table.
 */
export async function insertProductToSupabase(productData) {
  if (!supabase) return { error: new Error('Supabase is not configured.') };
  try {
    const payload = {
      sku: productData.sku,
      name: productData.name,
      category: productData.category,
      original_price: productData.originalPrice,
      selling_price: productData.sellingPrice,
      stock: productData.stock ?? 5,
      sizes: productData.sizes || '',
      offer_details: productData.offerDetails || '',
      image: productData.image,
      available: productData.available !== false,
    };

    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select();

    return { data, error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Direct handler requested: handleAddProduct
 */
export async function handleAddProduct(productData) {
  if (!supabase) {
    alert("Supabase is not configured yet. Please set your Supabase URL and Anon Key in .env or via the Admin Dashboard.");
    return { error: new Error('Supabase is not configured') };
  }

  const { data, error } = await supabase
    .from('products')
    .insert([productData]);

  if (!error) {
    alert("Product added to storefront successfully!");
  } else {
    alert("Error adding product to Supabase: " + error.message);
  }

  return { data, error };
}

/**
 * Update an existing product in Supabase.
 */
export async function updateProductInSupabase(sku, productData) {
  if (!supabase) return { error: new Error('Supabase is not configured.') };
  try {
    const payload = {
      name: productData.name,
      category: productData.category,
      original_price: productData.originalPrice,
      selling_price: productData.sellingPrice,
      stock: productData.stock ?? 5,
      sizes: productData.sizes || '',
      offer_details: productData.offerDetails || '',
      available: productData.available !== false,
      ...(productData.image ? { image: productData.image } : {}),
    };

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('sku', sku)
      .select();

    return { data, error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Delete a product from Supabase by SKU.
 */
export async function deleteProductFromSupabase(sku) {
  if (!supabase) return { error: new Error('Supabase is not configured.') };
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
  if (!supabase) return { error: new Error('Supabase is not configured.') };
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
