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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 8.5h13l1 12h-15l1-12Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function ProductCard({ product, cartQuantity = 0, onAddToBag }) {
  const sizes = product.sizes ? product.sizes.split(',').map((size) => size.trim()).filter(Boolean) : [];
  const imageUrl = product.image.startsWith('/') ? `${window.location.origin}${product.image}` : product.image;
  const maxStock = product.stock ?? 5;
  const isMaxReached = cartQuantity >= maxStock;

  const waMessage = encodeURIComponent([
    'Hello Shreivara, I would like to place an order:',
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

  return (
    <article className="group overflow-hidden rounded-sm border border-[#e1d8c9] bg-[#fbf9f4] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(58,43,25,0.12)]">
      <div className="relative overflow-hidden bg-[#e8dfd0]">
        <img
          src={product.image}
          alt={product.name}
          className="h-[320px] w-full object-cover transition duration-700 group-hover:scale-[1.035]"
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3 bg-[#f6f2e9]/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-maroon-900">
            {discount}% off
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600">{product.category}</p>
        <h3 className="mt-2 min-h-[52px] font-brand text-2xl font-medium leading-tight text-maroon-900">{product.name}</h3>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-semibold text-maroon-900">{formatCurrency(product.sellingPrice)}</span>
          {product.originalPrice > product.sellingPrice && (
            <span className="text-sm text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
          )}
          <span className="ml-auto text-[10px] uppercase tracking-widest text-gray-500">{product.sku}</span>
        </div>
        {product.offerDetails && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-maroon-900">{product.offerDetails}</p>}
        {sizes.length > 0 && <p className="mt-2 text-sm text-gray-600">Available sizes: {sizes.join(', ')}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-sm bg-[#25d366] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#1ebe5d]"
          >
            <span className="h-3.5 w-3.5 shrink-0"><WhatsAppIcon /></span>
            Order on WhatsApp
          </a>
          <button
            type="button"
            disabled={isMaxReached}
            onClick={onAddToBag}
            className={`cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-sm border px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
              isMaxReached
                ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 opacity-60'
                : 'border-maroon-900 text-maroon-900 hover:bg-maroon-900 hover:text-[#f8f5ed]'
            }`}
          >
            <span className="h-3.5 w-3.5 shrink-0"><BagIcon /></span>
            {isMaxReached ? 'Limit Reached' : 'Add to Cart'}
          </button>
        </div>
      </div>
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
      <label className="grid gap-2 text-sm font-semibold text-gray-700">Category<select name="category" required defaultValue={product?.category ?? categories[0]} className="cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-800 focus:outline-none">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-semibold text-gray-700">Original price (INR)<input name="originalPrice" type="number" min="1" step="1" required defaultValue={product?.originalPrice ?? ''} placeholder="8999" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-800 focus:outline-none" /></label>
      <label className="grid gap-2 text-sm font-semibold text-gray-700">Offer price (INR)<input name="sellingPrice" type="number" min="1" step="1" required defaultValue={product?.sellingPrice ?? ''} placeholder="6999" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-800 focus:outline-none" /></label>
      <label className="grid gap-2 text-sm font-semibold text-gray-700">Stock quantity<input name="stock" type="number" min="1" step="1" required defaultValue={product?.stock ?? 5} placeholder="5" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-800 focus:outline-none" /></label>
      <label className="grid gap-2 text-sm font-semibold text-gray-700">Sizes (comma-separated)<input name="sizes" maxLength="120" defaultValue={product?.sizes ?? ''} placeholder="Free size or S, M, L" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-800 focus:outline-none" /></label>
      <label className="grid gap-2 text-sm font-semibold text-gray-700 md:col-span-2">Offer details<textarea name="offerDetails" rows="2" maxLength="300" defaultValue={product?.offerDetails ?? ''} placeholder="Optional promotion or product offer" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-800 focus:outline-none" /></label>
      {product && <p className="text-sm text-gray-600 md:col-span-2">Current image: <a href={product.image} target="_blank" rel="noreferrer" className="cursor-pointer text-maroon-900 underline">View image</a></p>}
      <label className="grid gap-2 text-sm font-semibold text-gray-700 md:col-span-2">Product image (JPEG, PNG, or WebP; max 5 MB){product && ' — optional, upload to replace'}<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!product} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-maroon-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-maroon-800 focus:outline-none" /></label>
      <div className="flex justify-end gap-3 md:col-span-2 xl:col-span-3">
        {onCancel && <button type="button" onClick={onCancel} className="cursor-pointer rounded-lg border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700">Cancel</button>}
        <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-emerald-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : submitLabel}</button>
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
        <h2 className="mt-1 font-brand text-2xl font-bold text-maroon-900">Add New Product</h2>
        <div className="mt-6"><ProductForm submitLabel="Add product" onSave={onAddProduct} /></div>
      </div>
      <section className="soft-card rounded-2xl border border-gold-500/40 bg-white p-6 sm:p-8" aria-labelledby="manage-products-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Catalogue</p>
        <h2 id="manage-products-heading" className="mt-1 font-brand text-2xl font-bold text-maroon-900">Manage Products</h2>
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
                  <p className="mt-1 text-sm text-gray-600">{product.sku} · {product.category} · Stock: {product.stock ?? 5}</p>
                  <p className="mt-1 text-sm text-gray-700">{formatCurrency(product.sellingPrice)} <span className="text-gray-500">/ {formatCurrency(product.originalPrice)}</span></p>
                  {product.offerDetails && <p className="mt-1 text-sm text-gray-600">{product.offerDetails}</p>}
                </div>
                <div className="flex gap-2 sm:flex-col">
                  <button type="button" onClick={() => { setDeleteError(''); setEditingSku(product.sku); }} className="cursor-pointer rounded-lg border border-maroon-900 px-4 py-2 text-sm font-semibold text-maroon-900">Edit</button>
                  <button type="button" onClick={() => deleteProduct(product)} className="cursor-pointer rounded-lg border border-red-700 px-4 py-2 text-sm font-semibold text-red-700">Delete</button>
                </div>
              </article>)}
          {products.length === 0 && <p className="text-sm text-gray-600">No products have been added yet.</p>}
        </div>
      </section>
    </aside>
  );
}

export default function HomePage() {
  const {
    ownerOpen,
    query,
    category,
    setCategory,
    products,
    setProducts,
    productsLoading,
    productsError,
    cartItems,
    setCartItems,
    addToBag,
    savedSkus,
    setSavedSkus
  } = useOutletContext();

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        category === 'All Sarees' ||
        category === 'All Collections' ||
        product.category === category;
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.sku.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  useEffect(() => {
    document.title = 'Shreivara Handlooms | Premium Sarees & Fine Jewelry';
  }, []);

  function persistProducts(next) {
    try {
      window.localStorage.setItem('shreivara-products', JSON.stringify(next));
    } catch (error) {
      console.error('Could not save products to localStorage.', error);
      throw new Error('Your browser storage is full. Try removing some products first.');
    }
  }

  function readImageAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file || !(file instanceof File)) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read the image file.'));
      reader.readAsDataURL(file);
    });
  }

  async function addProduct(formData) {
    const sku = (formData.get('sku') || '').toString().trim();
    if (!sku) throw new Error('SKU is required.');
    if (products.some((p) => p.sku === sku)) throw new Error(`A product with SKU "${sku}" already exists.`);

    const imageFile = formData.get('image');
    const imageUrl = await readImageAsDataUrl(imageFile instanceof File && imageFile.size > 0 ? imageFile : null);
    if (!imageUrl) throw new Error('Please select a product image.');

    const newProduct = {
      sku,
      name: (formData.get('name') || '').toString().trim(),
      category: (formData.get('category') || '').toString().trim(),
      originalPrice: Number(formData.get('originalPrice')),
      sellingPrice: Number(formData.get('sellingPrice')),
      stock: Number(formData.get('stock')) || 5,
      sizes: (formData.get('sizes') || '').toString().trim(),
      offerDetails: (formData.get('offerDetails') || '').toString().trim(),
      image: imageUrl,
    };
    const next = [newProduct, ...products];
    persistProducts(next);
    setProducts(next);
    setCategory('All Collections');
    return newProduct;
  }

  async function updateProduct(sku, formData) {
    const imageFile = formData.get('image');
    const hasNewImage = imageFile instanceof File && imageFile.size > 0;
    const imageUrl = hasNewImage ? await readImageAsDataUrl(imageFile) : null;

    const next = products.map((p) => {
      if (p.sku !== sku) return p;
      return {
        ...p,
        name: (formData.get('name') || '').toString().trim() || p.name,
        category: (formData.get('category') || '').toString().trim() || p.category,
        originalPrice: Number(formData.get('originalPrice')) || p.originalPrice,
        sellingPrice: Number(formData.get('sellingPrice')) || p.sellingPrice,
        stock: Number(formData.get('stock')) || p.stock || 5,
        sizes: (formData.get('sizes') || '').toString().trim(),
        offerDetails: (formData.get('offerDetails') || '').toString().trim(),
        ...(imageUrl ? { image: imageUrl } : {}),
      };
    });
    persistProducts(next);
    setProducts(next);
    return { product: next.find((p) => p.sku === sku) };
  }

  async function deleteProduct(sku) {
    const next = products.filter((p) => p.sku !== sku);
    persistProducts(next);
    setProducts(next);
    setCartItems((current) => current.filter((item) => item.sku !== sku));
    setSavedSkus((current) => current.filter((savedSku) => savedSku !== sku));
    return {};
  }

  return (
    <main id="top" className="w-full flex-1">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Combined Collections & Sarees Section */}
        <section id="collections" className="scroll-mt-24">
          <div id="catalog" className="scroll-mt-24">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-600">Curated for you</p>
                <h1 className="mt-1 font-brand text-4xl font-medium text-maroon-900 sm:text-5xl">Collections</h1>
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
                  (item === 'All Collections' && (category === 'All Collections' || category === 'All Sarees')) ||
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
            {productsLoading ? (
              <p className="py-12 text-center text-sm text-gray-600" role="status">Loading the collection…</p>
            ) : productsError ? (
              <p className="py-12 text-center text-sm text-red-800" role="alert">{productsError}</p>
            ) : filteredProducts.length ? (
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
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
              <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                <div>
                  <p className="text-lg font-semibold text-gray-700">No items match your search.</p>
                  <p className="mt-2 text-sm text-gray-500">Try a different search term or category filter.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      {ownerOpen && (
        <AdminPanel
          products={products}
          onAddProduct={addProduct}
          onUpdateProduct={updateProduct}
          onDeleteProduct={deleteProduct}
        />
      )}
    </main>
  );
}