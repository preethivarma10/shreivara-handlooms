import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { categories, WHATSAPP_NUMBER } from '../data/products.js';
import { DEFAULT_PRODUCTS } from '../components/SiteLayout.jsx';
import { supabase } from '../lib/supabase';

function normalizeProduct(item, idx = 0) {
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

function ProductCard({ product, cartQuantity = 0, onAddToBag }) {
  const p = product;
  const rawSizes = p.sizes || '';
  const sizes = Array.isArray(rawSizes)
    ? rawSizes
    : typeof rawSizes === 'string' && rawSizes
      ? rawSizes.split(',').map((size) => size.trim()).filter(Boolean)
      : [];

  const rawImage = p.image_url || p.images || p.image || p.imageUrl || p.photo || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
  const resolvedImage = Array.isArray(rawImage) ? rawImage[0] : rawImage;
  const imageUrl = typeof resolvedImage === 'string' && resolvedImage.startsWith('/')
    ? `${window.location.origin}${resolvedImage}`
    : resolvedImage;

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
    `• SKU: ${sku}`,
    `• Category: ${category}`,
    `• Price: ${formatCurrency(sellingPrice)}`,
    originalPrice > sellingPrice ? `• Original Price: ${formatCurrency(originalPrice)}` : '',
    offerDetails ? `• Offer: ${offerDetails}` : '',
    description ? `• Details: ${description}` : '',
    '• Storefront: https://shreivara-handlooms.vercel.app',
    '',
    'Please confirm availability and delivery details.'
  ].filter(Boolean).join('\n'));

  const discount = originalPrice > sellingPrice ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;

  return (
    <article className="group overflow-hidden rounded-sm border border-[#e1d8c9] bg-[#fbf9f4] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(58,43,25,0.12)]">
      <div className="relative overflow-hidden bg-[#e8dfd0]">
        <img
          src={imageUrl}
          alt={name}
          className="h-[320px] w-full object-cover transition duration-700 group-hover:scale-[1.035]"
          loading="lazy"
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3 bg-[#f6f2e9]/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-maroon-900">
            {discount}% off
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600">{category}</p>
        <h3 className="mt-2 min-h-[52px] font-brand text-2xl font-medium leading-tight text-maroon-900">{name}</h3>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-semibold text-maroon-900">{formatCurrency(sellingPrice)}</span>
          {originalPrice > sellingPrice && (
            <span className="text-sm text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
          )}
          <span className="ml-auto text-[10px] uppercase tracking-widest text-gray-500">{sku}</span>
        </div>
        {offerDetails && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-maroon-900">{offerDetails}</p>}
        {description && !offerDetails && <p className="mt-2 text-xs text-gray-600 line-clamp-2">{description}</p>}
        {sizes.length > 0 && <p className="mt-2 text-sm text-gray-600">Available sizes: {sizes.join(', ')}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2 mt-auto">
          <a
            href={`https://wa.me/919000510329?text=${waMessage}`}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-sm bg-[#25d366] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#1ebe5d]"
          >
            <span className="h-3.5 w-3.5 shrink-0"><WhatsAppIcon /></span>
            Order on WhatsApp
          </a>
          <button
            type="button"
            disabled={isMaxReached || isSoldOut}
            onClick={onAddToBag}
            className={`cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-sm border px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
              isMaxReached || isSoldOut
                ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 opacity-60'
                : 'border-maroon-900 text-maroon-900 hover:bg-maroon-900 hover:text-[#f8f5ed]'
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
    setProducts: setParentProducts,
    cartItems,
    addToBag
  } = useOutletContext();

  const [products, setProducts] = useState(DEFAULT_PRODUCTS.map((p, idx) => normalizeProduct(p, idx)));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Shreivara Handlooms | Authentic Sarees & Fine Jewelry';
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchProducts() {
      setLoading(true);
      try {
        const { data, error: supabaseError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) {
          console.warn('Supabase fetch error, fallback to local products:', supabaseError.message);
          if (isMounted) {
            const fallback = DEFAULT_PRODUCTS.map((p, idx) => normalizeProduct(p, idx));
            setProducts(fallback);
            if (setParentProducts) setParentProducts(fallback);
            setError(supabaseError.message);
            setLoading(false);
          }
        } else if (data && data.length > 0) {
          if (isMounted) {
            const normalized = data.map((item, idx) => normalizeProduct(item, idx));
            setProducts(normalized);
            if (setParentProducts) setParentProducts(normalized);
            setLoading(false);
          }
        } else {
          if (isMounted) {
            const fallback = DEFAULT_PRODUCTS.map((p, idx) => normalizeProduct(p, idx));
            setProducts(fallback);
            if (setParentProducts) setParentProducts(fallback);
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn('Supabase connection error:', err);
        if (isMounted) {
          const fallback = DEFAULT_PRODUCTS.map((p, idx) => normalizeProduct(p, idx));
          setProducts(fallback);
          if (setParentProducts) setParentProducts(fallback);
          setLoading(false);
        }
      }
    }

    fetchProducts();
    return () => { isMounted = false; };
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
                    className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-medium transition ${
                      isSelected
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
    </main>
  );
}
