import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { categories, WHATSAPP_NUMBER } from '../data/products.js';
import { DEFAULT_PRODUCTS } from '../components/SiteLayout.jsx';
import { supabase, isSupabaseConfigured, fetchProductsFromSupabase } from '../lib/supabase';

/**
 * Robust multi-image extractor supporting:
 * - Array of image URLs (product.images or product.imagesList)
 * - JSON string array (e.g. '["url1", "url2"]')
 * - PostgreSQL array string (e.g. '{"url1", "url2"}')
 * - Comma-separated string of URLs
 * - Single image URL (product.image or product.image_url)
 * Automatically filters out any empty strings or null values.
 */
export function extractProductImages(item) {
  if (!item) return ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'];

  const candidates = [
    item.images,
    item.imagesList,
    item.image_url,
    item.image,
    item.imageUrl,
    item.photo,
  ];

  for (const val of candidates) {
    if (!val) continue;

    // 1. Array of images
    if (Array.isArray(val) && val.length > 0) {
      const flattened = [];
      for (const el of val) {
        if (!el) continue;
        const s = String(el).trim();
        if (s.startsWith('[')) {
          try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) {
              flattened.push(...parsed.map(String).map((x) => x.trim()).filter(Boolean));
              continue;
            }
          } catch (_) { }
        }
        if (s) flattened.push(s);
      }
      if (flattened.length > 0) return flattened;
    }

    // 2. String representation
    if (typeof val === 'string' && val.trim()) {
      const trimmed = val.trim();

      // JSON string array like '["url1", "url2"]'
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            const clean = parsed.map(String).map((s) => s.trim()).filter(Boolean);
            if (clean.length > 0) return clean;
          }
        } catch (_) { }
      }

      // PostgreSQL array string like '{"url1", "url2"}'
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const inner = trimmed.slice(1, -1);
        const parts = inner.split(',').map((s) => s.replace(/^"|"$/g, '').trim()).filter(Boolean);
        if (parts.length > 0) return parts;
      }

      // Comma-separated URLs
      if (trimmed.includes(',') && (trimmed.startsWith('http') || trimmed.includes('http'))) {
        const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
        if (parts.length > 1 && parts.every((p) => p.startsWith('http') || p.startsWith('data:'))) {
          return parts;
        }
      }

      // Single URL string
      return [trimmed];
    }
  }

  return ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'];
}

function normalizeProduct(item, idx = 0) {
  const sellingPrice = Number(item.selling_price ?? item.sellingPrice ?? item.price ?? 3999);
  const originalPrice = Number(
    item.original_price ??
    item.originalPrice ??
    item.mrp ??
    item.price ??
    (sellingPrice > 0 ? Math.round(sellingPrice * 1.25) : 4999)
  );

  const imagesList = extractProductImages(item);
  const rawImage = imagesList[0];
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
    images: imagesList,
    imagesList,
    stock: Number(item.stock ?? 5),
    sizes: item.sizes ?? '',
    available: item.available !== false,
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.535 5.847L.057 23.667a.5.5 0 0 0 .612.612l5.82-1.478A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.012-1.373l-.36-.214-3.727.947.963-3.617-.234-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 8.5h13l1 12h-15l1-12Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function ProductCard({ product, cartQuantity = 0, onAddToBag, onOpenDetail }) {
  const p = product;
  const rawSizes = p.sizes || '';
  const sizes = Array.isArray(rawSizes)
    ? rawSizes
    : typeof rawSizes === 'string' && rawSizes
      ? rawSizes.split(',').map((size) => size.trim()).filter(Boolean)
      : [];

  // Dynamic image array resolution — maps through product.images, falling back to multi-format parser
  const productImages = Array.isArray(p.images) && p.images.length > 0
    ? p.images.filter(Boolean)
    : extractProductImages(p);
  const [activeIdx, setActiveIdx] = useState(0);

  const safeIdx = activeIdx >= productImages.length ? 0 : activeIdx;
  const resolveUrl = (src) => typeof src === 'string' && src.startsWith('/')
    ? `${window.location.origin}${src}`
    : src;
  const activeImage = resolveUrl(productImages[safeIdx] || productImages[0]);

  const sellingPrice = Number(p.sellingPrice ?? p.selling_price ?? p.price ?? 3999);
  const originalPrice = Number(p.originalPrice ?? p.original_price ?? p.mrp ?? p.price ?? (sellingPrice > 0 ? Math.round(sellingPrice * 1.25) : 4999));
  const sku = String(p.sku || p.id || 'SHR-001');
  const name = p.name || p.title || 'Handloom Saree';
  const category = p.category || 'Kanchi Pattu';
  const description = p.description || p.offerDetails || p.offer_details || '';
  const offerDetails = p.offerDetails || p.offer_details || '';

  const maxStock = Number(p.stock ?? 5);
  const isSoldOut = p.available === false || maxStock <= 0;
  const isMaxReached = cartQuantity >= maxStock;

  const waMessage = encodeURIComponent([
    isSoldOut
      ? 'Hello Shreivara, I noticed this piece is currently sold out and would like to inquire about a custom weave / restock:'
      : 'Hello Shreivara, I would like to inquire about / order this piece:',
    `• Product: ${name}`,
    `• Code: ${sku}`,
    `• Category: ${category}`,
    `• Price: ${formatCurrency(sellingPrice)}`,
    originalPrice > sellingPrice ? `• Original Price: ${formatCurrency(originalPrice)}` : '',
    offerDetails ? `• Offer: ${offerDetails}` : '',
    description ? `• Details: ${description}` : '',
    `• View: ${activeImage}`,
    '• Storefront: https://shreivara-handlooms.vercel.app',
    '',
    'Please confirm availability and delivery details.'
  ].filter(Boolean).join('\n'));

  const discount = originalPrice > sellingPrice ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;

  return (
    <article className="group overflow-hidden rounded-sm border border-[#e1d8c9] bg-[#fbf9f4] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(58,43,25,0.12)] flex flex-col">
      {/* Featured Main Image Viewer with Luxury Frame & Smooth Crossfade */}
      <div
        className="relative overflow-hidden bg-[#e8dfd0] cursor-pointer"
        onClick={() => onOpenDetail && onOpenDetail(safeIdx)}
        title="Click to view full photo & details"
      >
        <img
          key={activeImage}
          src={activeImage}
          alt={`${name} - View ${safeIdx + 1}`}
          className="h-[320px] w-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.035]"
          loading="lazy"
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3 bg-[#f6f2e9]/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-maroon-900 border border-gold-300/60 shadow-xs">
            {discount}% off
          </span>
        )}
        {isSoldOut ? (
          <span className="absolute right-3 top-3 rounded-sm bg-neutral-900/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white shadow-xs">
            Sold Out
          </span>
        ) : cartQuantity > 0 ? (
          <span className="absolute right-3 top-3 rounded-full bg-maroon-900 text-white px-2.5 py-1 text-[10px] font-bold shadow-md flex items-center gap-1 border border-gold-300/70">
            <span>🛍️</span> {cartQuantity} in Cart
          </span>
        ) : null}

        {/* Dynamic Image Counter Pill */}
        {productImages.length > 1 && (
          <span className="absolute bottom-2.5 left-3 rounded-full bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[9.5px] font-medium tracking-wider text-white flex items-center gap-1.5">
            <svg className="h-3 w-3 text-gold-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <span>{safeIdx + 1} / {productImages.length}</span>
          </span>
        )}

        <span className="absolute bottom-2.5 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[9.5px] font-semibold text-maroon-900 opacity-0 group-hover:opacity-100 transition shadow-xs">
          Quick View ↗
        </span>
      </div>

      {/* Interactive Thumbnail Gallery Strip — maps through product.images */}
      {productImages.length > 1 && (
        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1 border-b border-[#ece4d6]/60 bg-[#faf7f0]/80 overflow-x-auto">
          {productImages.map((imageUrl, idx) => {
            const isActive = safeIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                aria-label={`Switch to image view ${idx + 1} of ${productImages.length}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx(idx);
                }}
                className={`group/thumb cursor-pointer relative h-[48px] w-[48px] sm:h-[52px] sm:w-[52px] shrink-0 overflow-hidden rounded-sm border-2 transition-all duration-200 focus:outline-none ${isActive
                    ? 'border-maroon-900 ring-2 ring-gold-400/60 shadow-md scale-105'
                    : 'border-[#ded5c6] opacity-70 hover:opacity-100 hover:border-gold-500'
                  }`}
              >
                <img
                  src={resolveUrl(imageUrl)}
                  alt={`${name} thumbnail ${idx + 1}`}
                  className="h-full w-full object-cover transition duration-200 group-hover/thumb:scale-110"
                  loading="lazy"
                />
                {isActive && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-maroon-900" />
                )}
              </button>
            );
          })}
          <span className="ml-auto text-[9px] font-medium uppercase tracking-wider text-neutral-400 whitespace-nowrap pl-1">
            {productImages.length} {productImages.length === 1 ? 'View' : 'Views'}
          </span>
        </div>
      )}

      <div className={`p-4 sm:p-5 flex flex-col flex-1 ${productImages.length > 1 ? 'pt-2.5' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600">{category}</p>
          <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
            Code: <span className="font-semibold text-neutral-800">{sku}</span>
          </span>
        </div>
        <h3
          className="mt-2 min-h-[52px] font-brand text-2xl font-medium leading-tight text-maroon-900 cursor-pointer hover:underline"
          onClick={() => onOpenDetail && onOpenDetail(safeIdx)}
        >
          {name}
        </h3>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-semibold text-maroon-900">{formatCurrency(sellingPrice)}</span>
          {originalPrice > sellingPrice && (
            <span className="text-sm text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
          )}
        </div>
        {offerDetails && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-maroon-900">{offerDetails}</p>}
        {description && !offerDetails && <p className="mt-2 text-xs text-gray-600 line-clamp-2">{description}</p>}
        {sizes.length > 0 && (
          <p className="mt-2 text-xs sm:text-sm text-neutral-600">
            <span className="font-semibold text-neutral-700">Available sizes: </span>
            <span className="text-neutral-800">{sizes.join(', ')}</span>
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2 mt-auto">
          <a
            href={`https://wa.me/919000510329?text=${waMessage}`}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-sm bg-[#25d366] px-2.5 py-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#1ebe5d]"
          >
            <span className="h-4 w-4 shrink-0"><WhatsAppIcon /></span>
            Order on WhatsApp
          </a>
          <button
            type="button"
            disabled={isMaxReached || isSoldOut}
            onClick={onAddToBag}
            className={`cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-sm border px-2.5 py-3 text-xs font-semibold uppercase tracking-wide transition ${
              isSoldOut
                ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 opacity-60'
                : isMaxReached
                ? 'cursor-not-allowed border-amber-800 bg-amber-50 text-amber-900'
                : cartQuantity > 0
                ? 'border-maroon-900 bg-maroon-900 text-[#f8f5ed] hover:bg-maroon-800 shadow-xs'
                : 'border-maroon-900 text-maroon-900 hover:bg-maroon-900 hover:text-[#f8f5ed]'
            }`}
            title={cartQuantity > 0 ? `${cartQuantity} currently in shopping cart. Click to add another.` : 'Add to Cart'}
          >
            <span className="h-4 w-4 shrink-0"><BagIcon /></span>
            {isSoldOut
              ? 'Sold Out'
              : isMaxReached
              ? `In Cart (${cartQuantity})`
              : cartQuantity > 0
              ? `In Cart (${cartQuantity}) +`
              : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductDetailModal({ product, initialIdx = 0, onClose, cartQuantity = 0, onAddToBag }) {
  if (!product) return null;
  const p = product;
  const productImages = Array.isArray(p.images) && p.images.length > 0
    ? p.images.filter(Boolean)
    : extractProductImages(p);
  const [activeIdx, setActiveIdx] = useState(initialIdx || 0);

  const safeIdx = activeIdx >= productImages.length ? 0 : activeIdx;
  const resolveUrl = (src) => typeof src === 'string' && src.startsWith('/')
    ? `${window.location.origin}${src}`
    : src;
  const activeImage = resolveUrl(productImages[safeIdx] || productImages[0]);

  const sellingPrice = Number(p.sellingPrice ?? p.selling_price ?? p.price ?? 3999);
  const originalPrice = Number(p.originalPrice ?? p.original_price ?? p.mrp ?? p.price ?? (sellingPrice > 0 ? Math.round(sellingPrice * 1.25) : 4999));
  const sku = String(p.sku || p.id || 'SHR-001');
  const name = p.name || p.title || 'Handloom Saree';
  const category = p.category || 'Kanchi Pattu';
  const description = p.description || p.offerDetails || p.offer_details || '';
  const offerDetails = p.offerDetails || p.offer_details || '';

  const maxStock = Number(p.stock ?? 5);
  const isSoldOut = p.available === false || maxStock <= 0;
  const isMaxReached = cartQuantity >= maxStock;

  const rawSizes = p.sizes || '';
  const sizes = Array.isArray(rawSizes)
    ? rawSizes
    : typeof rawSizes === 'string' && rawSizes
      ? rawSizes.split(',').map((size) => size.trim()).filter(Boolean)
      : [];

  const waMessage = encodeURIComponent([
    isSoldOut
      ? 'Hello Shreivara, I noticed this piece is currently sold out and would like to inquire about a custom weave / restock:'
      : 'Hello Shreivara, I would like to inquire about / order this piece:',
    `• Product: ${name}`,
    `• Code: ${sku}`,
    `• Category: ${category}`,
    `• Price: ${formatCurrency(sellingPrice)}`,
    originalPrice > sellingPrice ? `• Original Price: ${formatCurrency(originalPrice)}` : '',
    offerDetails ? `• Offer: ${offerDetails}` : '',
    description ? `• Details: ${description}` : '',
    `• View: ${activeImage}`,
    '• Storefront: https://shreivara-handlooms.vercel.app',
    '',
    'Please confirm availability and delivery details.'
  ].filter(Boolean).join('\n'));

  const discount = originalPrice > sellingPrice ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gold-300 bg-[#fbf9f4] p-5 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="cursor-pointer absolute top-4 right-4 h-8 w-8 rounded-full border border-neutral-300 bg-white flex items-center justify-center text-sm font-bold text-neutral-600 hover:bg-maroon-900 hover:text-white transition shadow-xs z-10"
        >
          ✕
        </button>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Gallery view */}
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl border border-[#ded5c6] bg-[#e8dfd0]">
              <img
                key={activeImage}
                src={activeImage}
                alt={name}
                className="h-[340px] sm:h-[400px] w-full object-cover transition-all duration-300"
              />
              {discount > 0 && (
                <span className="absolute left-3 top-3 bg-[#f6f2e9]/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-maroon-900 rounded-sm">
                  {discount}% off
                </span>
              )}
              {isSoldOut && (
                <span className="absolute right-3 top-3 rounded-sm bg-neutral-900/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white">
                  Sold Out
                </span>
              )}
            </div>

            {/* Thumbnails row — maps through product.images */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {productImages.map((imageUrl, idx) => {
                  const isActive = safeIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`View photo ${idx + 1}`}
                      onClick={() => setActiveIdx(idx)}
                      className={`cursor-pointer relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-all duration-200 ${isActive
                          ? 'border-maroon-900 ring-2 ring-gold-400 shadow-md scale-105'
                          : 'border-[#ded5c6] opacity-70 hover:opacity-100 hover:border-gold-500'
                        }`}
                    >
                      <img
                        src={resolveUrl(imageUrl)}
                        alt={`View ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {isActive && (
                        <span className="absolute bottom-0 inset-x-0 h-1 bg-maroon-900" />
                      )}
                    </button>
                  );
                })}
                <span className="text-[11px] text-neutral-400 font-medium pl-1">
                  {safeIdx + 1} of {productImages.length} photos
                </span>
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600">{category}</p>
              <h2 className="mt-1 font-brand text-2xl sm:text-3xl font-medium text-maroon-900">{name}</h2>
              <p className="mt-0.5 text-xs uppercase tracking-wider text-neutral-500">
                Code: <span className="font-semibold text-neutral-800">{sku}</span>
              </p>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-2xl font-bold text-maroon-900">{formatCurrency(sellingPrice)}</span>
                {originalPrice > sellingPrice && (
                  <span className="text-base text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
                )}
              </div>

              {offerDetails && (
                <div className="mt-3.5 rounded-xl bg-amber-50 border border-gold-300 p-3 text-xs font-semibold text-maroon-900">
                  ✨ {offerDetails}
                </div>
              )}

              {description && (
                <p className="mt-3 text-xs sm:text-sm text-neutral-700 leading-relaxed">
                  {description}
                </p>
              )}

              {sizes.length > 0 && (
                <p className="mt-3 text-xs sm:text-sm text-neutral-600">
                  <span className="font-semibold text-neutral-700">Available sizes: </span>
                  <span className="text-neutral-800">{sizes.join(', ')}</span>
                </p>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-[#ded5c6]">
              <a
                href={`https://wa.me/919000510329?text=${waMessage}`}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#1ebe5d]"
              >
                <span className="h-5 w-5 shrink-0"><WhatsAppIcon /></span>
                Inquire / Order on WhatsApp
              </a>

              <button
                type="button"
                disabled={isMaxReached || isSoldOut}
                onClick={onAddToBag}
                className={`cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold uppercase tracking-wider transition ${
                  isSoldOut
                    ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400'
                    : isMaxReached
                    ? 'cursor-not-allowed border-amber-800 bg-amber-50 text-amber-900'
                    : 'border-maroon-900 bg-maroon-900 text-white hover:bg-maroon-800 shadow-xs'
                }`}
              >
                <span className="h-5 w-5 shrink-0"><BagIcon /></span>
                {isSoldOut
                  ? 'Sold Out'
                  : isMaxReached
                  ? `In Cart (${cartQuantity}) • Max Stock Reached`
                  : cartQuantity > 0
                  ? `✓ In Cart (${cartQuantity}) • Add Another`
                  : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const {
    query,
    category,
    setCategory,
    setProducts: setParentProducts,
    cartItems,
    addToBag
  } = useOutletContext();

  const [products, setProducts] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('shreivara-products');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p, idx) => normalizeProduct(p, idx));
          }
        }
      } catch (_) { }
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalInitialIdx, setModalInitialIdx] = useState(0);

  useEffect(() => {
    document.title = 'Shreivara Handlooms | Authentic Sarees & Fine Jewelry';
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchProducts() {
      setLoading(true);
      try {
        let { data, error: supabaseError } = await supabase
          .from('products')
          .select('*')
          .eq('available', true)
          .order('created_at', { ascending: false });

        if (supabaseError) {
          console.warn('Supabase fetch error, retrying without order/filter:', supabaseError.message);
          // Fallback: If table has no created_at column or available column, retry gracefully
          const retry = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
          if (!retry.error && retry.data) {
            data = retry.data.filter((item) => item.available !== false);
            supabaseError = null;
          } else {
            const retryBasic = await supabase.from('products').select('*');
            if (!retryBasic.error && retryBasic.data) {
              data = retryBasic.data.filter((item) => item.available !== false);
              supabaseError = null;
            }
          }
        }

        if (data && data.length > 0) {
          if (isMounted) {
            const normalized = data.map((item, idx) => normalizeProduct(item, idx));
            setProducts(normalized);
            if (setParentProducts) setParentProducts(normalized);
            try {
              localStorage.setItem('shreivara-products', JSON.stringify(normalized));
            } catch (_) { }
            setLoading(false);
          }
        } else if (supabaseError) {
          console.warn('Supabase fetch error:', supabaseError.message);
          if (isMounted) {
            setError(supabaseError.message);
            setLoading(false);
          }
        } else {
          if (isMounted) {
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn('Supabase connection error:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();
    return () => { isMounted = false; };
  }, [setParentProducts]);

  // Real-time synchronization for changes made in Admin Panel across tabs
  useEffect(() => {
    function handleUpdate(updatedProducts) {
      if (Array.isArray(updatedProducts) && updatedProducts.length > 0) {
        const availableOnly = updatedProducts.filter((p) => p.available !== false);
        const normalized = availableOnly.map((p, idx) => normalizeProduct(p, idx));
        setProducts(normalized);
        if (setParentProducts) setParentProducts(normalized);
      }
    }

    let bc;
    try {
      bc = new BroadcastChannel('shreivara_products_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'PRODUCTS_UPDATED') {
          handleUpdate(event.data.products);
        }
      };
    } catch (_) { }

    function onStorage(e) {
      if (e.key === 'shreivara-products' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleUpdate(parsed);
        } catch (_) { }
      }
    }
    window.addEventListener('storage', onStorage);

    return () => {
      if (bc) {
        try { bc.close(); } catch (_) { }
      }
      window.removeEventListener('storage', onStorage);
    };
  }, [setParentProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = (query || '').trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        category === 'All Sarees' ||
        category === 'All Collections' ||
        category === 'ALL' ||
        product.category === category;
      const matchesQuery =
        !normalizedQuery ||
        (product.name && product.name.toLowerCase().includes(normalizedQuery)) ||
        (product.sku && product.sku.toLowerCase().includes(normalizedQuery)) ||
        (product.category && product.category.toLowerCase().includes(normalizedQuery));
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  return (
    <main id="top" className="w-full flex-1">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-16">

        {/* Top Collections Section */}
        <section id="collections" className="scroll-mt-24 pt-2">
          <div id="catalog" className="scroll-mt-24">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-brand text-4xl font-medium text-maroon-900 sm:text-5xl">Top Collections</h1>
                <p className="mt-1 text-sm text-[#786c5b]">Sarees to Treasures • Handcrafted with Heritage Artistry</p>
              </div>
              <p className="text-xs text-gray-500" aria-live="polite">
                Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
              </p>
            </div>

            {/* Category Filter Chips */}
            <div className="mb-8 flex flex-wrap gap-2" aria-label="Filter collections by category">
              {['All Collections', ...categories].map((item) => {
                const isSelected =
                  (item === 'All Collections' && (category === 'All Collections' || category === 'All Sarees' || category === 'ALL')) ||
                  category === item;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setCategory(item === 'All Collections' ? 'All Collections' : item)}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-medium transition ${isSelected
                      ? 'border-maroon-900 bg-maroon-900 text-[#f8f5ed]'
                      : 'border-[#d9d0c1] bg-transparent text-gray-700 hover:border-maroon-800 hover:text-maroon-900'
                      }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {/* Products Grid */}
            <div id="catalog-grid" className="scroll-mt-28">
              {loading && products.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-600" role="status">Loading the collection…</p>
              ) : filteredProducts.length ? (
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={`${product.sku}-${product.name}-${product.id || ''}`}
                      product={product}
                      cartQuantity={cartItems?.find((item) => item.sku === product.sku)?.quantity || 0}
                      onAddToBag={() => addToBag(product.sku)}
                      onOpenDetail={(idx) => {
                        setModalProduct(product);
                        setModalInitialIdx(idx || 0);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-700">No items match your search.</p>
                    <p className="mt-2 text-sm text-gray-500">Try a different search term or category filter.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Custom Query Callout Banner */}
        <section className="rounded-2xl border border-gold-500/40 bg-gradient-to-br from-maroon-900 via-[#483321] to-maroon-900 p-8 sm:p-12 text-center text-[#f8f5ed] shadow-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-500">Personalized Styling &amp; Custom Sourcing</p>
          <h2 className="mt-2 font-brand text-3xl sm:text-4xl font-medium tracking-tight text-white">
            Looking for something else? Enquire with us on WhatsApp!
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-[#f8f5ed]/80 leading-relaxed">
            Whether you are curating a bridal trousseau, matching specific family wedding colors, or seeking a rare heritage weave, our master stylists are ready to share video walkthroughs and tailored collections.
          </p>
          <div className="mt-6 flex justify-center">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I am looking for a customized saree/jewelry order from https://shreivara-handlooms.vercel.app. Could you please assist me?')}`}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer inline-flex items-center gap-2.5 rounded-full bg-[#25d366] px-6 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white shadow-md transition hover:bg-[#1ebe5d]"
            >
              <span className="h-4 w-4 shrink-0"><WhatsAppIcon /></span>
              Enquire with us on WhatsApp
            </a>
          </div>
        </section>

        {/* Dedicated Inline About Us Section */}
        <section id="about-us" className="scroll-mt-24 rounded-2xl border border-[#ded5c6] bg-white p-6 sm:p-10 lg:p-12 shadow-xs">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-600">The Shreivara Heritage</p>
              <h2 className="mt-2 font-brand text-3xl sm:text-4xl font-medium text-maroon-900">
                Sarees and fine jewelry for life's treasured moments.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-gray-700">
                Founded with a devotion to authentic Indian textiles, Shreivara Handlooms bridges generational artisan weaving with modern elegance. From the pure zari temple borders of Kanchipuram to the featherlight cottons of Mangalagiri and handcrafted South Indian bridal jewelry, every piece in our studio is personally curated for longevity, beauty, and festive warmth.
              </p>

              {/* Callout Box */}
              <div className="mt-6 rounded-xl border border-gold-500/50 bg-[#faf6ee] p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-maroon-900">Customized Bridal &amp; Festive Orders</p>
                <p className="mt-1 text-xs sm:text-sm text-[#5c4a35] leading-relaxed">
                  Reach us on WhatsApp for inquiries and customized orders. We provide real-time drape previews, blouse fabric suggestions, and worldwide delivery support.
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to enquire about your custom saree & jewelry orders on https://shreivara-handlooms.vercel.app.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer mt-3.5 inline-flex items-center gap-2 rounded-lg bg-maroon-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-maroon-800"
                >
                  <span className="h-3.5 w-3.5"><WhatsAppIcon /></span>
                  Order / Inquire on WhatsApp (+91 90005 10329)
                </a>
              </div>
            </div>

            {/* Shop Location & Address Details */}
            <div className="rounded-xl border border-[#e4dccd] bg-[#fbf9f4] p-6 space-y-5">
              <h3 className="font-brand text-xl font-bold text-maroon-900">Shop Location &amp; Visit Details</h3>
              <div className="space-y-3 text-xs sm:text-sm text-gray-700">
                <div className="flex gap-3">
                  <span className="text-gold-600 font-bold shrink-0">📍 Studio Address:</span>
                  <div>
                    <p className="font-semibold text-maroon-900">Shreivara Handlooms &amp; Fine Jewelry</p>
                    <p className="text-gray-600">Plot No. 42, Heritage Weavers Lane, Jubilee Hills</p>
                    <p className="text-gray-600">Hyderabad, Telangana — 500033, India</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-gold-600 font-bold shrink-0">🕒 Studio Hours:</span>
                  <p className="text-gray-600">Monday – Saturday: 10:30 AM – 7:30 PM IST</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-gold-600 font-bold shrink-0">📞 Direct Phone &amp; WhatsApp:</span>
                  <a href="tel:+919000510329" className="font-medium text-maroon-900 hover:underline">+91 90005 10329</a>
                </div>
                <div className="flex gap-3">
                  <span className="text-gold-600 font-bold shrink-0">✉️ Email:</span>
                  <a href="mailto:shreivara@gmail.com" className="text-gray-600 hover:underline">shreivara@gmail.com</a>
                </div>
                <div className="flex gap-3">
                  <span className="text-gold-600 font-bold shrink-0">✈️ Shipping:</span>
                  <p className="text-gray-600">Express doorstep delivery across India and worldwide shipping via trusted international couriers.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Product Detail & Enlarge Modal */}
      {modalProduct && (
        <ProductDetailModal
          product={modalProduct}
          initialIdx={modalInitialIdx}
          onClose={() => setModalProduct(null)}
          cartQuantity={cartItems?.find((item) => item.sku === modalProduct.sku)?.quantity || 0}
          onAddToBag={() => addToBag(modalProduct.sku)}
        />
      )}
    </main>
  );
}
