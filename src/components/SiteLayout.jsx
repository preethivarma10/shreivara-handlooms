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

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.535 5.847L.057 23.667a.5.5 0 0 0 .612.612l5.82-1.478A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.012-1.373l-.36-.214-3.727.947.963-3.617-.234-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z" />
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
        className="cursor-pointer absolute inset-0 bg-maroon-950/50 backdrop-blur-xs transition-opacity"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-panel-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-2xl border-l border-gold-200"
      >
        <div className="flex items-center justify-between border-b border-gold-200 px-6 py-5 bg-cream">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600">Your Selection</p>
            <h2 id="store-panel-title" className="mt-0.5 font-brand text-2xl font-normal text-maroon-900">
              Shopping Bag
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full text-maroon-400 hover:text-maroon-900 hover:bg-maroon-50 transition"
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
                <article key={product.sku} className="flex gap-4 border-b border-gold-100 pb-4 last:border-b-0">
                  <img src={product.image} alt={product.name} className="h-24 w-20 rounded-xl object-cover border border-gold-200" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-brand text-lg font-normal text-maroon-900 leading-snug">{product.name}</h3>
                    <p className="mt-0.5 text-xs text-maroon-400 font-light">{product.sku} · {formatCurrency(product.sellingPrice)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        aria-label={`Remove one ${product.name}`}
                        onClick={() => setCartItems((current) => current.flatMap((item) => item.sku !== product.sku ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []))}
                        className="cursor-pointer h-7 w-7 rounded-full border border-gold-300 text-sm flex items-center justify-center hover:border-maroon-700 hover:bg-maroon-50 transition"
                      >
                        −
                      </button>
                      <span className="text-xs font-semibold">{quantity}</span>
                      <button
                        type="button"
                        disabled={isMax}
                        aria-label={`Add one ${product.name}`}
                        onClick={() => setCartItems((current) => current.map((item) => item.sku === product.sku ? { ...item, quantity: Math.min(maxStock, item.quantity + 1) } : item))}
                        className={`h-7 w-7 rounded-full border text-sm flex items-center justify-center transition ${isMax
                            ? 'cursor-not-allowed border-gold-200 text-gold-300'
                            : 'cursor-pointer border-gold-300 hover:border-maroon-700 hover:bg-maroon-50'
                          }`}
                      >
                        +
                      </button>
                      {isMax && <span className="text-[10px] uppercase tracking-wider text-amber-700 font-medium">Max</span>}
                      <button
                        type="button"
                        onClick={() => setCartItems((current) => current.filter((item) => item.sku !== product.sku))}
                        className="cursor-pointer ml-auto text-[11px] text-maroon-400 hover:text-maroon-900 underline underline-offset-2 transition"
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
              <span className="inline-block p-4 rounded-full bg-gold-50 text-gold-500 mb-3">
                <BagIcon />
              </span>
              <p className="font-brand text-2xl text-maroon-800 font-normal">Your bag is currently empty.</p>
              <p className="text-xs text-maroon-400 mt-1 font-light">Discover handcrafted sarees and jewelry to begin.</p>
            </div>
          )}
        </div>

        {visibleCart.length > 0 && (
          <div className="border-t border-gold-200 px-6 py-5 space-y-4 bg-cream-100">
            {/* Payment & Shipping Notices */}
            <div className="rounded-2xl border border-gold-200 bg-white p-3.5 text-xs text-maroon-800 space-y-1.5 shadow-2xs">
              <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <span>✦</span> Free shipping above ₹3000!
              </p>
              <p className="text-[11px] leading-relaxed text-maroon-700 font-light">
                • Exclusive of GST &amp; Delivery charges.
              </p>
              <p className="text-[11px] leading-relaxed text-maroon-500 font-light">
                • Delivery charges vary by destination pincode. Delivery schedule confirmed on chat.
              </p>
            </div>

            <div className="flex justify-between items-baseline font-medium text-maroon-900 pt-1">
              <span className="text-xs uppercase tracking-[0.16em] text-gold-600 font-sans font-semibold">Subtotal</span>
              <span className="text-2xl font-bold font-brand tracking-tight">{formatCurrency(total)}</span>
            </div>
            <button
              type="button"
              onClick={startWhatsAppOrder}
              className="cursor-pointer w-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span className="h-4 w-4 text-[#25d366]"><WhatsAppIcon /></span>
              Order Entire Cart on WhatsApp
            </button>
            <p className="text-center text-[11px] text-gold-600 font-light">Availability and dispatch confirmed directly on WhatsApp.</p>
          </div>
        )}
      </section>
    </div>
  );
}

const SUTISANCHA_NAV_ITEMS = [
  { label: 'ALL', categoryKey: 'ALL' },
  { label: 'KANCHI PATTU', categoryKey: 'Kanchi Pattu' },
  { label: 'MANGALAGIRI', categoryKey: 'Mangalagiri' },
  { label: 'FANCY SILK', categoryKey: 'Fancy Silk' },
  { label: 'ORGANZA', categoryKey: 'Organza & Chiffon' },
  { label: 'JEWELRY', categoryKey: 'Jewellery' }
];

function SiteHeader({ query, setQuery, category, setCategory, ownerAllowed, ownerOpen, setOwnerOpen, cartCount, onOpenPanel }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Reset category, clear search, and scroll to top when Brand is clicked to show all collections & products freshly
  function handleBrandClick() {
    setCategory('ALL');
    setQuery('');
    if (location.pathname !== '/') {
      navigate('/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleNavClick(item) {
    setCategory(item.categoryKey);
    if (location.pathname !== '/') {
      navigate('/');
    }
    setTimeout(() => {
      const elem = document.getElementById('catalog');
      elem?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function requestOwnerAccess() {
    const ADMIN_PASSCODE = 'shreivara2026';
    if (sessionStorage.getItem('shreivara_admin_unlocked') === 'true') {
      setOwnerOpen((open) => !open);
      return;
    }
    const entered = window.prompt('Enter passcode to unlock Admin Panel:');
    if (entered === null) return;
    if (entered.trim() === ADMIN_PASSCODE) {
      sessionStorage.setItem('shreivara_admin_unlocked', 'true');
      setOwnerOpen(true);
      setTimeout(() => {
        const elem = document.getElementById('admin-portal');
        elem?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      window.alert('Incorrect passcode. Access denied.');
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-gold-300/80 shadow-xs transition-all">
      {/* 1. Top Red Announcement Bar */}
      <div className="bg-[#991B1B] text-gold-100 px-4 py-2 text-center text-[10.5px] sm:text-xs font-semibold tracking-[0.2em] uppercase border-b border-gold-400/30">
        <span className="opacity-95">Celebrate Heritage in Elegance — Up to 40% OFF!</span>
      </div>

      {/* 2. Secondary Gold Discount Ticker */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#E2C366] to-[#D4AF37] text-maroon-950 px-4 py-1.5 text-center text-[10.5px] sm:text-xs font-bold tracking-[0.08em] uppercase border-b border-gold-500/50 shadow-2xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 sm:gap-5">
          <span className="flex items-center gap-1.5 font-black">
            <span className="text-emerald-950 text-sm">✓</span> 100% Handloom Authenticity
          </span>
          <span className="opacity-40 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <span>🚚</span> Free Shipping on Orders above ₹3000
          </span>
          <span className="opacity-40 hidden md:inline">•</span>
          <span className="hidden md:flex items-center gap-1.5">
            <span>✦</span> Extra 10% OFF with Code: UTSAV10
          </span>
          <span className="opacity-40 hidden lg:inline">•</span>
          <span className="hidden lg:flex items-center gap-1.5">
            <span>💬</span> WhatsApp Orders: +91 90005 10329
          </span>
        </div>
      </div>

      {/* 3. Centered Sutisancha-Style Main Header */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 sm:gap-6 px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
        
        {/* Left: Search Box with Rounded Borders */}
        <div className="flex-1 max-w-[210px] sm:max-w-xs">
          <label className="relative block w-full">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sarees, jewelry, SKU..."
              aria-label="Search catalogue"
              className="w-full rounded-full border border-gold-300/80 bg-white/90 hover:bg-white focus:bg-white py-2 pl-4 pr-9 text-xs text-maroon-950 shadow-2xs transition focus:border-maroon-800 focus:outline-none placeholder:text-maroon-400 placeholder:font-light"
            />
            <SearchIcon />
          </label>
        </div>

        {/* Center: Brand Logo 'Shreivara' with subtitle 'HANDLOOMS & FINE JEWELRY' */}
        <div className="flex flex-col items-center justify-center text-center px-2">
          <button
            type="button"
            onClick={handleBrandClick}
            className="cursor-pointer bg-transparent border-0 p-0 text-center group"
            aria-label="Shreivara - Return to Home"
          >
            <span className="font-brand text-2xl sm:text-3xl md:text-4xl font-medium tracking-[0.24em] uppercase text-maroon-950 group-hover:text-maroon-800 transition-colors block leading-tight">
              Shreivara
            </span>
            <span className="text-[8.5px] sm:text-[10px] font-semibold tracking-[0.32em] uppercase text-gold-600 block mt-0.5">
              HANDLOOMS &amp; FINE JEWELRY
            </span>
          </button>
        </div>

        {/* Right-aligned action buttons (WhatsApp, Admin Lock, Cart) */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
          {/* WhatsApp Circular Action Button */}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I have an enquiry about your sarees and fine jewelry.')}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp (+91 90005 10329)"
            title="Chat on WhatsApp (+91 90005 10329)"
            className="cursor-pointer flex h-10 w-10 sm:h-10.5 sm:w-10.5 items-center justify-center rounded-full border border-gold-400 bg-gold-50 text-maroon-900 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] shadow-2xs transition-all duration-300 hover:scale-105"
          >
            <span className="h-4.5 w-4.5 shrink-0"><WhatsAppIcon /></span>
          </a>

          {/* Admin Lock / Shield Action Button */}
          <button
            type="button"
            onClick={requestOwnerAccess}
            title={ownerOpen ? 'Close Admin Console' : 'Admin Panel Login (Passcode: shreivara2026)'}
            aria-label="Admin Panel Login"
            className={`cursor-pointer flex h-10 w-10 sm:h-10.5 sm:w-10.5 items-center justify-center rounded-full border transition-all duration-300 hover:scale-105 shadow-2xs ${
              ownerOpen
                ? 'bg-maroon-900 text-gold-200 border-gold-400'
                : 'border-gold-400 bg-gold-50 text-maroon-800 hover:bg-maroon-900 hover:text-gold-200'
            }`}
          >
            {ownerOpen ? (
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            ) : (
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          </button>

          {/* Cart Circular Action Button */}
          <button
            type="button"
            onClick={() => onOpenPanel('cart')}
            aria-label={`Shopping bag, ${cartCount} items`}
            title="Shopping Cart"
            className="cursor-pointer relative flex h-10 w-10 sm:h-10.5 sm:w-10.5 items-center justify-center rounded-full border border-gold-400 bg-white text-maroon-900 hover:bg-gold-50 shadow-2xs transition-all duration-300 hover:scale-105"
          >
            <span className="h-5 w-5"><BagIcon /></span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon-900 px-1 text-[9px] font-bold text-gold-100 shadow-xs border border-gold-300">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4. Horizontal Category Navigation Bar (ALL, KANCHI PATTU, MANGALAGIRI, FANCY SILK, ORGANZA, JEWELRY) */}
      <nav aria-label="Collections category navigation" className="border-t border-gold-200/70 bg-[#FAF7F2]">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 sm:gap-7 md:gap-9 overflow-x-auto px-4 py-2.5 sm:py-3 scrollbar-none">
          {SUTISANCHA_NAV_ITEMS.map((item) => {
            const isSelected =
              (item.categoryKey === 'ALL' && (category === 'ALL' || category === 'All Collections' || category === 'All Sarees')) ||
              category === item.categoryKey;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`cursor-pointer whitespace-nowrap text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase transition-all duration-200 py-1 border-b-2 ${
                  isSelected
                    ? 'border-maroon-900 text-maroon-950 font-bold'
                    : 'border-transparent text-maroon-800/80 hover:text-maroon-950 hover:border-gold-400'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-gold-300 bg-gradient-to-b from-maroon-900 via-maroon-950 to-maroon-950 px-4 py-16 text-center text-sm">
      <div className="mx-auto max-w-7xl space-y-4">
        <p className="font-brand text-3xl font-medium tracking-[0.24em] uppercase text-gold-300">Shreivara</p>
        <p className="text-xs tracking-[0.2em] text-gold-400/70 uppercase">Direct WhatsApp Orders • Heritage Artistry • Worldwide Delivery</p>
        <div className="flex flex-col items-center justify-center gap-2 pt-2 text-xs sm:flex-row sm:gap-6 text-gold-200">
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
        <p className="text-[11px] text-maroon-400 pt-4">© {new Date().getFullYear()} Shreivara Handlooms &amp; Fine Jewelry. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function SiteLayout() {
  const location = useLocation();
  const ownerAllowed = new URLSearchParams(location.search).get('admin') === 'true';
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [cartItems, setCartItems] = useState(() => readStoredList('shreivara-cart', (item) =>
    typeof item?.sku === 'string' && Number.isSafeInteger(item.quantity) && item.quantity > 0));
  const [activePanel, setActivePanel] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);

  // Handle secret URL parameter ?admin=true
  useEffect(() => {
    if (ownerAllowed) {
      if (sessionStorage.getItem('shreivara_admin_unlocked') === 'true') {
        setOwnerOpen(true);
      } else {
        const entered = window.prompt('Enter passcode to unlock Admin Panel:');
        if (entered && entered.trim() === 'shreivara2026') {
          sessionStorage.setItem('shreivara_admin_unlocked', 'true');
          setOwnerOpen(true);
        }
      }
    }
  }, [ownerAllowed]);

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
      } catch (_) { }
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
      <div className="flex min-h-screen flex-col bg-cream pb-20 sm:pb-0">
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

        {/* Mobile-First Sticky Quick Action Bar */}
        <nav aria-label="Mobile quick actions" className="fixed bottom-3 inset-x-3 z-40 sm:hidden">
          <div className="flex items-center justify-between gap-2.5 rounded-full border border-gold-300/80 bg-cream/95 p-1.5 shadow-2xl backdrop-blur-lg">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to place an order or enquire about your collections.')}`}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm active:scale-95 transition-transform"
            >
              <span className="h-4 w-4 shrink-0 text-[#25d366]"><WhatsAppIcon /></span>
              <span>WhatsApp Order</span>
            </a>

            <button
              type="button"
              onClick={() => setActivePanel('cart')}
              aria-label="View shopping bag"
              className="cursor-pointer flex items-center gap-2 rounded-full bg-gradient-to-r from-maroon-900 via-maroon-850 to-maroon-900 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gold-100 shadow-sm active:scale-95 transition-transform border border-gold-400/40"
            >
              <span className="h-4 w-4 shrink-0"><BagIcon /></span>
              <span>Bag</span>
              {cartItems.reduce((count, item) => count + item.quantity, 0) > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-maroon-950">
                  {cartItems.reduce((count, item) => count + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* Floating Circular Sticky WhatsApp Button */}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to enquire about your handloom sarees and fine jewelry.')}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp (+91 90005 10329)"
          title="Chat on WhatsApp (+91 90005 10329)"
          className="fixed bottom-24 sm:bottom-8 right-5 sm:right-8 z-40 flex items-center justify-center h-13 w-13 sm:h-14 sm:w-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white group cursor-pointer"
        >
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 bg-emerald-500"></span>
          </span>
          <span className="h-6 w-6 sm:h-7 sm:w-7 text-white shrink-0"><WhatsAppIcon /></span>
          <span className="pointer-events-none absolute right-16 hidden whitespace-nowrap rounded-lg bg-maroon-950/90 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-gold-100 shadow-xl group-hover:block transition-all">
            WhatsApp Order (+91 90005 10329)
          </span>
        </a>

        {/* Elegant 2-second 'Added to Cart!' Toast Notification */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full border border-gold-400 bg-maroon-900 px-6 py-3 text-xs sm:text-sm font-semibold tracking-wide text-gold-100 shadow-xl transition-all duration-300"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">✓</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </StoreContext.Provider>
  );
}