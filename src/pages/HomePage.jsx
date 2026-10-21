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

const DEFAULT_ORDERS = [
  {
    id: 'SHR-ORD-101',
    customerName: 'Sravani Rao',
    phone: '+91 98490 12345',
    items: 'Royal Kanjivaram Silk (SHR-001) × 1',
    total: 14999,
    orderDate: '2026-10-18',
    status: 'Dispatched',
    courier: 'DTDC Express',
    trackingNumber: 'DTDC8829104',
    dispatchDate: '2026-10-19'
  },
  {
    id: 'SHR-ORD-102',
    customerName: 'Ananya Verma',
    phone: '+91 99887 65432',
    items: 'Mangalagiri Cotton Elegance (SHR-002) × 2',
    total: 8998,
    orderDate: '2026-10-20',
    status: 'Dispatched',
    courier: 'Blue Dart',
    trackingNumber: 'BLUED7739102',
    dispatchDate: '2026-10-21'
  },
  {
    id: 'SHR-ORD-103',
    customerName: 'Pooja Reddy',
    phone: '+91 97001 54321',
    items: 'Antique Goddess Temple Choker (JWL-001) × 1',
    total: 7999,
    orderDate: '2026-10-21',
    status: 'Pending',
    courier: '',
    trackingNumber: '',
    dispatchDate: ''
  }
];

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
    <article className="fashion-card group relative flex flex-col overflow-hidden rounded-2xl border border-[#e8dfd1] bg-white/90 backdrop-blur-xs shadow-2xs hover:border-[#dfb776] transition-all">
      {/* High-Fashion Editorial Image Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f4eee6]">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {/* Ambient Vignette Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#140407]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Floating Luxury Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {discount > 0 && (
            <span className="rounded-full bg-[#180408]/85 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#dfb776] border border-[#dfb776]/40 shadow-sm">
              {discount}% OFF
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 z-10 pointer-events-none">
          <span className="rounded-md bg-white/90 backdrop-blur-md px-2 py-0.5 text-[9.5px] font-mono tracking-widest text-neutral-600 uppercase border border-[#dfb776]/20 shadow-xs">
            {product.sku}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-600">
          {product.category}
        </p>
        <h3 className="mt-1.5 min-h-[50px] font-brand text-2xl font-normal leading-snug text-neutral-900 group-hover:text-maroon-900 transition-colors">
          {product.name}
        </h3>

        <div className="mt-3 flex items-baseline gap-2.5">
          <span className="text-2xl font-medium text-maroon-900 font-brand tracking-tight">
            {formatCurrency(product.sellingPrice)}
          </span>
          {product.originalPrice > product.sellingPrice && (
            <span className="text-xs text-neutral-400 line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>

        {product.offerDetails && (
          <p className="mt-3 rounded-lg border border-[#dfb776]/30 bg-[#fbf6eb] px-2.5 py-1.5 text-xs font-medium text-[#7a5518] flex items-center gap-1.5">
            <span>✦</span> {product.offerDetails}
          </p>
        )}

        {sizes.length > 0 && (
          <p className="mt-2 text-xs text-neutral-500 font-light">Available: {sizes.join(', ')}</p>
        )}

        {/* Couture Action Buttons */}
        <div className="mt-auto pt-5 grid grid-cols-2 gap-2">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0d3b2c] via-[#14533d] to-[#0f4432] px-3 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#fbf7f0] border border-[#dfb776]/35 shadow-xs transition-all hover:brightness-110 hover:shadow-md active:scale-[0.98]"
          >
            <span className="h-3.5 w-3.5 shrink-0 text-[#25d366]"><WhatsAppIcon /></span>
            Order
          </a>
          <button
            type="button"
            disabled={isMaxReached}
            onClick={onAddToBag}
            className={`cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-all active:scale-[0.98] ${
              isMaxReached
                ? 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 opacity-60'
                : 'border border-maroon-900 bg-white text-maroon-900 hover:bg-maroon-900 hover:text-gold-300 shadow-2xs hover:shadow-sm'
            }`}
          >
            <span className="h-3.5 w-3.5 shrink-0"><BagIcon /></span>
            {isMaxReached ? 'Limit' : 'Cart'}
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
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">SKU<input name="sku" required maxLength="64" readOnly={Boolean(product)} defaultValue={product?.sku ?? ''} placeholder="SHR-101" className="rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none read-only:text-neutral-500" /></label>
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">Product name<input name="name" required maxLength="120" defaultValue={product?.name ?? ''} placeholder="Royal Gold Temple Saree" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none" /></label>
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">Category<select name="category" required defaultValue={product?.category ?? categories[0]} className="cursor-pointer rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">Original price (INR)<input name="originalPrice" type="number" min="1" step="1" required defaultValue={product?.originalPrice ?? ''} placeholder="8999" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none" /></label>
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">Offer price (INR)<input name="sellingPrice" type="number" min="1" step="1" required defaultValue={product?.sellingPrice ?? ''} placeholder="6999" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none" /></label>
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">Stock quantity<input name="stock" type="number" min="1" step="1" required defaultValue={product?.stock ?? 5} placeholder="5" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none" /></label>
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">Sizes (comma-separated)<input name="sizes" maxLength="120" defaultValue={product?.sizes ?? ''} placeholder="Free size or S, M, L" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none" /></label>
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700 md:col-span-2">Offer details<textarea name="offerDetails" rows="2" maxLength="300" defaultValue={product?.offerDetails ?? ''} placeholder="Optional promotion or product offer" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none" /></label>
      {product && <p className="text-sm text-neutral-600 md:col-span-2">Current image: <a href={product.image} target="_blank" rel="noreferrer" className="cursor-pointer text-maroon-900 underline font-medium">View image</a></p>}
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700 md:col-span-2">Product image (JPEG, PNG, or WebP; max 5 MB){product && ' — optional, upload to replace'}<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!product} className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-maroon-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white focus:border-maroon-900 focus:outline-none" /></label>
      <div className="flex justify-end gap-3 md:col-span-2 xl:col-span-3 pt-2">
        {onCancel && <button type="button" onClick={onCancel} className="cursor-pointer rounded-xl border border-neutral-300 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50">Cancel</button>}
        <button type="submit" disabled={saving} className="cursor-pointer rounded-xl bg-maroon-900 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-maroon-800 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}

function DispatchedOrdersManager() {
  const [orders, setOrders] = useState(() => {
    try {
      const stored = localStorage.getItem('shreivara-orders');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return DEFAULT_ORDERS;
  });

  const [filter, setFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [courierInput, setCourierInput] = useState('');
  const [trackingInput, setTrackingInput] = useState('');

  function persist(newOrders) {
    setOrders(newOrders);
    try {
      localStorage.setItem('shreivara-orders', JSON.stringify(newOrders));
    } catch (_) {}
  }

  function markDispatched(id) {
    const today = new Date().toISOString().split('T')[0];
    const updated = orders.map((o) => {
      if (o.id === id) {
        return {
          ...o,
          status: 'Dispatched',
          dispatchDate: o.dispatchDate || today,
          courier: o.courier || 'DTDC Express'
        };
      }
      return o;
    });
    persist(updated);
  }

  function saveTracking(id) {
    const today = new Date().toISOString().split('T')[0];
    const updated = orders.map((o) => {
      if (o.id === id) {
        return {
          ...o,
          courier: courierInput || o.courier,
          trackingNumber: trackingInput || o.trackingNumber,
          status: 'Dispatched',
          dispatchDate: o.dispatchDate || today
        };
      }
      return o;
    });
    persist(updated);
    setEditingId(null);
  }

  const filtered = orders.filter((o) => (filter === 'All' ? true : o.status === filter));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="font-brand text-2xl font-bold text-maroon-900">Dispatched Orders Management</h2>
          <p className="text-xs text-neutral-500">Track shipments, update couriers, and manage customer fulfillment.</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Pending', 'Dispatched'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`cursor-pointer rounded-full px-4 py-1 text-xs font-semibold transition ${
                filter === tab ? 'bg-maroon-900 text-white' : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-200 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              <th className="py-2.5 pr-4">Order ID &amp; Date</th>
              <th className="py-2.5 px-4">Customer</th>
              <th className="py-2.5 px-4">Item Details</th>
              <th className="py-2.5 px-4">Total</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Courier &amp; Tracking</th>
              <th className="py-2.5 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filtered.map((order) => (
              <tr key={order.id} className="hover:bg-amber-50/40">
                <td className="py-3 pr-4 font-semibold text-maroon-900">
                  {order.id}
                  <div className="text-[10px] font-normal text-neutral-400">{order.orderDate}</div>
                </td>
                <td className="py-3 px-4">
                  <p className="font-semibold text-neutral-800">{order.customerName}</p>
                  <p className="text-[10px] text-neutral-500">{order.phone}</p>
                </td>
                <td className="py-3 px-4 max-w-xs truncate text-neutral-700">{order.items}</td>
                <td className="py-3 px-4 font-semibold text-neutral-900">{formatCurrency(order.total)}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      order.status === 'Dispatched'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.status}
                  </span>
                  {order.dispatchDate && (
                    <div className="text-[9px] text-neutral-500 mt-0.5">Disp: {order.dispatchDate}</div>
                  )}
                </td>
                <td className="py-3 px-4">
                  {editingId === order.id ? (
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="text"
                        placeholder="Courier (e.g. DTDC)"
                        value={courierInput}
                        onChange={(e) => setCourierInput(e.target.value)}
                        className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Tracking / AWB #"
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value)}
                        className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                      />
                      <div className="flex gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => saveTracking(order.id)}
                          className="cursor-pointer rounded-lg bg-emerald-800 px-2.5 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-900"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="cursor-pointer rounded-lg border border-neutral-300 px-2 py-0.5 text-[10px] text-neutral-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : order.courier || order.trackingNumber ? (
                    <div>
                      <p className="font-semibold text-neutral-800">{order.courier || 'Courier'}</p>
                      <p className="font-mono text-[10px] text-neutral-500">{order.trackingNumber || 'Pending AWB'}</p>
                    </div>
                  ) : (
                    <span className="text-[11px] text-neutral-400 italic">No tracking info</span>
                  )}
                </td>
                <td className="py-3 pl-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {order.status !== 'Dispatched' && (
                      <button
                        type="button"
                        onClick={() => markDispatched(order.id)}
                        className="cursor-pointer rounded-lg bg-emerald-800 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-900"
                      >
                        Mark Dispatched
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(order.id);
                        setCourierInput(order.courier || '');
                        setTrackingInput(order.trackingNumber || '');
                      }}
                      className="cursor-pointer rounded-lg border border-maroon-900 px-2 py-1 text-[10px] font-semibold text-maroon-900 hover:bg-maroon-900 hover:text-white"
                    >
                      {editingId === order.id ? 'Editing' : 'Update Tracking'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-neutral-500">No orders found in this view.</p>
        )}
      </div>
    </div>
  );
}

function AdminPanel({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) {
  const [activeTab, setActiveTab] = useState('catalogue');
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
    <aside className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-16 sm:px-6 lg:px-8 mt-12 border-t border-gold-500/30 pt-8">
      {/* Admin Panel Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gold-500/30 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Administrative Portal</p>
          <h2 className="mt-1 font-brand text-3xl font-bold text-maroon-900">Owner Console</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('catalogue')}
            className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'catalogue'
                ? 'bg-maroon-900 text-white shadow-xs'
                : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            Catalogue Management
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'orders'
                ? 'bg-maroon-900 text-white shadow-xs'
                : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            Dispatched Orders
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <section className="soft-card rounded-2xl border border-gold-500/40 bg-white p-6 sm:p-8">
          <DispatchedOrdersManager />
        </section>
      ) : (
        <>
          <div className="soft-card rounded-2xl border border-gold-500/40 bg-white p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Product Entry</p>
            <h2 className="mt-1 font-brand text-2xl font-bold text-maroon-900">Add New Product</h2>
            <div className="mt-6"><ProductForm submitLabel="Add product" onSave={onAddProduct} /></div>
          </div>
          <section className="soft-card rounded-2xl border border-gold-500/40 bg-white p-6 sm:p-8" aria-labelledby="manage-products-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Inventory</p>
            <h2 id="manage-products-heading" className="mt-1 font-brand text-2xl font-bold text-maroon-900">Manage Catalogue &amp; Stock</h2>
            {deleteError && <p className="mt-4 text-sm text-red-800" role="alert">{deleteError}</p>}
            <div className="mt-5 grid gap-4">
              {products.map((product) => editingSku === product.sku
                ? <div key={product.sku} className="rounded-2xl border border-neutral-200 p-4 bg-neutral-50/50">
                    <ProductForm product={product} submitLabel="Save changes" onSave={(formData) => onUpdateProduct(product.sku, formData)} onCancel={() => setEditingSku('')} />
                  </div>
                : <article key={product.sku} className="grid gap-4 rounded-2xl border border-neutral-200 p-4 sm:grid-cols-[96px_1fr_auto] sm:items-center bg-white shadow-2xs">
                    <img src={product.image} alt={product.name} className="h-24 w-24 rounded-xl object-cover border border-neutral-200" />
                    <div>
                      <p className="font-semibold text-maroon-900 font-brand text-xl">{product.name}</p>
                      <p className="mt-1 text-xs text-neutral-500">{product.sku} · {product.category} · Stock: {product.stock ?? 5}</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-800">{formatCurrency(product.sellingPrice)} <span className="text-neutral-400 font-normal line-through">/ {formatCurrency(product.originalPrice)}</span></p>
                      {product.offerDetails && <p className="mt-1 text-xs text-amber-800">{product.offerDetails}</p>}
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      <button type="button" onClick={() => { setDeleteError(''); setEditingSku(product.sku); }} className="cursor-pointer rounded-xl border border-maroon-900 px-4 py-1.5 text-xs font-semibold text-maroon-900 hover:bg-maroon-900 hover:text-white transition">Edit</button>
                      <button type="button" onClick={() => deleteProduct(product)} className="cursor-pointer rounded-xl border border-red-700 px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-700 hover:text-white transition">Delete</button>
                    </div>
                  </article>)}
              {products.length === 0 && <p className="text-sm text-neutral-500">No products have been added yet.</p>}
            </div>
          </section>
        </>
      )}
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
    addToBag
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
    return {};
  }

  return (
    <main id="top" className="w-full flex-1">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">

        {/* Top Collections Section */}
        <section id="collections" className="scroll-mt-24">
          <div id="catalog" className="scroll-mt-24">
            <div className="mb-8 sm:mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#ebdcc9] pb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-gold-600 bg-gold-500/10 border border-gold-500/25 px-3 py-1 rounded-full mb-3">
                  <span>✦</span> Curated Haute Couture <span>✦</span>
                </span>
                <h1 className="font-brand text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-maroon-900">
                  Top Collections
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-neutral-500 tracking-wide font-light">
                  Sarees to Treasures • Handcrafted with Heritage Artistry
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to schedule a personal drape walkthrough on WhatsApp.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-maroon-900/30 bg-white/95 px-4 sm:px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-maroon-900 shadow-2xs hover:bg-maroon-900 hover:text-gold-300 transition-all hover:border-maroon-900 active:scale-[0.98]"
                >
                  <span className="h-3.5 w-3.5 text-[#25d366]"><WhatsAppIcon /></span>
                  Video Consultation
                </a>
                <span className="rounded-full border border-gold-500/30 bg-white/90 px-4 py-2 text-xs font-medium text-neutral-700 shadow-2xs font-mono" aria-live="polite">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'Design' : 'Designs'}
                </span>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="mb-10 sm:mb-12 flex flex-wrap gap-2.5 sm:gap-3" aria-label="Filter collections by category">
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
                    className={`cursor-pointer rounded-full px-5 py-2.5 text-xs font-medium tracking-[0.1em] uppercase transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#23080e] text-[#dfb776] shadow-md border border-[#dfb776] ring-1 ring-[#dfb776]/50'
                        : 'border border-[#ded5c6] bg-white/85 text-neutral-700 hover:border-gold-500 hover:text-maroon-900 shadow-2xs'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {/* Products Grid */}
            <div id="catalog-grid" className="scroll-mt-28">
              {productsLoading ? (
                <div className="py-20 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-maroon-900 border-r-transparent mb-3" />
                  <p className="text-sm font-medium text-neutral-500 font-light">Curating the collection…</p>
                </div>
              ) : productsError ? (
                <p className="py-16 text-center text-sm text-red-800" role="alert">{productsError}</p>
              ) : filteredProducts.length ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-[#dfb776]/40 bg-white/80 p-12 text-center shadow-xs">
                  <div>
                    <p className="font-brand text-2xl font-medium text-neutral-800">No pieces match your search.</p>
                    <p className="mt-2 text-xs text-neutral-500 font-light">Try selecting a different category filter or clear your search term.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Custom Query Callout Banner */}
        <section className="rounded-3xl border border-[#dfb776]/35 bg-velvet p-8 sm:p-14 text-center text-[#faf8f5] shadow-2xl relative overflow-hidden">
          {/* Ambient Golden Glow Effect */}
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#dfb776]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#dfb776]/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-[#dfb776] border border-[#dfb776]/35 px-4 py-1 rounded-full bg-[#dfb776]/10">
              <span>✦</span> Personalized Styling &amp; Custom Sourcing <span>✦</span>
            </span>
            <h2 className="font-brand text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-tight">
              Looking for something else? Enquire with us on WhatsApp!
            </h2>
            <p className="mx-auto max-w-2xl text-xs sm:text-sm text-[#faf8f5]/85 leading-relaxed font-light">
              Whether you are curating a bridal trousseau, matching specific family wedding colors, or seeking a rare heritage weave, our master stylists are ready to share video walkthroughs and tailored collections.
            </p>
            <div className="pt-3 flex justify-center">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I am looking for a customized saree/jewelry order. Could you please assist me?')}`}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#0d3b2c] via-[#14533d] to-[#0f4432] px-8 py-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] text-[#fbf7f0] border border-[#dfb776]/50 shadow-xl transition-all hover:brightness-110 hover:shadow-2xl hover:border-[#dfb776]"
              >
                <span className="h-4 w-4 shrink-0 text-[#25d366]"><WhatsAppIcon /></span>
                Enquire with us on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Dedicated Inline About Us Section */}
        <section id="about-us" className="scroll-mt-24 rounded-3xl border border-[#e8dfd1] bg-white/95 p-6 sm:p-10 lg:p-14 shadow-sm relative overflow-hidden">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 items-center">
            <div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-gold-600 bg-gold-500/10 border border-gold-500/25 px-3 py-1 rounded-full mb-3">
                The Shreivara Heritage
              </span>
              <h2 className="font-brand text-3xl sm:text-4xl lg:text-5xl font-normal text-maroon-900 leading-tight">
                Sarees and fine jewelry for life's treasured moments.
              </h2>
              <p className="mt-5 text-xs sm:text-sm leading-relaxed text-neutral-600 font-light">
                Founded with a devotion to authentic Indian textiles, Shreivara Handlooms bridges generational artisan weaving with modern elegance. From the pure zari temple borders of Kanchipuram to the featherlight cottons of Mangalagiri and handcrafted South Indian bridal jewelry, every piece in our studio is personally curated for longevity, beauty, and festive warmth.
              </p>

              {/* Callout Box */}
              <div className="mt-8 rounded-2xl border border-gold-500/40 bg-[#faf6ee]/90 p-6 shadow-2xs relative">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-maroon-900">Customized Bridal &amp; Festive Orders</p>
                <p className="mt-1.5 text-xs sm:text-sm text-neutral-700 leading-relaxed font-light">
                  Reach us on WhatsApp for inquiries and customized orders. We provide real-time drape previews, blouse fabric suggestions, and worldwide delivery support.
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to enquire about your custom saree & jewelry orders.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-maroon-900 via-[#3a0f19] to-[#24080e] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#faf8f5] border border-gold-400/35 transition hover:brightness-110 shadow-sm"
                >
                  <span className="h-3.5 w-3.5 text-[#25d366]"><WhatsAppIcon /></span>
                  Order / Inquire on WhatsApp (+91 90005 10329)
                </a>
              </div>
            </div>

            {/* Shop Location & Address Details */}
            <div className="rounded-2xl border border-[#e8dfd1] bg-[#fbf9f5] p-7 space-y-6 shadow-2xs">
              <div className="border-b border-[#ebdcc9] pb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-600">Atelier Visit</p>
                <h3 className="font-brand text-2xl font-medium text-maroon-900 mt-1">Shop Location &amp; Visit Details</h3>
              </div>
              <div className="space-y-4 text-xs sm:text-sm text-neutral-700">
                <div className="flex gap-3.5 items-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4ebe0] border border-gold-400/30 text-sm">📍</span>
                  <div>
                    <p className="font-semibold text-neutral-900">Studio Address</p>
                    <p className="text-neutral-600 mt-0.5">Shreivara Handlooms &amp; Fine Jewelry</p>
                    <p className="text-neutral-600">Plot No. 42, Heritage Weavers Lane, Jubilee Hills</p>
                    <p className="text-neutral-600">Hyderabad, Telangana — 500033, India</p>
                  </div>
                </div>
                <div className="flex gap-3.5 items-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4ebe0] border border-gold-400/30 text-sm">🕒</span>
                  <div>
                    <p className="font-semibold text-neutral-900">Studio Hours</p>
                    <p className="text-neutral-600 mt-0.5">Monday – Saturday: 10:30 AM – 7:30 PM IST</p>
                  </div>
                </div>
                <div className="flex gap-3.5 items-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4ebe0] border border-gold-400/30 text-sm">📞</span>
                  <div>
                    <p className="font-semibold text-neutral-900">Phone &amp; WhatsApp</p>
                    <a href="tel:+919000510329" className="text-maroon-900 font-medium hover:underline mt-0.5 block">+91 90005 10329</a>
                  </div>
                </div>
                <div className="flex gap-3.5 items-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4ebe0] border border-gold-400/30 text-sm">✉️</span>
                  <div>
                    <p className="font-semibold text-neutral-900">Email Inquiries</p>
                    <a href="mailto:shreivara@gmail.com" className="text-maroon-900 font-medium hover:underline mt-0.5 block">shreivara@gmail.com</a>
                  </div>
                </div>
                <div className="flex gap-3.5 items-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4ebe0] border border-gold-400/30 text-sm">✈️</span>
                  <div>
                    <p className="font-semibold text-neutral-900">Worldwide Shipping</p>
                    <p className="text-neutral-600 mt-0.5">Express doorstep delivery across India and reliable worldwide shipping via DHL / FedEx.</p>
                  </div>
                </div>
              </div>
            </div>
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