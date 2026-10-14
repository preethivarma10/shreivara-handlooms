import { getStore } from '@netlify/blobs';
import type { Config } from '@netlify/functions';

export default async function productImageHandler(request: Request): Promise<Response> {
  const key = new URL(request.url).pathname.split('/').at(-1) ?? '';
  if (!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(key)) {
    return new Response('Image not found.', { status: 404 });
  }

  try {
    const images = getStore({ name: 'product-images', consistency: 'strong' });
    const image = await images.getWithMetadata(key, { type: 'blob' });
    if (!image) return new Response('Image not found.', { status: 404 });

    const contentType = image.metadata.contentType;
    if (contentType !== 'image/jpeg' && contentType !== 'image/png' && contentType !== 'image/webp') {
      console.error(`Product image ${key} has an unsupported stored content type.`);
      return new Response('Image unavailable.', { status: 500 });
    }

    return new Response(image.data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error(`Failed to load product image ${key}.`, error);
    return new Response('Image unavailable.', { status: 500 });
  }
}

export const config: Config = {
  path: '/api/product-images/:key',
  method: 'GET'
};
