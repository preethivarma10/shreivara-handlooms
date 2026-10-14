import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { categories, WHATSAPP_NUMBER } from '../data/products.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function BookmarkIcon({ filled = false }) {
  return <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 4.75A1.75 1.75 0 0 1 8.5 3h7a1.75 1.75 0 0 1 1.75 1.75V21l-5.75-3.5L5.75 21V4.75Z" /></svg>;
}

function BagIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5.5 8.5h13l1 12h-15l1-12Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
}

function ProductCard({ product, isSaved, onToggleSaved, onAddToBag }) {
  const sizes = product.sizes ? product.sizes.split(',').map((size) => size.trim()).filter(Boolean) : [];
  const imageUrl = product.image.startsWith('/') ? `${window.location.origin}${product.image}` : product.image;
  const message = encodeURIComponent([
    'Hello Shreivara, I would like to place an order:',
    `Product: ${product.name}`,
    `SKU: ${product.sku}`,
    `Category: ${product.category}`,
    `Price: ${formatCurrency(product.sellingPrice)}`,
    product.sellingPrice < product.originalPrice ? `Original price: ${formatCurrency(product.originalPrice)}` : '',
    product.offerDetails ? `Offer: ${product.offerDetails}` : '',
    sizes.length ? `Available sizes: ${sizes.join(', ')}` : '',
    `Product image: ${imageUrl}`
  ].filter(Boolean).join('\n'));
  const discount = Math.round(((product.originalPrice - product.sellingPrice) / product.originalPrice) * 100);
  return (
    <article className="group overflow-hidden rounded-sm border border-[#e1d8c9] bg-[#fbf9f4] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(58,43,25,0.12)]">
      <div className="relative overflow-hidden bg-[#e8dfd0]"><img src={product.image} alt={product.name} className="h-[320px] w-full object-cover transition duration-700 group-hover:scale-[1.035]" /><span className="absolute left-3 top-3 bg-[#f6f2e9]/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-maroon-900">{discount}% off</span><button type="button" onClick={onToggleSaved} aria-label={isSaved ? `Remove ${product.name} from saved pieces` : `Save ${product.name}`} aria-pressed={isSaved} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f6f2e9]/90 p-2.5 text-maroon-900 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-800"><BookmarkIcon filled={isSaved} /></button></div>
      <div className="p-4 sm:p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600">{product.category}</p><h3 className="mt-2 min-h-[52px] font-brand text-2xl font-medium leading-tight text-maroon-900">{product.name}</h3><div className="mt-3 flex items-center gap-2"><span className="text-lg font-semibold text-maroon-900">{formatCurrency(product.sellingPrice)}</span><span className="text-sm text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span><span className="ml-auto text-[10px] uppercase tracking-widest text-gray-500">{product.sku}</span></div>
        {product.offerDetails && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-maroon-900">{product.offerDetails}</p>}
        {sizes.length > 0 && <p className="mt-2 text-sm text-gray-600">Available sizes: {sizes.join(', ')}</p>}
        <button type="button" onClick={onAddToBag} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-maroon-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#f8f5ed] transition hover:bg-maroon-800"><span className="h-4 w-4"><BagIcon /></span>Add to bag</button>
        {WHATSAPP_NUMBER && <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex w-full items-center justify-center rounded-sm border border-[#c8b99f] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-maroon-900 transition hover:bg-[#eee8dc]">Enquire on WhatsApp</a>}</div>
    </article>
  );
}

function ProductForm({ product, onSave, onCancel, submitLabel }) {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  async function submitProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const result = await onSave(new FormData(form));
      if (!product) form.reset();
      setNotice(result?.warning || (product ? 'Product updated.' : 'Product added.'));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The product could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submitProduct} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {error && <p className="text-sm text-red-800 md:col-span-2 xl:col-span-3" role="alert">{error}</p>}
      {notice && <p className="text-sm text-emerald-800 md:col-span-2 xl:col-span-3" role="status">{notice}</p>}
      <label className="grid gap-2 text-sm font-semibold text-gray-700">SKU<input name="sku" required maxLength="64" readOnly={Boolean(product)} defaultValue={product?.sku ?? ''} placeholder="SHR-101" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-800 focus:outline-none read-only:text-gray-500" /></label>
      <label className="grid gap-2 text-sm font-semibold text-gray-700">Product name<input name="name" required maxLength="120" defaultValue={product?.name ?? ''} placeholder="Royal Gold Temple Saree" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-800 focus:outline-none" /></label>
      <label className="grid gap-2 text-sm font-semibold text-gray-700">Category<select name="category" required defaultValue={product?.category ?? categories[0]} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-800 focus:outline-none">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-semibold text-gray-700">Original price (INR)<input name="originalPrice" type="number" min="1" step="1" required defaultValue={product?.originalPrice ?? ''} placeholder="8999" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-800 focus:outline-none" /></label>
      <label className="grid gap-2 text-sm font-semibold text-gray-700">Offer price (INR)<input name="sellingPrice" type="number" min="1" step="1" required defaultValue={product?.sellingPrice ?? ''} placeholder="6999" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-800 focus:outline-none" /></label>
      <label className="grid gap-2 text-sm font-semibold text-gray-700">Sizes (comma-separated)<input name="sizes" maxLength="120" defaultValue={product?.sizes ?? ''} placeholder="Free size or S, M, L" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-800 focus:outline-none" /></label>
      <label className="grid gap-2 text-sm font-semibold text-gray-700 md:col-span-2">Offer details<textarea name="offerDetails" rows="2" maxLength="300" defaultValue={product?.offerDetails ?? ''} placeholder="Optional promotion or product offer" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-800 focus:outline-none" /></label>
      {product && <p className="text-sm text-gray-600 md:col-span-2">Current image: <a href={product.image} target="_blank" rel="noreferrer" className="text-maroon-900 underline">View image</a></p>}
      <label className="grid gap-2 text-sm font-semibold text-gray-700 md:col-span-2">Product image (JPEG, PNG, or WebP; max 5 MB){product && ' — optional, upload to replace'}<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!product} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-maroon-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-maroon-800 focus:outline-none" /></label>
      <div className="flex justify-end gap-3 md:col-span-2 xl:col-span-3">
        {onCancel && <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700">Cancel</button>}
        <button type="submit" disabled={saving} className="rounded-lg bg-emerald-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}

function AdminPanel({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) {
  const [editingSku, setEditingSku] = useState('');
  const [deleteError, setDeleteError] = useState('');

  async function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}"? This will remove it from the storefront.`)) return;
    setDeleteError('');
    try {
      const result = await onDeleteProduct(product.sku);
      setEditingSku('');
      if (result?.warning) setDeleteError(result.warning);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'The product could not be deleted.');
    }
  }

  return (
    <aside className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:px-8">
      <div className="soft-card rounded-2xl border border-gold-500/40 bg-white p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Owner console</p>
        <h2 className="mt-1 font-brand text-2xl font-bold text-maroon-900">Add New Saree</h2>
        <div className="mt-6"><ProductForm submitLabel="Add product" onSave={onAddProduct} /></div>
      </div>
      <section className="soft-card rounded-2xl border border-gold-500/40 bg-white p-6 sm:p-8" aria-labelledby="manage-products-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Catalogue</p>
        <h2 id="manage-products-heading" className="mt-1 font-brand text-2xl font-bold text-maroon-900">Manage Sarees</h2>
        {deleteError && <p className="mt-4 text-sm text-red-800" role="alert">{deleteError}</p>}
        <div className="mt-5 grid gap-4">
          {products.map((product) => editingSku === product.sku
            ? <div key={product.sku} className="rounded-xl border border-gray-200 p-4">
                <ProductForm product={product} submitLabel="Save changes" onSave={(formData) => onUpdateProduct(product.sku, formData)} onCancel={() => setEditingSku('')} />
              </div>
            : <article key={product.sku} className="grid gap-4 rounded-xl border border-gray-200 p-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
                <img src={product.image} alt={product.name} className="h-24 w-24 rounded-lg object-cover" />
                <div>
                  <p className="font-semibold text-maroon-900">{product.name}</p>
                  <p className="mt-1 text-sm text-gray-600">{product.sku} · {product.category}</p>
                  <p className="mt-1 text-sm text-gray-700">{formatCurrency(product.sellingPrice)} <span className="text-gray-500">/ {formatCurrency(product.originalPrice)}</span></p>
                  {product.offerDetails && <p className="mt-1 text-sm text-gray-600">{product.offerDetails}</p>}
                </div>
                <div className="flex gap-2 sm:flex-col">
                  <button type="button" onClick={() => { setDeleteError(''); setEditingSku(product.sku); }} className="rounded-lg border border-maroon-900 px-4 py-2 text-sm font-semibold text-maroon-900">Edit</button>
                  <button type="button" onClick={() => deleteProduct(product)} className="rounded-lg border border-red-700 px-4 py-2 text-sm font-semibold text-red-700">Delete</button>
                </div>
              </article>)}
          {products.length === 0 && <p className="text-sm text-gray-600">No sarees have been added yet.</p>}
        </div>
      </section>
    </aside>
  );
}
export default function HomePage() {
  const { ownerOpen, setOwnerOpen, query, category, setCategory, products, setProducts, productsLoading, productsError, setCartItems, addToBag, savedSkus, setSavedSkus } = useOutletContext();
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === 'All Sarees' || product.category === category;
      const matchesQuery = !normalizedQuery || product.name.toLowerCase().includes(normalizedQuery) || product.sku.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  useEffect(() => {
    document.title = 'Shreivara | Luxury Ethnic Weaves';
  }, []);

  async function addProduct(formData) {
    return saveProductRequest('/api/products', { method: 'POST', body: formData }, 'The product could not be saved.').then((result) => {
      setProducts((current) => [result, ...current]);
      setCategory('All Sarees');
      return result;
    });
  }

  async function updateProduct(sku, formData) {
    const result = await saveProductRequest(`/api/products?sku=${encodeURIComponent(sku)}`, { method: 'PUT', body: formData }, 'The product could not be updated.');
    setProducts((current) => current.map((product) => product.sku === sku ? result.product : product));
    return result;
  }

  async function deleteProduct(sku) {
    const result = await saveProductRequest(`/api/products?sku=${encodeURIComponent(sku)}`, { method: 'DELETE' }, 'The product could not be deleted.');
    setProducts((current) => current.filter((product) => product.sku !== sku));
    setCartItems((current) => current.filter((item) => item.sku !== sku));
    setSavedSkus((current) => current.filter((savedSku) => savedSku !== sku));
    return result;
  }

  function toggleSaved(sku) {
    setSavedSkus((current) => current.includes(sku)
      ? current.filter((savedSku) => savedSku !== sku)
      : [...current, sku]);
  }

  async function saveProductRequest(url, options, failureMessage) {
    let response;
    try {
      response = await fetch(url, options);
    } catch {
      throw new Error('Could not reach the product service. Please try again.');
    }

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('The product service returned an invalid response.');
    }
    if (!response.ok) {
      throw new Error(typeof result.error === 'string' ? result.error : failureMessage);
    }
    return result;
  }

  return (
    <main id="top" className="w-full flex-1"><div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <section aria-label="Shreivara sarees and jewellery" className="editorial-hero grid overflow-hidden rounded-sm border border-[#e4dccd] bg-[#eee8dc] lg:min-h-[590px] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex flex-col items-start justify-center px-7 py-11 sm:px-12 lg:px-16 xl:px-20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-600 sm:text-xs">The art of Indian draping</p>
          <h1 className="mt-5 max-w-xl font-brand text-5xl font-medium leading-[0.98] tracking-tight text-maroon-900 sm:text-6xl">Drape in timeless elegance.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#62584a] sm:text-base">Discover handpicked sarees that bring heritage, craft, and quiet luxury to every occasion.</p>
          <a href="#collections" className="mt-8 inline-flex items-center gap-4 rounded-sm bg-maroon-900 px-6 py-3.5 font-brand text-base text-[#f8f5ed] transition hover:bg-maroon-800">Explore the collection <span aria-hidden="true">→</span></a>
          <div className="mt-10 hidden items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#786c5b] sm:flex"><span className="h-px w-10 bg-gold-600" />Tradition, with a modern point of view</div>
        </div>
        <div className="relative min-h-[320px] overflow-hidden bg-[#c9b398] sm:min-h-[420px] lg:min-h-full">
          <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=90" alt="Model wearing a traditional silk saree" className="absolute inset-0 h-full w-full object-cover object-[center_25%]" />
          <div className="pointer-events-none absolute inset-5 border border-white/40 sm:inset-8" />
          <p className="absolute bottom-5 left-5 bg-[#f6f2e9]/90 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-maroon-900 sm:bottom-8 sm:left-8">Made for moments that matter</p>
        </div>
      </section>
      <section id="collections" className="scroll-mt-52 py-7 sm:py-9">
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-600">Explore by craft</p><h2 className="mt-1 font-brand text-3xl font-medium text-maroon-900 sm:text-4xl">The collections</h2></div>
          <a href="#catalog" className="mb-1 text-xs text-gray-600 underline decoration-[#c8b99f] underline-offset-4 transition hover:text-maroon-900 sm:text-sm">View all sarees</a>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
          {categories.map((collection) => {
            const collectionProduct = products.find((product) => product.category === collection);
            return (
              <button key={collection} type="button" onClick={() => { setCategory(collection); document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }); }} className="group overflow-hidden rounded-sm text-left">
                <div className="aspect-[1.18/1] overflow-hidden border border-[#e1d8c9] bg-[#e8dfd0]">
                  <img src={collectionProduct?.image} alt={`${collection} saree collection`} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                </div>
                <span className="mt-3 block font-brand text-lg font-medium text-maroon-900 transition group-hover:text-gold-600 sm:text-xl">{collection}</span>
              </button>
            );
          })}
          {WHATSAPP_NUMBER && <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to see your jewellery collection.')}`} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-md text-left">
            <div className="aspect-[1.18/1] overflow-hidden border border-[#e1d8c9] bg-[#e8dfd0]">
              <img src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85" alt="Gold earrings and traditional jewellery" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
            </div>
            <span className="mt-3 block font-brand text-lg font-medium text-maroon-900 transition group-hover:text-gold-600 sm:text-xl">Jewellery</span>
          </a>}
        </div>
      </section>
      <section id="catalog" className="mt-3 scroll-mt-56 border-t border-[#ded5c6] pt-9 sm:mt-5 sm:pt-12"><div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-600">Curated for you</p><h2 className="mt-1 font-brand text-4xl font-medium text-maroon-900 sm:text-5xl">Sarees to treasure</h2></div><p className="text-xs text-gray-500" aria-live="polite">Showing {filteredProducts.length} piece{filteredProducts.length === 1 ? '' : 's'}</p></div>
        <div className="mb-8 flex flex-wrap gap-2" aria-label="Filter sarees by category">{['All Sarees', ...categories].map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`rounded-full border px-4 py-2 text-xs font-medium transition ${category === item ? 'border-maroon-900 bg-maroon-900 text-[#f8f5ed]' : 'border-[#d9d0c1] bg-transparent text-gray-700 hover:border-maroon-800 hover:text-maroon-900'}`}>{item}</button>)}</div>
        {productsLoading ? <p className="py-12 text-center text-sm text-gray-600" role="status">Loading the collection…</p>
          : productsError ? <p className="py-12 text-center text-sm text-red-800" role="alert">{productsError}</p>
            : filteredProducts.length ? <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">{filteredProducts.map((product) => <ProductCard key={`${product.sku}-${product.name}`} product={product} isSaved={savedSkus.includes(product.sku)} onToggleSaved={() => toggleSaved(product.sku)} onAddToBag={() => addToBag(product.sku)} />)}</div>
              : <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center"><div><p className="text-lg font-semibold text-gray-700">No sarees match your search.</p><p className="mt-2 text-sm text-gray-500">Try a different SKU or saree name.</p></div></div>}
      </section>
    </div>{ownerOpen && <AdminPanel products={products} onAddProduct={addProduct} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} />}</main>
  );
}