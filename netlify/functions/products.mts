import { getDatabase } from '@netlify/database';
import { getStore } from '@netlify/blobs';
import type { Config } from '@netlify/functions';
import { verifyRequestOrigin } from '@netlify/identity';
import { categories } from '../../src/data/categories.mts';
import { authorizeOwner } from '../lib/owner-auth.mjs';

interface Product {
  sku: string;
  name: string;
  category: string;
  originalPrice: number;
  sellingPrice: number;
  image: string;
  offerDetails: string;
  sizes: string;
}

type ProductRow = Product;
interface ImageUpload {
  file: File;
  key: string;
  path: string;
}

const maxImageSize = 5 * 1024 * 1024;
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseProduct(form: FormData): Omit<Product, 'image'> | null {
  const sku = form.get('sku');
  const name = form.get('name');
  const category = form.get('category');
  const originalPrice = Number(form.get('originalPrice'));
  const sellingPrice = Number(form.get('sellingPrice'));
  const offerDetails = form.get('offerDetails');
  const sizes = form.get('sizes');
  if (
    typeof sku !== 'string' || !sku.trim() || sku.trim().length > 64 ||
    typeof name !== 'string' || !name.trim() || name.trim().length > 120 ||
    typeof category !== 'string' || !categories.includes(category) ||
    !Number.isInteger(originalPrice) || originalPrice <= 0 ||
    !Number.isInteger(sellingPrice) ||
    sellingPrice <= 0 || sellingPrice > originalPrice ||
    typeof offerDetails !== 'string' || offerDetails.trim().length > 300 ||
    typeof sizes !== 'string' || sizes.trim().length > 120
  ) {
    return null;
  }

  const productSizes = sizes.split(',').map((size) => size.trim()).filter(Boolean);
  if (productSizes.length > 20 || productSizes.some((size) => !/^[\p{L}\p{N}][\p{L}\p{N} /-]{0,23}$/u.test(size))) {
    return null;
  }

  return {
    sku: sku.trim(),
    name: name.trim(),
    category,
    originalPrice,
    sellingPrice,
    offerDetails: offerDetails.trim(),
    sizes: [...new Set(productSizes)].join(', ')
  };
}

function validImageSignature(type: string, bytes: Uint8Array): boolean {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  return type === 'image/webp' &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

async function parseImageUpload(form: FormData, required: boolean): Promise<ImageUpload | null | Response> {
  const imageFile = form.get('image');
  if (imageFile === null || (imageFile instanceof File && imageFile.size === 0)) {
    return required
      ? Response.json({ error: 'Upload a product image to continue.' }, { status: 400 })
      : null;
  }
  if (!(imageFile instanceof File) || imageFile.size > maxImageSize || !imageTypes.has(imageFile.type)) {
    return Response.json({ error: 'Upload a JPEG, PNG, or WebP image smaller than 5 MB.' }, { status: 400 });
  }

  const bytes = new Uint8Array(await imageFile.arrayBuffer());
  if (!validImageSignature(imageFile.type, bytes)) {
    return Response.json({ error: 'The uploaded file does not match its image type.' }, { status: 400 });
  }

  const key = crypto.randomUUID();
  return { file: imageFile, key, path: `/api/product-images/${key}` };
}

async function saveImage(upload: ImageUpload): Promise<void> {
  const images = getStore({ name: 'product-images', consistency: 'strong' });
  await images.set(upload.key, upload.file, { metadata: { contentType: upload.file.type } });
}

async function removeStoredImage(imagePath: string): Promise<boolean> {
  const key = imagePath.match(/^\/api\/product-images\/([\da-f-]{36})$/i)?.[1];
  if (!key) return true;
  try {
    await getStore({ name: 'product-images', consistency: 'strong' }).delete(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove product image ${key}.`, error);
    return false;
  }
}

function hasDatabaseCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

async function listProducts(): Promise<Response> {
  try {
    const db = getDatabase();
    const products = await db.sql<ProductRow>`
      SELECT sku, name, category, original_price AS "originalPrice",
        selling_price AS "sellingPrice", image, offer_details AS "offerDetails", sizes
      FROM products
      ORDER BY created_at DESC, sku
    `;
    return Response.json(products);
  } catch (error) {
    console.error('Failed to load products from the database.', error);
    return Response.json({ error: 'The product catalogue is temporarily unavailable.' }, { status: 500 });
  }
}

async function addProduct(request: Request): Promise<Response> {
  try {
    verifyRequestOrigin(request);
  } catch (error) {
    console.warn('Rejected a cross-origin product update.', error);
    return Response.json({ error: 'Product updates must come from this site.' }, { status: 403 });
  }

  const authorizationError = await authorizeOwner();
  if (authorizationError) return authorizationError;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Submit product details as a multipart form.' }, { status: 400 });
  }

  const product = parseProduct(form);
  if (!product) {
    return Response.json({ error: 'Enter valid product details, a supported category, price, offer, and sizes.' }, { status: 400 });
  }

  const upload = await parseImageUpload(form, true);
  if (upload instanceof Response) return upload;
  if (!upload) {
    return Response.json({ error: 'Upload a product image to continue.' }, { status: 400 });
  }

  let imageSaved = false;
  try {
    await saveImage(upload);
    imageSaved = true;

    const db = getDatabase();
    const [createdProduct] = await db.sql<ProductRow>`
      INSERT INTO products (sku, name, category, original_price, selling_price, image, offer_details, sizes)
      VALUES (${product.sku}, ${product.name}, ${product.category}, ${product.originalPrice},
        ${product.sellingPrice}, ${upload.path}, ${product.offerDetails}, ${product.sizes})
      RETURNING sku, name, category, original_price AS "originalPrice",
        selling_price AS "sellingPrice", image, offer_details AS "offerDetails", sizes
    `;
    if (!createdProduct) {
      throw new Error('Product insert completed without returning the created row.');
    }
    return Response.json(createdProduct, { status: 201 });
  } catch (error) {
    if (imageSaved) {
      await removeStoredImage(upload.path);
    }
    if (hasDatabaseCode(error, '23505')) {
      return Response.json({ error: 'A product with that SKU already exists.' }, { status: 409 });
    }
    console.error('Failed to save a product to the database.', error);
    return Response.json({ error: 'The product could not be saved.' }, { status: 500 });
  }
}

async function updateProduct(request: Request, sku: string): Promise<Response> {
  try {
    verifyRequestOrigin(request);
  } catch (error) {
    console.warn('Rejected a cross-origin product update.', error);
    return Response.json({ error: 'Product updates must come from this site.' }, { status: 403 });
  }

  const authorizationError = await authorizeOwner();
  if (authorizationError) return authorizationError;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Submit product details as a multipart form.' }, { status: 400 });
  }

  const product = parseProduct(form);
  if (!product || product.sku !== sku) {
    return Response.json({ error: 'Enter valid product details without changing the product SKU.' }, { status: 400 });
  }

  const upload = await parseImageUpload(form, false);
  if (upload instanceof Response) return upload;

  let imageSaved = false;
  try {
    const db = getDatabase();
    const [existingProduct] = await db.sql<{ image: string }>`
      SELECT image FROM products WHERE sku = ${sku}
    `;
    if (!existingProduct) return Response.json({ error: 'Product not found.' }, { status: 404 });

    if (upload) {
      await saveImage(upload);
      imageSaved = true;
    }

    const [updatedProduct] = await db.sql<ProductRow>`
      UPDATE products
      SET name = ${product.name}, category = ${product.category},
        original_price = ${product.originalPrice}, selling_price = ${product.sellingPrice},
        image = ${upload?.path ?? existingProduct.image}, offer_details = ${product.offerDetails},
        sizes = ${product.sizes}
      WHERE sku = ${sku}
      RETURNING sku, name, category, original_price AS "originalPrice",
        selling_price AS "sellingPrice", image, offer_details AS "offerDetails", sizes
    `;
    if (!updatedProduct) {
      if (imageSaved && upload) await removeStoredImage(upload.path);
      return Response.json({ error: 'Product not found.' }, { status: 404 });
    }

    const oldImageRemoved = !upload || await removeStoredImage(existingProduct.image);
    return Response.json({
      product: updatedProduct,
      ...(upload && !oldImageRemoved ? { warning: 'Product updated, but its previous image could not be removed.' } : {})
    });
  } catch (error) {
    if (imageSaved && upload) await removeStoredImage(upload.path);
    console.error(`Failed to update product ${sku}.`, error);
    return Response.json({ error: 'The product could not be updated.' }, { status: 500 });
  }
}

async function deleteProduct(request: Request, sku: string): Promise<Response> {
  try {
    verifyRequestOrigin(request);
  } catch (error) {
    console.warn('Rejected a cross-origin product deletion.', error);
    return Response.json({ error: 'Product changes must come from this site.' }, { status: 403 });
  }

  const authorizationError = await authorizeOwner();
  if (authorizationError) return authorizationError;

  try {
    const db = getDatabase();
    const [deletedProduct] = await db.sql<{ sku: string; image: string }>`
      DELETE FROM products WHERE sku = ${sku}
      RETURNING sku, image
    `;
    if (!deletedProduct) return Response.json({ error: 'Product not found.' }, { status: 404 });

    const imageRemoved = await removeStoredImage(deletedProduct.image);
    return Response.json({
      sku: deletedProduct.sku,
      ...(imageRemoved ? {} : { warning: 'Product deleted, but its image could not be removed.' })
    });
  } catch (error) {
    console.error(`Failed to delete product ${sku}.`, error);
    return Response.json({ error: 'The product could not be deleted.' }, { status: 500 });
  }
}

export default async function productsHandler(request: Request): Promise<Response> {
  if (request.method === 'GET') return listProducts();
  if (request.method === 'POST') return addProduct(request);
  const sku = new URL(request.url).searchParams.get('sku')?.trim() ?? '';
  if (!sku || sku.length > 64) return Response.json({ error: 'A valid product SKU is required.' }, { status: 400 });
  if (request.method === 'PUT') return updateProduct(request, sku);
  if (request.method === 'DELETE') return deleteProduct(request, sku);
  return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'GET, POST, PUT, DELETE' } });
}

export const config: Config = {
  path: '/api/products',
  method: ['GET', 'POST', 'PUT', 'DELETE'],
  rateLimit: {
    action: 'rate_limit',
    aggregateBy: 'ip',
    windowSize: 60,
    windowLimit: 30
  }
};
