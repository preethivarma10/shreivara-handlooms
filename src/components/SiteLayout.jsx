import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { categories, WHATSAPP_NUMBER } from '../data/products.js';
import shreivaraLogo from '../assets/shreivara-logo.jpg';

export const DEFAULT_PRODUCTS = [
  {
    sku: 'SHR-001',
    name: 'Royal Kanjivaram Silk',
    category: 'Kanchi Pattu',
    originalPrice: 18999,
    sellingPrice: 14999,
    sizes: 'Free size',
    stock: 4,
    offerDetails: 'Grand launch offer — limited stock!',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583391733956-62e74ed5b29c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    sku: 'SHR-002',
    name: 'Mangalagiri Cotton Elegance',
    category: 'Mangalagiri',
    originalPrice: 5999,
    sellingPrice: 4499,
    sizes: 'Free size',
    stock: 5,
    offerDetails: '',
    image: 'https://images.unsplash.com/photo-1583391733956-62e74ed5b29c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1583391733956-62e74ed5b29c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    sku: 'SHR-003',
    name: 'Fancy Silk Fiesta',
    category: 'Fancy Silk',
    originalPrice: 9499,
    sellingPrice: 7299,
    sizes: 'Free size',
    stock: 3,
    offerDetails: 'Buy 2, get 10% off',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    sku: 'SHR-004',
    name: 'Organza Blossom',
    category: 'Organza & Chiffon',
    originalPrice: 7999,
    sellingPrice: 5999,
    sizes: 'Free size',
    stock: 5,
    offerDetails: '',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583391733956-62e74ed5b29c?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    sku: 'JWL-001',
    name: 'Antique Goddess Temple Choker & Earrings Set',
    category: 'Jewellery',
    originalPrice: 11999,
    sellingPrice: 7999,
    sizes: 'Free size (Adjustable dori)',
    stock: 3,
    offerDetails: 'Authentic South Indian temple bridal jewelry set',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    sku: 'JWL-002',
    name: 'Royal Kundan & Pearl Heritage Necklace',
    category: 'Jewellery',
    originalPrice: 9999,
    sellingPrice: 6499,
    sizes: 'Free size',
    stock: 2,
    offerDetails: 'Handcrafted Kundan with pearl drop accents',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

const StoreContext = createContext(null);

export function useStore() {
  return useContext(StoreContext);
}

function SearchIcon() {
  return (
    <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

function addCartItem(current, sku, maxStock = 5) {
  const existing = current.find((item) => item.sku === sku);
  if (existing) {
    if (existing.quantity >= maxStock) return current;
    return current.map((item) => (item.sku === sku ? { ...item, quantity: item.quantity + 1 } : item));
  }
  return [...current, { sku, quantity: 1 }];
}

function readStoredList(key, validateItem) {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new TypeError('Stored value must be a list.');
    return parsed.filter(validateItem);
  } catch (error) {
    console.error(`Could not read ${key} from browser storage.`, error);
    return [];
  }
}

function StorePanel({ panel, products, cartItems, setCartItems, onClose }) {
  if (!panel || panel !== 'cart') return null;

  const visibleCart = cartItems
    .map((item) => ({ ...item, product: products.find((product) => product.sku === item.sku) }))
    .filter((item) => item.product);

  const subtotal = visibleCart.reduce((sum, item) => {
    const price = Number(item.product.sellingPrice ?? item.product.selling_price ?? item.product.price ?? 0);
    return sum + price * item.quantity;
  }, 0);

  // 1. GST Calculation: 5% standard rate for Indian handlooms, sarees & textiles
  const GST_RATE = 0.05;
  const gst = Math.round(subtotal * GST_RATE);

  // 2. Shipping Calculation: Free delivery on orders ₹3,000 & above, otherwise ₹100 express courier across India
  const FREE_SHIPPING_THRESHOLD = 3000;
  const isFreeDelivery = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = subtotal > 0 ? (isFreeDelivery ? 0 : 100) : 0;

  // 3. Total Amount Payable
  const grandTotal = subtotal + gst + shipping;

  function startWhatsAppOrder() {
    const itemLines = visibleCart.map(({ product, quantity }) => {
      const price = Number(product.sellingPrice ?? product.selling_price ?? product.price ?? 0);
      const lineTotal = price * quantity;
      return `• ${product.name} [Code: ${product.sku}] × ${quantity} = ${formatCurrency(lineTotal)}`;
    });
    const message = [
      '🛍️ *New Order from https://shreivara-handlooms.vercel.app:*',
      '',
      '*Items ordered:*',
      ...itemLines,
      '',
      '💰 *Payment & Cost Breakdown:*',
      `• Items Subtotal: ${formatCurrency(subtotal)}`,
      `• GST (5% Handloom): ${formatCurrency(gst)}`,
      `• Shipping & Delivery: ${shipping === 0 ? 'FREE (Order above ₹3,000)' : formatCurrency(shipping)}`,
      `• *Total Payable: ${formatCurrency(grandTotal)}*`,
      '',
      isFreeDelivery ? '🎉 *Eligible for Free Delivery!*' : '',
      '',
      'Please reply with payment details (UPI/GPay/PhonePe/Bank Transfer) to complete order.',
      '',
      '📦 *Delivery details:*',
      'Name:',
      'Address:',
      'City & Pincode:',
      'Phone:'
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close panel" onClick={onClose} className="cursor-pointer absolute inset-0 bg-[#21180f]/35 backdrop-blur-[2px]" />
      <section role="dialog" aria-modal="true" aria-labelledby="store-panel-title" className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-[#f8f5ed] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e4dccd] px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-600">Your selection</p>
            <h2 id="store-panel-title" className="mt-1 font-brand text-2xl font-medium text-maroon-900">Shopping Cart</h2>
          </div>
          <div className="flex items-center gap-2">
            {visibleCart.length > 0 && (
              <button
                type="button"
                onClick={() => setCartItems([])}
                className="cursor-pointer text-[11px] font-medium text-red-700 hover:text-red-900 underline underline-offset-2 px-2 py-1"
                title="Remove all items from shopping cart"
              >
                Clear Cart
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full text-xl text-gray-600 transition hover:bg-[#e9e1d3]">×</button>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {visibleCart.length ? visibleCart.map(({ product, quantity }) => {
            const maxStock = product.stock ?? 5;
            const isMax = quantity >= maxStock;
            const price = Number(product.sellingPrice ?? product.selling_price ?? product.price ?? 0);
            return (
              <article key={product.sku} className="flex gap-4 border-b border-[#e4dccd] pb-4">
                <img src={product.image || product.image_url} alt={product.name} className="h-24 w-20 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-brand text-lg font-medium text-maroon-900">{product.name}</h3>
                  <p className="mt-1 text-sm text-gray-600">Code: {product.sku} · {formatCurrency(price)}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={`Remove one ${product.name}`}
                      onClick={() => setCartItems((current) => current.flatMap((item) => item.sku !== product.sku ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []))}
                      className="cursor-pointer h-8 w-8 rounded-full border border-[#d9d0c1] text-lg hover:border-maroon-900"
                    >−</button>
                    <span className="text-sm font-medium">{quantity}</span>
                    <button
                      type="button"
                      disabled={isMax}
                      aria-label={`Add one ${product.name}`}
                      onClick={() => setCartItems((current) => current.map((item) => item.sku === product.sku ? { ...item, quantity: Math.min(maxStock, item.quantity + 1) } : item))}
                      className={`h-8 w-8 rounded-full border text-lg transition ${
                        isMax
                          ? 'cursor-not-allowed border-gray-200 text-gray-300'
                          : 'cursor-pointer border-[#d9d0c1] hover:border-maroon-900'
                      }`}
                    >+</button>
                    {isMax && <span className="text-[10px] uppercase tracking-wider text-amber-700">Max stock</span>}
                    <button
                      type="button"
                      onClick={() => setCartItems((current) => current.filter((item) => item.sku !== product.sku))}
                      className="cursor-pointer ml-auto text-xs text-gray-500 underline underline-offset-2 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          }) : (
            <div className="py-16 text-center space-y-3">
              <span className="text-4xl block">🛍️</span>
              <p className="font-brand text-xl text-gray-600">Your cart is empty.</p>
              <p className="text-xs text-neutral-500">Explore our handcrafted sarees & jewelry and add your favorites!</p>
            </div>
          )}
        </div>

        {visibleCart.length > 0 && (
          <div className="border-t border-[#e4dccd] px-6 py-4 space-y-3 bg-[#f5f0e4]">
            {/* Bill Summary with Calculated GST and Shipping */}
            <div className="rounded-xl border border-[#ded5c6] bg-white p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gold-700">Payment Breakdown</p>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {visibleCart.length} {visibleCart.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Free Delivery Qualified / Progress Notice */}
              {isFreeDelivery ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200/80 px-3 py-2 text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                  <span>🎉</span>
                  <span>You qualify for <strong>FREE Delivery</strong> across India!</span>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 border border-amber-200/80 px-3 py-2 text-xs text-amber-900 flex items-center justify-between">
                  <span>Add <strong>{formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)}</strong> more for <strong>FREE Delivery</strong>!</span>
                  <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded">₹100 Shipping</span>
                </div>
              )}

              {/* Itemized Calculation Rows */}
              <div className="space-y-2 text-xs text-neutral-700 pt-0.5">
                <div className="flex justify-between items-center">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-neutral-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span>GST (5% Handloom)</span>
                    <span className="text-[10px] text-neutral-400">(CGST 2.5% + SGST 2.5%)</span>
                  </div>
                  <span className="font-semibold text-neutral-900">+{formatCurrency(gst)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Shipping &amp; Delivery</span>
                  {shipping === 0 ? (
                    <span className="font-bold text-emerald-700 uppercase text-[10.5px] bg-emerald-100/80 px-2 py-0.5 rounded">FREE</span>
                  ) : (
                    <span className="font-semibold text-neutral-900">+{formatCurrency(shipping)}</span>
                  )}
                </div>
              </div>

              {/* Total Payable Row */}
              <div className="border-t border-[#e8dfd0] pt-2.5 flex justify-between items-baseline font-bold text-maroon-950">
                <div>
                  <span className="text-base font-brand">Total Payable</span>
                  <span className="text-[10px] font-normal text-neutral-500 block">Inclusive of 5% GST &amp; Shipping</span>
                </div>
                <span className="text-xl font-brand font-bold text-maroon-900">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={startWhatsAppOrder}
              className="cursor-pointer w-full rounded-xl bg-[#25d366] hover:bg-[#1ebe5d] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition shadow-sm flex items-center justify-center gap-2"
            >
              <span className="h-4 w-4 shrink-0"><WhatsAppIcon /></span>
              <span>Proceed to Pay on WhatsApp • {formatCurrency(grandTotal)}</span>
            </button>
            <p className="text-center text-[11px] text-gray-500">
              🔒 Instant UPI (GPay, PhonePe, Paytm) &amp; Bank Transfer confirmation via WhatsApp.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function SiteHeader({ query, setQuery, cartCount, onOpenPanel }) {
  const location = useLocation();
  const navigate = useNavigate();

  function navigateToTop() {
    if (location.pathname !== '/') {
      navigate('/#top');
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function navigateToCollections() {
    if (location.pathname !== '/') {
      navigate('/#collections');
      return;
    }
    const elem = document.getElementById('collections') || document.getElementById('catalog');
    elem?.scrollIntoView({ behavior: 'smooth' });
  }

  function navigateToAboutUs() {
    if (location.pathname !== '/') {
      navigate('/#about-us');
      return;
    }
    const elem = document.getElementById('about-us');
    elem?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#ded5c6] bg-[#f6f2e9]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 lg:px-8">
        {/* Left Side: Brand Logo + Home + About Us + Search Bar */}
        <div className="flex flex-1 items-center gap-3 sm:gap-6 lg:gap-8">
          <button
            type="button"
            onClick={navigateToTop}
            className="cursor-pointer group flex shrink-0 items-center gap-2.5 bg-transparent border-0 p-0 text-left"
            aria-label="Shreivara home"
          >
            <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden border-2 border-gold-400 bg-[#0A1612] shadow-xs shrink-0">
              <img
                src={shreivaraLogo}
                alt="Shreivara Official Logo"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { e.currentTarget.src = '/shreivara-logo.jpg'; }}
              />
            </div>
            <span className="font-brand text-2xl font-semibold tracking-tight text-maroon-900 sm:text-3xl">Shreivara</span>
          </button>

          <nav aria-label="Main navigation" className="flex items-center gap-4 sm:gap-6 text-sm font-medium text-gray-700">
            <button
              type="button"
              onClick={navigateToCollections}
              className="cursor-pointer transition hover:text-maroon-900 bg-transparent border-0 p-0 whitespace-nowrap"
            >
              Home
            </button>
            <button
              type="button"
              onClick={navigateToAboutUs}
              className="cursor-pointer transition hover:text-maroon-900 bg-transparent border-0 p-0 whitespace-nowrap"
            >
              About Us
            </button>
          </nav>

          {/* Search Bar placed directly next to About Us */}
          <label className="relative flex-1 max-w-xs sm:max-w-sm hidden sm:block">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sarees, jewelry, SKU..."
              aria-label="Search catalogue by name or SKU"
              className="w-full rounded-full border border-[#d9d0c1] bg-white/70 py-1.5 pl-4 pr-10 text-xs transition focus:border-maroon-800 focus:bg-white focus:outline-none sm:text-sm"
            />
            <SearchIcon />
          </label>
        </div>

        {/* Right Side: Cart */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={() => onOpenPanel('cart')}
            aria-label={`Shopping cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            className="cursor-pointer relative inline-flex h-10 w-10 items-center justify-center rounded-full text-maroon-900 transition hover:bg-[#e9e1d3]"
          >
            <span className="h-5 w-5"><BagIcon /></span>
            {cartCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon-900 px-1 text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile search bar on small screens */}
      <div className="border-t border-[#e6dfd3] px-4 py-2 sm:hidden">
        <label className="relative block w-full">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sarees, jewelry, SKU..."
            aria-label="Search catalogue"
            className="w-full rounded-full border border-[#d9d0c1] bg-white/70 py-1.5 pl-4 pr-10 text-xs transition focus:border-maroon-800 focus:bg-white focus:outline-none"
          />
          <SearchIcon />
        </label>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#ded5c6] bg-[#2d1b11] py-8 text-[#f8f5ed]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-xs sm:flex-row sm:px-6 sm:text-left lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="relative h-7 w-7 rounded-full overflow-hidden border border-gold-400 bg-[#0A1612] shadow-2xs shrink-0">
            <img
              src={shreivaraLogo}
              alt="Shreivara Official Logo"
              className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.src = '/shreivara-logo.jpg'; }}
            />
          </div>
          <p className="font-brand text-lg tracking-wider text-gold-500">Shreivara</p>
        </div>
        <p className="text-white/60">Direct WhatsApp orders · Secure delivery · Trusted quality</p>
        <div className="flex items-center gap-6 text-[#ded5c6]">
          {WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to get in touch regarding https://shreivara-handlooms.vercel.app.')}`}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer underline decoration-white/40 underline-offset-4 transition hover:text-gold-500"
            >
              WhatsApp: +91 90005 10329
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}

export default function SiteLayout() {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All Collections');
  const [products, setProducts] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('shreivara-products');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return [];
  });
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [cartItems, setCartItems] = useState(() => readStoredList('shreivara-cart', (item) =>
    typeof item?.sku === 'string' && Number.isSafeInteger(item.quantity) && item.quantity > 0));
  const [activePanel, setActivePanel] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);

  // Automatically open the cart panel when visiting /cart, /payment, /checkout, or #cart
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    const hash = location.hash.toLowerCase();
    if (
      path === '/cart' ||
      path === '/payment' ||
      path === '/checkout' ||
      hash === '#cart' ||
      hash === '#payment'
    ) {
      setActivePanel('cart');
    }
  }, [location.pathname, location.hash]);

  // Auto-prune orphaned cart items that no longer exist in the store catalog
  useEffect(() => {
    if (products && products.length > 0 && cartItems.length > 0) {
      const valid = cartItems.filter((item) => products.some((p) => p.sku === item.sku));
      if (valid.length !== cartItems.length) {
        setCartItems(valid);
        try {
          window.localStorage.setItem('shreivara-cart', JSON.stringify(valid));
        } catch (_) {}
      }
    }
  }, [products]);

  useEffect(() => {
    try {
      window.localStorage.setItem('shreivara-cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Could not save the shopping cart in browser storage.', error);
    }
  }, [cartItems]);

  function showToast(msg = 'Added to Cart!') {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
    }, 2000);
  }

  function addToCart(sku) {
    const prod = products.find((p) => p.sku === sku);
    const maxStock = prod?.stock ?? 5;
    const existing = cartItems.find((item) => item.sku === sku);
    if (existing && existing.quantity >= maxStock) {
      showToast(`Limit reached for ${prod?.name || sku} (${maxStock} max)`);
      return;
    }
    const nextQty = (existing?.quantity || 0) + 1;
    setCartItems((current) => addCartItem(current, sku, maxStock));
    showToast(`✓ Added to Cart (${nextQty} in cart)`);
  }

  // Calculate cartCount only for valid catalog products
  const validCartItems = products.length > 0
    ? cartItems.filter((item) => products.some((p) => p.sku === item.sku))
    : cartItems;
  const cartCount = validCartItems.reduce((count, item) => count + item.quantity, 0);

  const context = {
    query,
    setQuery,
    category,
    setCategory,
    products,
    setProducts,
    cartItems: validCartItems,
    setCartItems,
    addToCart,
    addToBag: addToCart,
    productsLoading,
    productsError
  };

  return (
    <StoreContext.Provider value={context}>
      <div className="flex min-h-screen flex-col bg-[#f6f2e9]">
        <SiteHeader
          {...context}
          cartCount={cartCount}
          onOpenPanel={setActivePanel}
        />
        <Outlet context={context} />
        <SiteFooter />
        <StorePanel
          panel={activePanel}
          products={products}
          cartItems={cartItems}
          setCartItems={setCartItems}
          onClose={() => setActivePanel('')}
        />

        {/* 2-second 'Added to Cart!' Toast Notification */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full border border-gold-500/50 bg-maroon-900 px-6 py-3 text-xs sm:text-sm font-semibold tracking-wide text-[#f8f5ed] shadow-[0_16px_40px_rgba(40,25,12,0.35)] transition-all duration-300"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white">✓</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </StoreContext.Provider>
  );
}
