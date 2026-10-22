import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { categories, WHATSAPP_NUMBER } from '../data/products.js';

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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}



function ProductCard({ product, cartQuantity = 0, onAddToBag }) {
  const sizes = product.sizes ? product.sizes.split(',').map((size) => size.trim()).filter(Boolean) : [];
  const imageUrl = product.image.startsWith('/') ? `${window.location.origin}${product.image}` : product.image;
  const maxStock = product.stock ?? 5;
  const isSoldOut = product.available === false || maxStock <= 0;
  const isMaxReached = cartQuantity >= maxStock;

  const waMessage = encodeURIComponent([
    isSoldOut ? 'Hello Shreivara, I noticed this piece is currently sold out and would like to enquire about a custom weave / restock:' : 'Hello Shreivara, I would like to place an order:',
    `Product: ${product.name}`,
    `SKU: ${product.sku}`,
    `Category: ${product.category}`,
    `Price: ${formatCurrency(product.sellingPrice)}`,
    product.sellingPrice < product.originalPrice ? `Original price: ${formatCurrency(product.originalPrice)}` : '',
    product.offerDetails ? `Offer: ${product.offerDetails}` : '',
    sizes.length ? `Available sizes: ${sizes.join(', ')}` : '',
    `Product image: ${imageUrl}`,
    '',
    'Thank you for ordering with Shreivara! We will get back to you at the earliest.'
  ].filter(Boolean).join('\n'));

  const discount = Math.round(((product.originalPrice - product.sellingPrice) / product.originalPrice) * 100);
  const displayDiscount = discount > 0 ? `${discount}% OFF` : '40% OFF';

  return (
    <article className="fashion-card group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs hover:shadow-xl transition-all duration-300">
      {/* Full-Bleed Tall Vertical Product Image */}
      <div className="relative aspect-[2/3] sm:aspect-[3/4] w-full overflow-hidden bg-neutral-100">
        <img
          src={product.image}
          alt={product.name}
          className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
            isSoldOut ? 'grayscale-40 opacity-80' : ''
          }`}
          loading="lazy"
        />
        {/* Subtle hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Floating Discount Badge or Sold Out Badge */}
        <div className="absolute left-3 top-3 z-10 pointer-events-none flex flex-col gap-1">
          {isSoldOut ? (
            <span className="rounded-md bg-neutral-900/90 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              SOLD OUT
            </span>
          ) : (
            <span className="rounded-md bg-[#D9383A] text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              {displayDiscount}
            </span>
          )}
        </div>

        {/* Top-Right Star Rating & SKU */}
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1 rounded-md bg-white/95 backdrop-blur-md px-2 py-0.5 text-[9.5px] font-bold text-maroon-950 border border-neutral-200 shadow-2xs">
            <span className="text-[#D4AF37]">★</span> 4.9
          </span>
          <span className="rounded-md bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[8.5px] font-mono tracking-wider text-white uppercase shadow-2xs">
            {product.sku}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600">
            {product.category}
          </p>
          <span className="text-[9.5px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            Handloom Mark
          </span>
        </div>

        {/* Clean Minimal Title */}
        <h3 className="mt-1.5 font-brand text-lg sm:text-xl font-normal leading-snug text-neutral-900 group-hover:text-maroon-800 transition-colors line-clamp-1">
          {product.name}
        </h3>

        {/* Original vs Discounted Prices */}
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold text-maroon-950 font-brand tracking-tight">
            {formatCurrency(product.sellingPrice)}
          </span>
          {product.originalPrice > product.sellingPrice && (
            <span className="text-xs text-neutral-400 line-through font-light">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>

        {product.offerDetails && (
          <p className="mt-2 rounded-lg border border-gold-200/80 bg-gold-50/70 px-2.5 py-1 text-[11px] font-medium text-maroon-900 flex items-center gap-1">
            <span className="text-gold-600">✦</span> {product.offerDetails}
          </p>
        )}

        {sizes.length > 0 && (
          <p className="mt-1 text-[11px] text-neutral-500 font-light">Sizes: {sizes.join(', ')}</p>
        )}

        {/* Action Buttons: Order on WhatsApp & Add to Cart */}
        <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#075E54] hover:bg-[#128C7E] px-2 py-2.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.04em] text-white shadow-xs transition-all active:scale-[0.98] text-center"
          >
            <span className="h-3.5 w-3.5 shrink-0 text-[#25D366]"><WhatsAppIcon /></span>
            Order on WhatsApp
          </a>
          <button
            type="button"
            disabled={isSoldOut || isMaxReached}
            onClick={onAddToBag}
            className={`cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.04em] transition-all active:scale-[0.98] text-center ${
              isSoldOut
                ? 'cursor-not-allowed border border-neutral-200 bg-neutral-100 text-neutral-400'
                : isMaxReached
                ? 'cursor-not-allowed border border-neutral-200 bg-neutral-100 text-neutral-400'
                : 'border border-maroon-900 bg-maroon-900 text-gold-100 hover:bg-maroon-800 shadow-xs'
            }`}
          >
            <span className="h-3.5 w-3.5 shrink-0"><BagIcon /></span>
            {isSoldOut ? 'Sold Out' : isMaxReached ? 'Limit Reached' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}


export default function HomePage() {
  const {
    query,
    category,
    setCategory,
    products,
    productsLoading,
    productsError,
    cartItems,
    addToBag
  } = useOutletContext();

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const selCat = (category || 'ALL').toUpperCase();

    return products.filter((product) => {
      const pCat = (product.category || '').toUpperCase();

      let matchesCategory = false;
      if (selCat === 'ALL' || selCat === 'ALL COLLECTIONS' || selCat === 'ALL SAREES') {
        matchesCategory = true;
      } else if (selCat === 'KANCHI PATTU') {
        matchesCategory = pCat.includes('KANCHI');
      } else if (selCat === 'MANGALAGIRI') {
        matchesCategory = pCat.includes('MANGALAGIRI');
      } else if (selCat === 'FANCY SILK') {
        matchesCategory = pCat.includes('FANCY');
      } else if (selCat === 'ORGANZA' || selCat === 'ORGANZA & CHIFFON') {
        matchesCategory = pCat.includes('ORGANZA');
      } else if (selCat === 'JEWELRY' || selCat === 'JEWELLERY') {
        matchesCategory = pCat.includes('JEWEL');
      } else {
        matchesCategory = pCat === selCat;
      }

      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.sku.toLowerCase().includes(normalizedQuery) ||
        pCat.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  useEffect(() => {
    document.title = 'Shreivara Handlooms | Premium Sarees & Fine Jewelry';
  }, []);



  return (
    <main id="top" className="w-full flex-1">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-16 sm:space-y-20 lg:space-y-24">

        {/* 1. Festive Hero & Editorial Highlight Banner (Sutisancha Aesthetic) */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-maroon-950 via-[#3B0A12] to-maroon-900 text-white shadow-2xl border border-gold-500/30">
          {/* Decorative gold patterned background watermark */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4af37\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
            }}
          />

          <div className="relative z-10 grid gap-8 lg:grid-cols-12 items-center p-6 sm:p-10 lg:p-14">
            {/* Left Column: Festive Editorial Copy & Offers */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/50 bg-gold-400/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-300 backdrop-blur-xs">
                <span>✦</span> Festive Utsav Edit • Up to 40% Off <span>✦</span>
              </div>

              <h1 className="font-brand text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-gold-100 leading-[1.1]">
                Celebrate in Timeless Elegance
              </h1>

              {/* Editorial Lifestyle Block */}
              <div className="border-l-2 border-gold-400/60 pl-4 py-1">
                <p className="font-serif italic text-base sm:text-xl text-gold-200/95 font-light leading-snug">
                  “Celebrate in Timeless Elegance — Inspired by India’s rich weaving heritage.”
                </p>
              </div>

              <p className="text-xs sm:text-sm text-gold-100/80 leading-relaxed font-light max-w-xl">
                Immerse yourself in authentic Kanchipuram pure silk, airy Mangalagiri weaves, and heirloom South Indian bridal jewelry. Handcrafted by generational master weavers for weddings, pujas, and treasured festivities.
              </p>

              {/* Festive Promo Code Pill */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="inline-flex items-center gap-2 rounded-xl border border-gold-400/50 bg-black/30 backdrop-blur-md px-4 py-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gold-300 font-semibold">Festive Code:</span>
                  <span className="font-mono text-sm font-bold tracking-wider text-white bg-maroon-800/90 px-2.5 py-0.5 rounded border border-gold-400/50">
                    UTSAV10
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold">Extra 10% OFF</span>
                </div>
                <span className="text-[11px] text-gold-300/70 font-light">• Applicable on all prepaid &amp; WhatsApp orders</span>
              </div>

              {/* Primary Hero Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <a
                  href="#catalog"
                  className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-300 via-gold-400 to-gold-300 text-maroon-950 hover:brightness-105 px-6 sm:px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] shadow-lg transition-all active:scale-[0.98]"
                >
                  Explore Collection
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to schedule a personal video walkthrough of your festive saree collection.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-maroon-900/60 hover:bg-maroon-800 text-gold-100 px-5 sm:px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] backdrop-blur-xs shadow-xs transition-all active:scale-[0.98]"
                >
                  <span className="h-3.5 w-3.5 text-[#25d366]"><WhatsAppIcon /></span>
                  Video Walkthrough
                </a>
              </div>
            </div>

            {/* Right Column: Hero High-Fashion Imagery */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-gold-400/40 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85"
                  alt="Festive Royal Kanchipuram Handloom Saree"
                  className="h-full w-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-gold-100">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-300">Handcrafted Legacy</p>
                    <p className="font-brand text-lg sm:text-xl font-normal text-white">Pure Zari Kanjivaram &amp; Fine Jewelry</p>
                  </div>
                  <span className="rounded-full bg-gold-400/20 backdrop-blur-md border border-gold-400/50 px-3 py-1 text-[10px] font-mono text-gold-200">
                    ★ 4.9 / 5.0
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Top Collections & Sutisancha Tall Vertical Grid Section */}
        <section id="collections" className="scroll-mt-28">
          <div id="catalog" className="scroll-mt-28">
            <div className="mb-8 sm:mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between border-b border-gold-200/80 pb-6">
              <div>
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-gold-600 mb-2 block">
                  Curated Handlooms &amp; Fine Jewelry
                </span>
                <h2 className="font-brand text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-maroon-950">
                  Top Collections
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-neutral-600 font-light">
                  Sarees to Treasures • Handcrafted with Heritage Artistry
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to schedule a personal walkthrough on WhatsApp.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-maroon-900 bg-maroon-900 text-gold-100 hover:bg-maroon-800 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <span className="h-3.5 w-3.5 text-[#25d366]"><WhatsAppIcon /></span>
                  Video Consultation
                </a>
                <span className="rounded-full border border-gold-300/80 bg-white px-4 py-2.5 text-xs font-medium text-maroon-900 shadow-2xs font-mono" aria-live="polite">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'Design' : 'Designs'}
                </span>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="mb-10 sm:mb-12 flex flex-wrap gap-2.5 sm:gap-3" aria-label="Filter collections by category">
              {['ALL', 'KANCHI PATTU', 'MANGALAGIRI', 'FANCY SILK', 'ORGANZA', 'JEWELRY'].map((item) => {
                const isSelected =
                  (item === 'ALL' && (category === 'ALL' || category === 'All Collections' || category === 'All Sarees')) ||
                  category.toUpperCase() === item.toUpperCase() ||
                  (item === 'ORGANZA' && category === 'Organza & Chiffon') ||
                  (item === 'JEWELRY' && category === 'Jewellery');
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setCategory(item)}
                    className={`cursor-pointer rounded-full px-5 py-2 text-xs font-semibold tracking-wider transition-all uppercase ${isSelected
                      ? 'bg-maroon-900 text-gold-100 shadow-sm border border-gold-400/40'
                      : 'bg-white hover:bg-gold-50 text-maroon-900 hover:text-maroon-950 border border-gold-200/80 shadow-2xs'
                      }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {/* Products Grid — Tall Vertical Sutisancha Card Proportions */}
            <div id="catalog-grid" className="scroll-mt-28">
              {productsLoading ? (
                <div className="py-24 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-maroon-700 border-r-transparent mb-3" />
                  <p className="text-sm font-medium text-maroon-600 font-light">Curating the collection…</p>
                </div>
              ) : productsError ? (
                <p className="py-16 text-center text-sm text-red-800" role="alert">{productsError}</p>
              ) : filteredProducts.length ? (
                <div className="grid gap-5 sm:gap-6 lg:gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={`${product.sku}-${product.name}`}
                      product={product}
                      cartQuantity={cartItems?.find((item) => item.sku === product.sku)?.quantity || 0}
                      onAddToBag={() => addToBag(product.sku)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-gold-300 bg-white/70 p-12 text-center shadow-xs">
                  <div>
                    <p className="font-brand text-2xl font-normal text-maroon-800">No pieces match your search.</p>
                    <p className="mt-2 text-xs text-maroon-400 font-light">Try selecting a different category filter or clear your search term.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Custom Query Callout Banner */}
        <section className="rounded-3xl border border-gold-400/30 warm-gradient p-10 sm:p-14 lg:p-16 text-center text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23c59a58\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />
          <div className="relative z-10 max-w-3xl mx-auto space-y-5">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-gold-300 border border-gold-500/30 px-4 py-1.5 rounded-full bg-maroon-800/60 backdrop-blur-xs">
              Personalized Styling &amp; Custom Sourcing
            </span>
            <h2 className="font-brand text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-gold-100 leading-tight">
              Looking for something else? Enquire with us on WhatsApp!
            </h2>
            <p className="mx-auto max-w-2xl text-xs sm:text-sm text-gold-300/80 leading-relaxed font-light">
              Whether you are curating a bridal trousseau, matching specific family wedding colors, or seeking a rare heritage weave, our master stylists are ready to share video walkthroughs and tailored collections.
            </p>
            <div className="pt-2 flex justify-center">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I am looking for a customized saree/jewelry order. Could you please assist me?')}`}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-300 via-gold-400 to-gold-300 text-maroon-950 hover:brightness-105 px-8 py-3.5 text-xs font-bold uppercase tracking-[0.16em] shadow-lg transition-all active:scale-[0.98]"
              >
                <span className="h-4 w-4 shrink-0 text-[#25d366]"><WhatsAppIcon /></span>
                Enquire with us on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* 4. Customer Testimonials & Reviews Section (Sutisancha Style) */}
        <section id="reviews" className="scroll-mt-28 rounded-3xl border border-gold-200/90 bg-[#FAF8F5] p-8 sm:p-12 lg:p-14 shadow-xs relative">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-gold-600 mb-2 block">
              Client Diaries &amp; Stories
            </span>
            <h2 className="font-brand text-3xl sm:text-4xl lg:text-5xl font-normal text-maroon-950">
              Loved by Brides &amp; Connoisseurs Worldwide
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 font-light">
              Over 1,200+ heirloom sarees and handcrafted jewelry sets delivered globally with personalized WhatsApp consultations.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Review 1 */}
            <div className="flex flex-col justify-between rounded-2xl border border-gold-200/80 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-1 text-[#D4AF37] text-sm mb-3">
                  ★★★★★
                </div>
                <p className="font-serif italic text-sm text-maroon-950 leading-relaxed">
                  “The drape of the Royal Kanjivaram was breathtaking for my sister’s wedding. The zari work is pure and authentic, and ordering over WhatsApp with video previews made all the difference!”
                </p>
              </div>
              <div className="pt-4 border-t border-gold-100 mt-4">
                <p className="font-semibold text-xs text-maroon-900">Sravani Rao</p>
                <p className="text-[10px] text-gold-600 font-medium">Hyderabad • Verified Bridal Order</p>
              </div>
            </div>

            {/* Review 2 */}
            <div className="flex flex-col justify-between rounded-2xl border border-gold-200/80 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-1 text-[#D4AF37] text-sm mb-3">
                  ★★★★★
                </div>
                <p className="font-serif italic text-sm text-maroon-950 leading-relaxed">
                  “I was skeptical buying handlooms online, but Shreivara’s Mangalagiri weave is featherlight and pure cotton elegance. Fast shipping and beautiful packaging.”
                </p>
              </div>
              <div className="pt-4 border-t border-gold-100 mt-4">
                <p className="font-semibold text-xs text-maroon-900">Ananya Verma</p>
                <p className="text-[10px] text-gold-600 font-medium">Bangalore • Verified Buyer</p>
              </div>
            </div>

            {/* Review 3 */}
            <div className="flex flex-col justify-between rounded-2xl border border-gold-200/80 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-1 text-[#D4AF37] text-sm mb-3">
                  ★★★★★
                </div>
                <p className="font-serif italic text-sm text-maroon-950 leading-relaxed">
                  “The temple choker set matches my silk saree flawlessly. The antique gold finish is heirloom quality. Highly recommend their personalized WhatsApp assistance.”
                </p>
              </div>
              <div className="pt-4 border-t border-gold-100 mt-4">
                <p className="font-semibold text-xs text-maroon-900">Dr. Pooja Reddy</p>
                <p className="text-[10px] text-gold-600 font-medium">Chennai • Fine Jewelry Order</p>
              </div>
            </div>

            {/* Review 4 */}
            <div className="flex flex-col justify-between rounded-2xl border border-gold-200/80 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-1 text-[#D4AF37] text-sm mb-3">
                  ★★★★★
                </div>
                <p className="font-serif italic text-sm text-maroon-950 leading-relaxed">
                  “Authentic craft at transparent prices. They even showed me the drape on a WhatsApp video call before dispatching. Simply outstanding customer care!”
                </p>
              </div>
              <div className="pt-4 border-t border-gold-100 mt-4">
                <p className="font-semibold text-xs text-maroon-900">Meenakshi Sundaram</p>
                <p className="text-[10px] text-gold-600 font-medium">Mumbai • Verified Order</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Dedicated Inline About Us Section */}
        <section id="about-us" className="scroll-mt-28 rounded-3xl border border-gold-200/90 bg-cream-50 p-8 sm:p-12 lg:p-16 shadow-sm relative">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <span className="inline-block text-[10.5px] font-semibold uppercase tracking-[0.28em] text-gold-600 mb-2.5">
                The Shreivara Heritage
              </span>
              <h2 className="font-brand text-3xl sm:text-4xl lg:text-5xl font-normal text-maroon-900 leading-tight">
                Sarees and fine jewelry for life's treasured moments.
              </h2>
              <p className="mt-4 text-xs sm:text-sm leading-relaxed text-maroon-700/80 font-light">
                Founded with a devotion to authentic Indian textiles, Shreivara Handlooms bridges generational artisan weaving with modern elegance. From the pure zari temple borders of Kanchipuram to the featherlight cottons of Mangalagiri and handcrafted South Indian bridal jewelry, every piece in our studio is personally curated for longevity, beauty, and festive warmth.
              </p>

              {/* Callout Box */}
              <div className="mt-8 rounded-2xl border border-gold-300/80 bg-gold-50/80 p-6 sm:p-7 shadow-2xs">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-maroon-900">Customized Bridal &amp; Festive Orders</p>
                <p className="mt-2 text-xs sm:text-sm text-maroon-700/80 leading-relaxed font-light">
                  Reach us on WhatsApp for inquiries and customized orders. We provide real-time previews, blouse fabric suggestions, and worldwide delivery support.
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to enquire about your custom saree & jewelry orders.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer mt-5 inline-flex items-center gap-2 rounded-full bg-maroon-900 hover:bg-maroon-800 px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-gold-100 transition shadow-xs border border-gold-400/30"
                >
                  <span className="h-3.5 w-3.5 text-[#25d366]"><WhatsAppIcon /></span>
                  Order / Inquire on WhatsApp (+91 90005 10329)
                </a>
              </div>
            </div>

            {/* Shop Location & Address Details */}
            <div className="rounded-2xl border border-gold-200 bg-white p-8 space-y-6 shadow-sm">
              <div className="border-b border-gold-200 pb-4">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.25em] text-gold-600">Atelier Visit</p>
                <h3 className="font-brand text-2xl font-normal text-maroon-900 mt-1">Shop Location &amp; Visit Details</h3>
              </div>
              <div className="space-y-4 text-xs sm:text-sm text-maroon-700">
                <div className="flex gap-3.5 items-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-50 border border-gold-200 text-sm shadow-2xs">📍</span>
                  <div>
                    <p className="font-semibold text-maroon-900">Studio Address</p>
                    <p className="text-maroon-700/80 mt-0.5">Shreivara Handlooms &amp; Fine Jewelry</p>
                    <p className="text-maroon-700/80">Plot No. 42, Heritage Weavers Lane, Jubilee Hills</p>
                    <p className="text-maroon-700/80">Hyderabad, Telangana — 500033, India</p>
                  </div>
                </div>
                <div className="flex gap-3.5 items-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-50 border border-gold-200 text-sm shadow-2xs">🕒</span>
                  <div>
                    <p className="font-semibold text-maroon-900">Studio Hours</p>
                    <p className="text-maroon-700/80 mt-0.5">Monday – Saturday: 10:30 AM – 7:30 PM IST</p>
                  </div>
                </div>
                <div className="flex gap-3.5 items-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-50 border border-gold-200 text-sm shadow-2xs">📞</span>
                  <div>
                    <p className="font-semibold text-maroon-900">Phone &amp; WhatsApp</p>
                    <a href="tel:+919000510329" className="text-maroon-900 font-medium hover:underline mt-0.5 block">+91 90005 10329</a>
                  </div>
                </div>
                <div className="flex gap-3.5 items-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-50 border border-gold-200 text-sm shadow-2xs">✉️</span>
                  <div>
                    <p className="font-semibold text-maroon-900">Email Inquiries</p>
                    <a href="mailto:shreivara@gmail.com" className="text-maroon-900 font-medium hover:underline mt-0.5 block">shreivara@gmail.com</a>
                  </div>
                </div>
                <div className="flex gap-3.5 items-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-50 border border-gold-200 text-sm shadow-2xs">✈️</span>
                  <div>
                    <p className="font-semibold text-maroon-900">Worldwide Shipping</p>
                    <p className="text-maroon-700/80 mt-0.5">Express doorstep delivery across India and reliable worldwide shipping via DHL / FedEx.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>


    </main>
  );
}