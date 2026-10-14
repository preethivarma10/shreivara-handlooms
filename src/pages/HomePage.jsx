import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { categories, WHATSAPP_NUMBER } from '../data/products.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function ProductCard({ product }) {
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
    <article className="soft-card group overflow-hidden rounded-[24px] border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative overflow-hidden"><img src={product.image} alt={product.name} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-[#FFE259] to-[#FFA751] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-maroon-900">{discount}% OFF</span><span className="absolute right-3 top-3 rounded-full bg-maroon-900/85 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">{product.sku}</span></div>
      <div className="p-4"><span className="mb-3 inline-block rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">{product.category}</span><h3 className="min-h-[56px] font-brand text-xl font-bold leading-snug text-maroon-900">{product.name}</h3><div className="mt-4 flex items-center gap-2"><span className="text-2xl font-bold text-maroon-900">{formatCurrency(product.sellingPrice)}</span><span className="text-sm text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span></div>
        {product.offerDetails && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-maroon-900">{product.offerDetails}</p>}
        {sizes.length > 0 && <p className="mt-2 text-sm text-gray-600">Available sizes: {sizes.join(', ')}</p>}
        {WHATSAPP_NUMBER && <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-emerald-800 px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50">Order on WhatsApp</a>}</div>
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
  const { ownerOpen, setOwnerOpen, query, category, setCategory, products, setProducts, productsLoading, productsError } = useOutletContext();
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
    return result;
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
      <section aria-label="Shreivara sarees and jewellery" className="overflow-hidden bg-maroon-900 text-center text-white">
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-500 sm:text-xs">Shreivara Handlooms</p>
          <h1 className="mt-2 font-brand text-2xl font-bold leading-tight sm:text-3xl">A Tradition of Elegance</h1>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-white/80 sm:text-sm">Discover beautiful sarees and timeless jewellery.</p>
          <a href="#collections" className="mt-4 inline-flex items-center rounded-md bg-gold-500 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-maroon-900 transition hover:bg-white sm:text-xs">Explore collection</a>
        </div>
        <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=2000&q=90" alt="Model wearing a traditional silk saree" className="h-64 w-full object-cover object-center sm:h-[420px] lg:h-[500px]" />
      </section>
      <section id="collections" className="scroll-mt-52 py-7 sm:py-9">
        <h2 className="text-center font-brand text-xl font-bold text-maroon-900 sm:text-2xl">Our Collections</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-5 md:grid-cols-3">
          {categories.map((collection) => {
            const collectionProduct = products.find((product) => product.category === collection);
            return (
              <button key={collection} type="button" onClick={() => { setCategory(collection); document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }); }} className="group overflow-hidden rounded-md text-left">
                <div className="aspect-[1.2/1] overflow-hidden bg-gray-100">
                  <img src={collectionProduct?.image} alt={`${collection} saree collection`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <span className="mt-2 block text-center text-xs font-semibold text-gray-800 transition group-hover:text-maroon-900 sm:text-sm">{collection}</span>
              </button>
            );
          })}
          {WHATSAPP_NUMBER && <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to see your jewellery collection.')}`} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-md text-left">
            <div className="aspect-[1.2/1] overflow-hidden bg-gray-100">
              <img src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85" alt="Gold earrings and traditional jewellery" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <span className="mt-2 block text-center text-xs font-semibold text-gray-800 transition group-hover:text-maroon-900 sm:text-sm">Jewellery</span>
          </a>}
        </div>
      </section>
      <section id="catalog" className="mt-3 scroll-mt-56 sm:mt-5"><div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">Curated styles</p><h2 className="font-brand text-3xl font-bold text-maroon-900">Featured Sarees</h2></div><p className="text-sm font-medium text-gray-500" aria-live="polite">Showing {filteredProducts.length} saree{filteredProducts.length === 1 ? '' : 's'}</p></div>
        <div className="mb-8 flex flex-wrap gap-2" aria-label="Filter sarees by category">{['All Sarees', ...categories].map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition ${category === item ? 'border-maroon-800 bg-maroon-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-maroon-800 hover:text-maroon-900'}`}>{item}</button>)}</div>
        {productsLoading ? <p className="py-12 text-center text-sm text-gray-600" role="status">Loading the collection…</p>
          : productsError ? <p className="py-12 text-center text-sm text-red-800" role="alert">{productsError}</p>
            : filteredProducts.length ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">{filteredProducts.map((product) => <ProductCard key={`${product.sku}-${product.name}`} product={product} />)}</div>
              : <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center"><div><p className="text-lg font-semibold text-gray-700">No sarees match your search.</p><p className="mt-2 text-sm text-gray-500">Try a different SKU or saree name.</p></div></div>}
      </section>
    </div>{ownerOpen && <AdminPanel products={products} onAddProduct={addProduct} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} />}</main>
  );
}