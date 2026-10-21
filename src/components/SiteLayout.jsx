import { createContext, useContext, useEffect, useState } from 'react';

const DEFAULT_PRODUCTS = [
  {
    sku: 'SHR-001',
    name: 'Royal Kanjivaram Silk',
    category: 'Kanchi Pattu',
    originalPrice: 18999,
    sellingPrice: 14999,
    sizes: 'Free size',
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
    offerDetails: '',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
  }
];
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { categories, WHATSAPP_NUMBER } from '../data/products.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

const StoreContext = createContext(null);

export function useStore() {
  return useContext(StoreContext);
}

function SearchIcon() {
  return (
    <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function BookmarkIcon({ filled = false }) {
  return <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 4.75A1.75 1.75 0 0 1 8.5 3h7a1.75 1.75 0 0 1 1.75 1.75V21l-5.75-3.5L5.75 21V4.75Z" /></svg>;
}

function BagIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5.5 8.5h13l1 12h-15l1-12Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
}

function addCartItem(current, sku) {
  const existing = current.find((item) => item.sku === sku);
  return existing
    ? current.map((item) => item.sku === sku ? { ...item, quantity: item.quantity + 1 } : item)
    : [...current, { sku, quantity: 1 }];
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

function StorePanel({ panel, products, cartItems, setCartItems, savedSkus, setSavedSkus, onAddToBag, onClose }) {
  if (!panel) return null;

  const visibleCart = cartItems
    .map((item) => ({ ...item, product: products.find((product) => product.sku === item.sku) }))
    .filter((item) => item.product);
  const savedProducts = savedSkus.map((sku) => products.find((product) => product.sku === sku)).filter(Boolean);
  const total = visibleCart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

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
      '',
      'Please reply with availability confirmation.',
      '',
      '📦 *Shipping details:*',
      'Name:',
      'Address:',
      'City & Pincode:',
      'Phone:'
    ].join('\n');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close panel" onClick={onClose} className="absolute inset-0 bg-[#21180f]/35 backdrop-blur-[2px]" />
      <section role="dialog" aria-modal="true" aria-labelledby="store-panel-title" className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-[#f8f5ed] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e4dccd] px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-600">{panel === 'cart' ? 'Your selection' : 'Saved for later'}</p>
            <h2 id="store-panel-title" className="mt-1 font-brand text-2xl font-medium text-maroon-900">{panel === 'cart' ? 'Shopping bag' : 'Saved pieces'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-gray-600 transition hover:bg-[#e9e1d3]">×</button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {panel === 'cart' ? (visibleCart.length ? visibleCart.map(({ product, quantity }) => (
            <article key={product.sku} className="flex gap-4 border-b border-[#e4dccd] pb-4">
              <img src={product.image} alt={product.name} className="h-24 w-20 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <h3 className="font-brand text-lg font-medium text-maroon-900">{product.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{product.sku} · ₹{product.sellingPrice.toLocaleString('en-IN')}</p>
                <div className="mt-3 flex items-center gap-3">
                  <button type="button" aria-label={`Remove one ${product.name}`} onClick={() => setCartItems((current) => current.flatMap((item) => item.sku !== product.sku ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []))} className="h-8 w-8 rounded-full border border-[#d9d0c1] text-lg">−</button>
                  <span className="text-sm">{quantity}</span>
                  <button type="button" aria-label={`Add one ${product.name}`} onClick={() => setCartItems((current) => current.map((item) => item.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item))} className="h-8 w-8 rounded-full border border-[#d9d0c1] text-lg">+</button>
                  <button type="button" onClick={() => setCartItems((current) => current.filter((item) => item.sku !== product.sku))} className="ml-auto text-xs text-gray-500 underline underline-offset-2">Remove</button>
                </div>
              </div>
            </article>
          )) : <p className="py-12 text-center font-brand text-xl text-gray-500">Your bag is waiting for something beautiful.</p>) : (savedProducts.length ? savedProducts.map((product) => (
            <article key={product.sku} className="flex gap-4 border-b border-[#e4dccd] pb-4">
              <img src={product.image} alt={product.name} className="h-24 w-20 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <h3 className="font-brand text-lg font-medium text-maroon-900">{product.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{product.category}</p>
                <p className="mt-2 text-sm font-semibold text-maroon-900">₹{product.sellingPrice.toLocaleString('en-IN')}</p>
                <div className="mt-3 flex gap-4 text-xs">
                  <button type="button" onClick={() => { onAddToBag(product.sku); setSavedSkus((current) => current.filter((sku) => sku !== product.sku)); }} className="font-semibold text-maroon-900 underline underline-offset-2">Add to bag</button>
                  <button type="button" onClick={() => setSavedSkus((current) => current.filter((sku) => sku !== product.sku))} className="text-gray-500 underline underline-offset-2">Remove</button>
                </div>
              </div>
            </article>
          )) : <p className="py-12 text-center font-brand text-xl text-gray-500">Save a piece to find it here later.</p>)}
        </div>
        {panel === 'cart' && visibleCart.length > 0 && <div className="border-t border-[#e4dccd] px-6 py-5">
          <div className="mb-4 flex justify-between font-semibold text-maroon-900"><span>Subtotal</span><span>₹{total.toLocaleString('en-IN')}</span></div>
          <button type="button" onClick={startWhatsAppOrder} className="w-full rounded-lg bg-maroon-900 px-5 py-3 text-sm font-semibold tracking-wide text-[#f8f5ed] transition hover:bg-maroon-800">Continue on WhatsApp</button>
          <p className="mt-3 text-center text-xs text-gray-500">We’ll confirm availability and delivery with you.</p>
        </div>}
      </section>
    </div>
  );
}

function SiteHeader({ query, setQuery, category, setCategory, ownerAllowed, ownerOpen, setOwnerOpen, cartCount, savedCount, onOpenPanel }) {
  const location = useLocation();
  const navigate = useNavigate();

  function selectCategory(nextCategory) {
    setCategory(nextCategory);
    if (location.pathname !== '/') {
      navigate('/#catalog');
      return;
    }
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  }

  function requestOwnerAccess() {
    const OWNER_PASSWORD = 'shreivara2024';
    const entered = window.prompt('Enter the owner password to manage products:');
    if (entered === null) return; // cancelled
    if (entered === OWNER_PASSWORD) {
      setOwnerOpen((open) => !open);
    } else {
      window.alert('Incorrect password. Please try again.');
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#ded5c6] bg-[#f6f2e9]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Shreivara home">
          <span className="font-brand text-2xl font-semibold tracking-tight text-maroon-900 sm:text-3xl">Shreivara</span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm text-gray-700 lg:flex">
          <Link to="/" className="transition hover:text-maroon-900">Home</Link>
          <Link to="/#collections" className="transition hover:text-maroon-900">Collections</Link>
          <Link to="/#catalog" className="transition hover:text-maroon-900">Shop</Link>
          <Link to="/about" className="transition hover:text-maroon-900">About us</Link>
        </nav>
        <div className="flex items-center justify-end gap-1.5 sm:gap-3">
          <button type="button" onClick={() => onOpenPanel('saved')} aria-label={`Saved pieces, ${savedCount} ${savedCount === 1 ? 'item' : 'items'}`} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-maroon-900 transition hover:bg-[#e9e1d3]">
            <span className="h-5 w-5"><BookmarkIcon /></span>
            {savedCount > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon-900 px-1 text-[9px] font-bold text-white">{savedCount}</span>}
          </button>
          <button type="button" onClick={() => onOpenPanel('cart')} aria-label={`Shopping bag, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-maroon-900 transition hover:bg-[#e9e1d3]">
            <span className="h-5 w-5"><BagIcon /></span>
            {cartCount > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon-900 px-1 text-[9px] font-bold text-white">{cartCount}</span>}
          </button>
          {ownerAllowed && <button type="button" onClick={requestOwnerAccess} className="rounded-full bg-gold-500 px-3 py-2 text-[10px] font-bold text-maroon-900 transition hover:bg-white">{ownerOpen ? 'Customer' : 'Owner'}</button>}
        </div>
      </div>
      <div className="border-t border-[#e6dfd3]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-2 sm:px-6 lg:flex-row lg:justify-between lg:gap-6 lg:px-8">
          <nav aria-label="Shop categories" className="-mx-4 flex w-full items-center justify-start gap-5 overflow-x-auto whitespace-nowrap px-4 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-700 sm:mx-0 sm:gap-7 sm:px-0 sm:text-xs lg:w-auto">
            {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => selectCategory(item)} className={`transition hover:text-maroon-900 ${category === item ? 'text-maroon-900' : ''}`}>{item === 'Organza & Chiffon' ? 'Organza' : item}</button>)}
            {WHATSAPP_NUMBER && <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to see your jewellery collection.')}`} target="_blank" rel="noreferrer" className="hover:text-maroon-900">Jewellery</a>}
          </nav>
          <label className="relative w-full max-w-xl lg:w-64">
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sarees or SKU..." aria-label="Search sarees by name or SKU" className="w-full rounded-full border border-[#d9d0c1] bg-transparent py-2 pl-4 pr-10 text-xs transition focus:border-maroon-800 focus:bg-white focus:outline-none sm:text-sm" />
            <SearchIcon />
          </label>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-gold-500/30 bg-maroon-900 px-4 py-7 text-center text-sm text-white/80">
      <p className="font-semibold text-gold-500">Shreivara</p>
      <p className="mt-1">Direct WhatsApp orders • Secure delivery • Trusted quality</p>
      <div className="mt-3 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-5">
        <a href="mailto:shreivara@gmail.com" className="underline decoration-white/40 underline-offset-4 transition hover:text-gold-500">shreivara@gmail.com</a>
        {WHATSAPP_NUMBER && <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to get in touch.')}`} target="_blank" rel="noreferrer" className="underline decoration-white/40 underline-offset-4 transition hover:text-gold-500">WhatsApp: +91 90005 10329</a>}
      </div>
    </footer>
  );
}

export default function SiteLayout() {
  const location = useLocation();
  const ownerAllowed = new URLSearchParams(location.search).get('admin') === 'true';
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All Sarees');
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [cartItems, setCartItems] = useState(() => readStoredList('shreivara-cart', (item) =>
    typeof item?.sku === 'string' && Number.isSafeInteger(item.quantity) && item.quantity > 0));
  const [savedSkus, setSavedSkus] = useState(() => readStoredList('shreivara-saved', (sku) =>
    typeof sku === 'string' && sku.length > 0 && sku.length <= 64));
  const [activePanel, setActivePanel] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem('shreivara-cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Could not save the shopping bag in browser storage.', error);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      window.localStorage.setItem('shreivara-saved', JSON.stringify(savedSkus));
    } catch (error) {
      console.error('Could not save saved pieces in browser storage.', error);
    }
  }, [savedSkus]);

  function addToBag(sku) {
    setCartItems((current) => addCartItem(current, sku));
  }

  useEffect(() => {
    function loadProducts() {
      try {
        const stored = window.localStorage.getItem('shreivara-products');
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
            setProductsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.warn('Could not read products from localStorage, using defaults.', error);
      }
      // Fall back to built-in default catalogue
      setProducts(DEFAULT_PRODUCTS);
      try {
        window.localStorage.setItem('shreivara-products', JSON.stringify(DEFAULT_PRODUCTS));
      } catch (_) { /* storage full or unavailable */ }
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
    savedSkus,
    setSavedSkus,
    productsLoading,
    productsError
  };

  return <StoreContext.Provider value={context}><div className="flex min-h-screen flex-col"><SiteHeader {...context} ownerAllowed={ownerAllowed} cartCount={cartItems.reduce((count, item) => count + item.quantity, 0)} savedCount={savedSkus.length} onOpenPanel={setActivePanel} /><Outlet context={context} /><SiteFooter /><StorePanel panel={activePanel} products={products} cartItems={cartItems} setCartItems={setCartItems} savedSkus={savedSkus} setSavedSkus={setSavedSkus} onAddToBag={addToBag} onClose={() => setActivePanel('')} /></div></StoreContext.Provider>;
}