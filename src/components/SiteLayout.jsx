import { createContext, useContext, useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { categories, WHATSAPP_NUMBER } from '../data/products.js';

const StoreContext = createContext(null);

export function useStore() {
  return useContext(StoreContext);
}

function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M20 11.5a8.4 8.4 0 0 1-12.4 7.4L4 20l1.1-3.5A8.4 8.4 0 1 1 20 11.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M9 8.5c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.7c.1.3.1.5-.1.7l-.6.7c-.2.2-.2.4 0 .6.5.8 1.2 1.5 2 2 .2.1.4.1.6-.1l.8-.9c.2-.2.4-.2.7-.1l1.6.8c.3.1.4.3.4.5 0 .4-.2 1.1-.7 1.5-.5.4-1.2.6-1.8.5-1-.1-2.2-.6-3.6-1.8-1.7-1.5-2.8-3.4-2.9-4.4-.1-.5.1-1.1.4-1.7Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function SiteHeader({ query, setQuery, category, setCategory, ownerAllowed, ownerOpen, setOwnerOpen }) {
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

  async function requestOwnerAccess() {
    let response;
    try {
      response = await fetch('/api/owner');
    } catch (error) {
      console.error('Could not verify owner access.', error);
      window.alert('Could not verify owner access. Please try again.');
      return;
    }

    if (response.status === 204) {
      setOwnerOpen((open) => !open);
    } else if (response.status === 401) {
      window.alert('Sign in with the configured owner account to manage products.');
    } else if (response.status === 403) {
      window.alert('This account is not authorized to manage products.');
    } else if (response.status === 503) {
      window.alert('Owner access has not been configured for this deployment.');
    } else {
      console.error(`Owner access verification failed with status ${response.status}.`);
      window.alert('Could not verify owner access. Please try again.');
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto grid h-[76px] max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 text-xs font-medium text-gray-600 sm:text-sm">
          <Link to="/about" className="hidden hover:text-maroon-900 sm:inline">About us</Link>
          <Link to="/#catalog" className="hidden hover:text-maroon-900 sm:inline">Our collection</Link>
        </div>
        <Link to="/" className="flex items-center gap-2.5" aria-label="Shreivara home">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold-500 bg-maroon-900 font-brand text-lg font-bold text-gold-500">S</span>
          <span className="text-left">
            <span className="block font-brand text-lg font-bold leading-tight tracking-wide text-maroon-900 sm:text-xl">Shreivara</span>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.25em] text-gold-600 sm:block">Luxury Ethnic Weaves</span>
          </span>
        </Link>
        <div className="flex items-center justify-end gap-2 sm:gap-4">
          {WHATSAPP_NUMBER && <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello%20Shreivara%2C%20I%20would%20like%20to%20place%20an%20order.`} target="_blank" rel="noreferrer" aria-label="Order on WhatsApp" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-emerald-800 transition hover:bg-emerald-50">
            <WhatsAppIcon />
          </a>}
          {ownerAllowed && <button type="button" onClick={requestOwnerAccess} className="rounded-full bg-gold-500 px-3 py-2 text-[10px] font-bold text-maroon-900 transition hover:bg-white">{ownerOpen ? 'Customer' : 'Owner'}</button>}
        </div>
      </div>
      <div className="border-y border-gray-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-2 sm:px-6 lg:flex-row lg:justify-between lg:gap-6 lg:px-8">
          <nav aria-label="Shop categories" className="-mx-4 flex w-full items-center justify-start gap-5 overflow-x-auto whitespace-nowrap px-4 text-xs font-medium text-gray-700 sm:mx-0 sm:gap-7 sm:px-0 sm:text-sm lg:w-auto">
            <Link to="/" className="text-maroon-900">Home</Link>
            <Link to="/#catalog" className="hover:text-maroon-900">Shop</Link>
            {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => selectCategory(item)} className={`transition hover:text-maroon-900 ${category === item ? 'text-maroon-900' : ''}`}>{item === 'Organza & Chiffon' ? 'Organza' : item}</button>)}
            {WHATSAPP_NUMBER && <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to see your jewellery collection.')}`} target="_blank" rel="noreferrer" className="hover:text-maroon-900">Jewellery</a>}
            <Link to="/about" className="hover:text-maroon-900 sm:hidden">About</Link>
          </nav>
          <label className="relative w-full max-w-xl lg:w-64">
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sarees or SKU..." aria-label="Search sarees by name or SKU" className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-4 pr-10 text-xs transition focus:border-maroon-800 focus:bg-white focus:outline-none sm:text-sm" />
            <SearchIcon />
          </label>
        </div>
      </div>
      <div className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-maroon-900 sm:text-xs sm:tracking-[0.18em]">✨ Festive Special • Free Shipping across India</div>
    </header>
  );
}

function SiteFooter() {
  return <footer className="border-t border-gold-500/30 bg-maroon-900 px-4 py-7 text-center text-sm text-white/80"><p className="font-semibold text-gold-500">Shreivara</p><p className="mt-1">Direct WhatsApp orders • Secure delivery • Trusted quality</p></footer>;
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

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      try {
        const response = await fetch('/api/products');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load the product catalogue.');
        if (!Array.isArray(result)) throw new Error('The product catalogue response was invalid.');
        if (active) setProducts(result);
      } catch (error) {
        if (active) {
          setProductsError(error instanceof Error ? error.message : 'Could not load the product catalogue.');
        }
      } finally {
        if (active) setProductsLoading(false);
      }
    }
    loadProducts();
    return () => { active = false; };
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
    productsLoading,
    productsError
  };

  return <StoreContext.Provider value={context}><div className="flex min-h-screen flex-col"><SiteHeader {...context} ownerAllowed={ownerAllowed} /><Outlet context={context} /><SiteFooter /></div></StoreContext.Provider>;
}