import { getDatabase } from '@netlify/database';
import type { Config } from '@netlify/functions';
import { verifyRequestOrigin } from '@netlify/identity';
import { authorizeOwner } from '../lib/owner-auth.mjs';

const orderStatuses = ['pending', 'confirmed', 'fulfilled', 'cancelled'] as const;
type OrderStatus = typeof orderStatuses[number];

interface Order {
  id: number;
  email: string;
  phone: string;
  productSku: string;
  productName: string;
  size: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
}

function isOrderStatus(value: string): value is OrderStatus {
  return orderStatuses.some((status) => status === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function parsePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const phone = value.trim();
  const digits = phone.replace(/\D/g, '');
  return phone.length <= 20 && /^\+?[0-9][0-9().\s-]*$/.test(phone) && digits.length >= 7 && digits.length <= 15
    ? phone
    : null;
}

function hasDatabaseCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

async function listOrders(): Promise<Response> {
  const authorizationError = await authorizeOwner();
  if (authorizationError) return authorizationError;

  try {
    const db = getDatabase();
    const orders = await db.sql<Order>`
      SELECT id, email, phone, product_sku AS "productSku", product_name AS "productName", size,
        quantity, unit_price AS "unitPrice", total_price AS "totalPrice",
        status, created_at AS "createdAt"
      FROM orders
      ORDER BY created_at DESC
      LIMIT 500
    `;
    return Response.json(orders);
  } catch (error) {
    console.error('Failed to load customer orders from the database.', error);
    return Response.json({ error: 'Customer orders are temporarily unavailable.' }, { status: 500 });
  }
}

async function createOrder(request: Request): Promise<Response> {
  try {
    verifyRequestOrigin(request);
  } catch (error) {
    console.warn('Rejected a cross-origin order submission.', error);
    return Response.json({ error: 'Orders must be submitted from this site.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'The request body must contain valid JSON.' }, { status: 400 });
  }
  if (!isRecord(body)) {
    return Response.json({ error: 'Enter a valid order.' }, { status: 400 });
  }

  const email = parseEmail(body.email);
  const phone = parsePhone(body.phone);
  const sku = typeof body.sku === 'string' ? body.sku.trim() : '';
  const requestedSize = typeof body.size === 'string' ? body.size.trim() : '';
  if (!email || !phone || !sku || sku.length > 64) {
    return Response.json({ error: 'Enter a valid email address, phone number, and product.' }, { status: 400 });
  }

  try {
    const db = getDatabase();
    const [product] = await db.sql<{ sku: string; name: string; sellingPrice: number; sizes: string }>`
      SELECT sku, name, selling_price AS "sellingPrice", sizes
      FROM products
      WHERE sku = ${sku}
    `;
    if (!product) {
      return Response.json({ error: 'This product is no longer available.' }, { status: 404 });
    }

    const availableSizes = product.sizes.split(',').map((size) => size.trim()).filter(Boolean);
    if ((availableSizes.length > 0 && !availableSizes.includes(requestedSize)) ||
      (availableSizes.length === 0 && requestedSize)) {
      return Response.json({ error: 'Select a valid size for this product.' }, { status: 400 });
    }

    const [order] = await db.sql<Order>`
      INSERT INTO orders (email, phone, product_sku, product_name, size, quantity, unit_price, total_price)
      VALUES (${email}, ${phone}, ${product.sku}, ${product.name}, ${requestedSize || null},
        1, ${product.sellingPrice}, ${product.sellingPrice})
      RETURNING id, email, phone, product_sku AS "productSku", product_name AS "productName", size,
        quantity, unit_price AS "unitPrice", total_price AS "totalPrice",
        status, created_at AS "createdAt"
    `;
    if (!order) {
      console.error('Order insert completed without returning the created row.');
      return Response.json({ error: 'Your order could not be placed.' }, { status: 500 });
    }
    return Response.json({ orderId: order.id, status: order.status }, { status: 201 });
  } catch (error) {
    console.error('Failed to save the customer order.', error);
    return Response.json({ error: 'Your order could not be placed. Please try again.' }, { status: 500 });
  }
}

async function updateOrder(request: Request): Promise<Response> {
  try {
    verifyRequestOrigin(request);
  } catch (error) {
    console.warn('Rejected a cross-origin order status update.', error);
    return Response.json({ error: 'Order updates must come from this site.' }, { status: 403 });
  }

  const authorizationError = await authorizeOwner();
  if (authorizationError) return authorizationError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'The request body must contain valid JSON.' }, { status: 400 });
  }
  if (
    !isRecord(body) ||
    typeof body.id !== 'number' ||
    !Number.isSafeInteger(body.id) ||
    typeof body.status !== 'string' ||
    !isOrderStatus(body.status)
  ) {
    return Response.json({ error: 'Enter a valid order ID and status.' }, { status: 400 });
  }

  try {
    const db = getDatabase();
    const [order] = await db.sql<Order>`
      UPDATE orders
      SET status = ${body.status}
      WHERE id = ${body.id}
      RETURNING id, email, phone, product_sku AS "productSku", product_name AS "productName", size,
        quantity, unit_price AS "unitPrice", total_price AS "totalPrice",
        status, created_at AS "createdAt"
    `;
    if (!order) return Response.json({ error: 'Order not found.' }, { status: 404 });
    return Response.json(order);
  } catch (error) {
    console.error('Failed to update the order status.', error);
    return Response.json({ error: 'The order status could not be updated.' }, { status: 500 });
  }
}

export default async function ordersHandler(request: Request): Promise<Response> {
  if (request.method === 'GET') return listOrders();
  if (request.method === 'POST') return createOrder(request);
  if (request.method === 'PATCH') return updateOrder(request);
  return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'GET, POST, PATCH' } });
}

export const config: Config = {
  path: '/api/orders',
  method: ['GET', 'POST', 'PATCH'],
  rateLimit: {
    action: 'rate_limit',
    aggregateBy: 'ip',
    windowSize: 60,
    windowLimit: 30
  }
};
