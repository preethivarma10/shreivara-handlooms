import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { categories, WHATSAPP_NUMBER } from '../data/products.js';

const DEFAULT_PRODUCTS = [
  {
    sku: 'SHR-001',
    name: 'Royal Kanjivaram Silk',
    category: 'Kanchi Pattu',
    originalPrice: 18999,
    sellingPrice: 14999,
    sizes: 'Free size',
    stock: 4,
    offerDetails: 'Grand launch offer — limited stock!',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
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
    image: 'https://images.unsplash.com/photo-1583391733956-62e74ed5b29c?auto=format&fit=crop&w=800&q=80'
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
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'
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
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
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
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'
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
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'
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
    <svg className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
  const total = visibleCart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const isFreeDelivery = total >= 3000;

  function startWhatsAppOrder() {
    const itemLines = visibleCart.map(({ product, quantity }) => {
      const lineTotal = product.sellingPrice * quantity;
      return `• ${product.name} [${product.sku}] × ${quantity} = ${formatCurrency(lineTotal)}`;
    });
    const message = [
      '🛍️ *New Order — Shreivara*',
      '',
      '*Items ordered:*',
      ...itemLines,
      '',
      `*Order Total: ${formatCurrency(total)}*`,
      isFreeDelivery ? '🎉 *Eligible for Free Delivery!*' : '',
      '',
      '📌 *Notice:* Prices exclusive of delivery charges & GST. Location-based shipping confirmed on chat.',
      '',
      'Please reply with availability confirmation.',
      '',
      '📦 *Shipping details:*',
      'Name:',
      'Address:',
      'City & Pincode:',
      'Phone:',
      '',
      'Thank you for ordering with Shreivara! We will get back to you at the earliest.'
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="cursor-pointer absolute inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-panel-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl border-l border-neutral-200"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5 bg-white">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Your Selection</p>
            <h2 id="store-panel-title" className="mt-0.5 font-brand text-2xl font-normal text-neutral-950">
              Shopping Bag
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {visibleCart.length ? (
            visibleCart.map(({ product, quantity }) => {
              const maxStock = product.stock ?? 5;
              const isMax = quantity >= maxStock;
              return (
                <article key={product.sku} className="flex gap-4 border-b border-neutral-100 pb-4 last:border-b-0">
                  <img src={product.image} alt={product.name} className="h-24 w-20 rounded-lg object-cover border border-neutral-100" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-brand text-lg font-normal text-neutral-900 leading-snug">{product.name}</h3>
                    <p className="mt-0.5 text-xs text-neutral-500 font-light">{product.sku} · {formatCurrency(product.sellingPrice)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        aria-label={`Remove one ${product.name}`}
                        onClick={() => setCartItems((current) => current.flatMap((item) => item.sku !== product.sku ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []))}
                        className="cursor-pointer h-7 w-7 rounded-full border border-neutral-300 text-sm flex items-center justify-center hover:border-neutral-900 hover:bg-neutral-50 transition"
                      >
                        −
                      </button>
                      <span className="text-xs font-semibold">{quantity}</span>
                      <button
                        type="button"
                        disabled={isMax}
                        aria-label={`Add one ${product.name}`}
                        onClick={() => setCartItems((current) => current.map((item) => item.sku === product.sku ? { ...item, quantity: Math.min(maxStock, item.quantity + 1) } : item))}
                        className={`h-7 w-7 rounded-full border text-sm flex items-center justify-center transition ${
                          isMax
                            ? 'cursor-not-allowed border-neutral-200 text-neutral-300'
                            : 'cursor-pointer border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50'
                        }`}
                      >
                        +
                      </button>
                      {isMax && <span className="text-[10px] uppercase tracking-wider text-amber-700 font-medium">Max</span>}
                      <button
                        type="button"
                        onClick={() => setCartItems((current) => current.filter((item) => item.sku !== product.sku))}
                        className="cursor-pointer ml-auto text-[11px] text-neutral-400 hover:text-neutral-900 underline underline-offset-2 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="py-20 text-center">
              <span className="inline-block p-4 rounded-full bg-neutral-50 text-neutral-400 mb-3">
                <BagIcon />
              </span>
              <p className="font-brand text-2xl text-neutral-700 font-normal">Your bag is currently empty.</p>
              <p className="text-xs text-neutral-400 mt-1">Discover handcrafted sarees and jewelry to begin.</p>
            </div>
          )}
        </div>

        {visibleCart.length > 0 && (
          <div className="border-t border-neutral-100 px-6 py-5 space-y-4 bg-neutral-50/50">
            {/* Payment & Shipping Notices */}
            <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5 text-xs text-neutral-700 space-y-1.5 shadow-2xs">
              <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <span>✦</span> Free Delivery on orders above ₹3,000!
              </p>
              <p className="text-[11px] leading-relaxed text-neutral-500 font-light">
                • Prices are exclusive of delivery charges and GST.
              </p>
              <p className="text-[11px] leading-relaxed text-neutral-500 font-light">
                • Delivery charges vary based on location. Please connect with us on WhatsApp for exact shipping details.
              </p>
            </div>

            <div className="flex justify-between items-baseline font-medium text-neutral-950 pt-1">
              <span className="text-xs uppercase tracking-[0.16em] text-neutral-500 font-sans font-semibold">Subtotal</span>
              <span className="text-2xl font-bold font-brand tracking-tight">{formatCurrency(total)}</span>
            </div>
            <button
              type="button"
              onClick={startWhatsAppOrder}
              className="cursor-pointer w-full rounded-xl bg-neutral-950 hover:bg-black px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-md transition-all active:scale-[0.99]"
            >
              Order on WhatsApp
            </button>
            <p className="text-center text-[11px] text-neutral-400 font-light">Availability and dispatch confirmed directly on WhatsApp.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function SiteHeader({ query, setQuery, setCategory, ownerAllowed, ownerOpen, setOwnerOpen, cartCount, onOpenPanel }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Reset category, clear search, and scroll to top when Brand is clicked to show all collections & products freshly
  function handleBrandClick() {
    setCategory('All Collections');
    setQuery('');
    if (location.pathname !== '/') {
      navigate('/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function navigateToAboutUs() {
    if (location.pathname !== '/') {
      navigate('/#about-us');
      return;
    }
    const elem = document.getElementById('about-us');
    elem?.scrollIntoView({ behavior: 'smooth' });
  }

  function requestOwnerAccess() {
    const OWNER_PASSWORD = 'shreivara2024';
    const entered = window.prompt('Enter the owner password to manage products:');
    if (entered === null) return;
    if (entered === OWNER_PASSWORD) {
      setOwnerOpen((open) => !open);
    } else {
      window.alert('Incorrect password. Please try again.');
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/95 glass-nav">
      {/* Top Slick Announcement Ticker */}
      <div className="bg-neutral-950 text-neutral-300 px-4 py-2 text-center text-[10px] sm:text-[10.5px] font-medium tracking-[0.2em] uppercase border-b border-neutral-900">
        <span className="opacity-95">✦ Complimentary Express Shipping Above ₹3,000 • Authentic Handloom Weaves • Video Drape Consultations via WhatsApp ✦</span>
      </div>

      <div className="mx-auto flex h-[72px] sm:h-[76px] max-w-7xl items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 lg:px-8">

        {/* Left Side: Brand Logo (Home trigger) + About Us + Search Bar */}
        <div className="flex flex-1 items-center gap-5 sm:gap-8">
          <button
            type="button"
            onClick={handleBrandClick}
            className="cursor-pointer flex shrink-0 items-center gap-1.5 bg-transparent border-0 p-0 text-left group"
            aria-label="Shreivara - Return to Home"
          >
            <span className="font-brand text-2xl sm:text-3xl font-medium tracking-[0.24em] uppercase text-neutral-950 group-hover:text-neutral-600 transition-colors">
              Shreivara
            </span>
          </button>

          <nav aria-label="Main navigation" className="flex items-center">
            <button
              type="button"
              onClick={navigateToAboutUs}
              className="cursor-pointer text-xs font-semibold tracking-[0.14em] uppercase text-neutral-600 hover:text-neutral-950 transition whitespace-nowrap py-1 bg-transparent border-0 p-0"
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
              className="w-full rounded-full border border-neutral-200 bg-neutral-50/80 hover:bg-neutral-100/60 focus:bg-white py-2 pl-4 pr-10 text-xs text-neutral-900 transition focus:border-neutral-900 focus:outline-none sm:text-sm placeholder:text-neutral-400 placeholder:font-light"
            />
            <SearchIcon />
          </label>
        </div>

        {/* Right Side: Cart + Owner Portal */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenPanel('cart')}
            aria-label={`Shopping bag, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            className="cursor-pointer relative inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100 transition border border-neutral-200/80 bg-white shadow-2xs"
          >
            <span className="h-5 w-5"><BagIcon /></span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-950 px-1 text-[9px] font-bold text-white shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          {ownerAllowed && (
            <button
              type="button"
              onClick={requestOwnerAccess}
              className="cursor-pointer rounded-full bg-neutral-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white transition hover:bg-black shadow-2xs ml-1"
            >
              {ownerOpen ? 'Customer' : 'Owner'}
            </button>
          )}
        </div>
      </div>

      {/* Mobile search bar on small screens */}
      <div className="border-t border-neutral-100 px-4 py-2 sm:hidden bg-white">
        <label className="relative block w-full">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sarees, jewelry, SKU..."
            aria-label="Search catalogue"
            className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-1.5 pl-4 pr-10 text-xs text-neutral-900 transition focus:border-neutral-900 focus:outline-none"
          />
          <SearchIcon />
        </label>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-neutral-900 bg-neutral-950 px-4 py-16 text-center text-sm text-neutral-400">
      <div className="mx-auto max-w-7xl space-y-4">
        <p className="font-brand text-3xl font-medium tracking-[0.24em] uppercase text-white">Shreivara</p>
        <p className="text-xs tracking-[0.2em] text-neutral-400 uppercase">Direct WhatsApp Orders • Heritage Artistry • Worldwide Delivery</p>
        <div className="flex flex-col items-center justify-center gap-2 pt-2 text-xs sm:flex-row sm:gap-6 text-neutral-300">
          <a href="mailto:shreivara@gmail.com" className="cursor-pointer hover:text-white transition">
            shreivara@gmail.com
          </a>
          {WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to get in touch.')}`}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer hover:text-white transition"
            >
              WhatsApp: +91 90005 10329
            </a>
          )}
        </div>
        <p className="text-[11px] text-neutral-600 pt-4">© {new Date().getFullYear()} Shreivara Handlooms &amp; Fine Jewelry. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function SiteLayout() {
  const location = useLocation();
  const ownerAllowed = new URLSearchParams(location.search).get('admin') === 'true';
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All Collections');
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [cartItems, setCartItems] = useState(() => readStoredList('shreivara-cart', (item) =>
    typeof item?.sku === 'string' && Number.isSafeInteger(item.quantity) && item.quantity > 0));
  const [activePanel, setActivePanel] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem('shreivara-cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Could not save the shopping bag in browser storage.', error);
    }
  }, [cartItems]);

  function showToast(msg = 'Added to Cart!') {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
    }, 2000);
  }

  // Restrict Add to Cart by stock quantity; shows 'Added to Cart!' pop-up for 2s on success
  function addToBag(sku) {
    const prod = products.find((p) => p.sku === sku);
    const maxStock = prod?.stock ?? 5;
    const existing = cartItems.find((item) => item.sku === sku);
    if (existing && existing.quantity >= maxStock) {
      return;
    }
    setCartItems((current) => addCartItem(current, sku, maxStock));
    showToast('Added to Cart!');
  }

  useEffect(() => {
    function loadProducts() {
      try {
        const stored = window.localStorage.getItem('shreivara-products');
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const withStock = parsed.map((p) => ({ ...p, stock: p.stock ?? 5 }));
            const hasJewelry = withStock.some((p) => p.category === 'Jewellery');
            const merged = hasJewelry
              ? withStock
              : [...withStock, ...DEFAULT_PRODUCTS.filter((dp) => dp.category === 'Jewellery')];
            setProducts(merged);
            setProductsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.warn('Could not read products from localStorage, using defaults.', error);
      }
      setProducts(DEFAULT_PRODUCTS);
      try {
        window.localStorage.setItem('shreivara-products', JSON.stringify(DEFAULT_PRODUCTS));
      } catch (_) {}
      setProductsLoading(false);
    }
    loadProducts();
  }, []);

  const context = {
    ownerOpen,
    setOwnerOpen,
    query,
    setQuery,
    category,
    setCategory,
    products,
    setProducts,
    cartItems,
    setCartItems,
    addToBag,
    productsLoading,
    productsError
  };

  return (
    <StoreContext.Provider value={context}>
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader
          {...context}
          ownerAllowed={ownerAllowed}
          cartCount={cartItems.reduce((count, item) => count + item.quantity, 0)}
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

        {/* Elegant 2-second 'Added to Cart!' Toast Notification */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full border border-neutral-800 bg-neutral-950 px-6 py-3 text-xs sm:text-sm font-semibold tracking-wide text-white shadow-xl transition-all duration-300"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">✓</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </StoreContext.Provider>
  );
}