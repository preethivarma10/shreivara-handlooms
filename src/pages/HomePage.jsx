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

const CATEGORY_CARDS = [
  {
    category: 'Kanchi Pattu',
    title: 'Kanchi Pattu Silk',
    tagline: 'Pure Mulberry Silk & Lustrous Gold Zari',
    description: 'Woven in the ancient temple town of Kanchipuram with pure mulberry silk yarns and contrast korvai borders. Renowned for its heirloom weight, regal drape, and auspicious bridal heritage.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
  },
  {
    category: 'Mangalagiri',
    title: 'Mangalagiri Handloom',
    tagline: 'Super-fine Breathable Weave & Nizam Borders',
    description: 'Crafted by master artisans on traditional pit looms in the historic foothills of Mangalagiri. Revered for its crisp, lightweight combed cotton texture, pure zari Nizam borders, and all-day comfort.',
    image: 'https://images.unsplash.com/photo-1583391733956-62e74ed5b29c?auto=format&fit=crop&w=800&q=80'
  },
  {
    category: 'Fancy Silk',
    title: 'Fancy Silk & Resham',
    tagline: 'Festive Sheen, Dual-Tone Palette & Fluid Fall',
    description: 'A festive celebration of lightweight designer silks woven with delicate resham jaal, floral bel motifs, and iridescent dual tones. Tailored for effortless draping during poojas, sangeets, and parties.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'
  },
  {
    category: 'Organza & Chiffon',
    title: 'Organza & Chiffon',
    tagline: 'Translucent Ethereal Grace & Scalloped Edges',
    description: 'Whisper-light, sheer fabric with a delicate crisp body that falls into graceful contemporary pleats. Adorned with hand-embroidered scalloped borders and subtle metallic highlights for modern celebrations.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
  },
  {
    category: 'Jewellery',
    title: 'Fine Heritage Jewelry',
    tagline: 'Temple Heritage Motifs & Handcrafted Kundan',
    description: 'South Indian bridal temple chokers, antique necklace sets, and Kundan-pearl creations. Finished with divine goddess embossing, matte antique gold polish, and lustrous cluster pearls.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'
  }
];

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h2 className="font-brand text-2xl font-bold text-maroon-900">Dispatched Orders Management</h2>
          <p className="text-xs text-gray-500">Track shipments, update couriers, and manage customer fulfillment.</p>
        </div>
        <div className="flex gap-2">
          {['All', 'Pending', 'Dispatched'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`cursor-pointer rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                filter === tab ? 'bg-maroon-900 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
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
            <tr className="border-b border-gray-300 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              <th className="py-2.5 pr-4">Order ID & Date</th>
              <th className="py-2.5 px-4">Customer</th>
              <th className="py-2.5 px-4">Item Details</th>
              <th className="py-2.5 px-4">Total</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Courier & Tracking</th>
              <th className="py-2.5 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((order) => (
              <tr key={order.id} className="hover:bg-amber-50/40">
                <td className="py-3 pr-4 font-semibold text-maroon-900">
                  {order.id}
                  <div className="text-[10px] font-normal text-gray-400">{order.orderDate}</div>
                </td>
                <td className="py-3 px-4">
                  <p className="font-semibold text-gray-800">{order.customerName}</p>
                  <p className="text-[10px] text-gray-500">{order.phone}</p>
                </td>
                <td className="py-3 px-4 max-w-xs truncate text-gray-700">{order.items}</td>
                <td className="py-3 px-4 font-semibold text-gray-900">{formatCurrency(order.total)}</td>
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
                    <div className="text-[9px] text-gray-500 mt-0.5">Disp: {order.dispatchDate}</div>
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
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Tracking / AWB #"
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                      />
                      <div className="flex gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => saveTracking(order.id)}
                          className="cursor-pointer rounded bg-emerald-800 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-900"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="cursor-pointer rounded border border-gray-300 px-2 py-0.5 text-[10px] text-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : order.courier || order.trackingNumber ? (
                    <div>
                      <p className="font-semibold text-gray-800">{order.courier || 'Courier'}</p>
                      <p className="font-mono text-[10px] text-gray-500">{order.trackingNumber || 'Pending AWB'}</p>
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">No tracking info</span>
                  )}
                </td>
                <td className="py-3 pl-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {order.status !== 'Dispatched' && (
                      <button
                        type="button"
                        onClick={() => markDispatched(order.id)}
                        className="cursor-pointer rounded bg-emerald-800 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-900"
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
                      className="cursor-pointer rounded border border-maroon-900 px-2 py-1 text-[10px] font-semibold text-maroon-900 hover:bg-maroon-900 hover:text-white"
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
          <p className="py-8 text-center text-xs text-gray-500">No orders found in this view.</p>
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
            className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'catalogue'
                ? 'bg-maroon-900 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Catalogue Management
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'orders'
                ? 'bg-maroon-900 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
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
            <h2 id="manage-products-heading" className="mt-1 font-brand text-2xl font-bold text-maroon-900">Manage Catalogue & Stock</h2>
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
                      <button type="button" onClick={() => { setDeleteError(''); setEditingSku(product.sku); }} className="cursor-pointer rounded-lg border border-maroon-900 px-4 py-2 text-sm font-semibold text-maroon-900 hover:bg-maroon-900 hover:text-white">Edit</button>
                      <button type="button" onClick={() => deleteProduct(product)} className="cursor-pointer rounded-lg border border-red-700 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-700 hover:text-white">Delete</button>
                    </div>
                  </article>)}
              {products.length === 0 && <p className="text-sm text-gray-600">No products have been added yet.</p>}
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

  function handleCategoryClick(catName) {
    setCategory(catName);
    document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main id="top" className="w-full flex-1">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-16">

        {/* 1. Category Image & Explanation Cards Section */}
        <section aria-labelledby="craft-heritage-heading" className="scroll-mt-24 pt-2">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-600">Heritage Weaves &amp; Craft</p>
              <h2 id="craft-heritage-heading" className="mt-1 font-brand text-3xl font-medium text-maroon-900 sm:text-4xl">
                Explore by Craft
              </h2>
            </div>
            <p className="text-xs text-gray-500">Click any craft card to view collection</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {CATEGORY_CARDS.map((card) => (
              <div
                key={card.category}
                onClick={() => handleCategoryClick(card.category)}
                className="cursor-pointer group flex flex-col overflow-hidden rounded-xl border border-[#ded5c6] bg-[#fbf9f4] shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gold-500/60"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#e8dfd0]">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-2.5 left-3 text-[11px] font-bold uppercase tracking-wider text-white">
                    {card.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-brand text-lg font-semibold text-maroon-900 group-hover:text-gold-600 transition">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-[11px] font-medium text-gold-600 leading-snug">
                    {card.tagline}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#5c5040] line-clamp-4">
                    {card.description}
                  </p>
                  <span className="mt-auto pt-3 text-[10px] font-semibold uppercase tracking-wider text-maroon-900 group-hover:underline">
                    View collection →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Top Collections Section (Title changed, 'Curated for you' removed) */}
        <section id="collections" className="scroll-mt-24 pt-4 border-t border-[#ded5c6]">
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
            <div id="catalog-grid" className="scroll-mt-28">
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
          </div>
        </section>

        {/* 3. Custom Query Callout Banner */}
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
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I am looking for a customized saree/jewelry order. Could you please assist me?')}`}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer inline-flex items-center gap-2.5 rounded-full bg-[#25d366] px-6 py-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white shadow-md transition hover:bg-[#1ebe5d]"
            >
              <span className="h-4 w-4 shrink-0"><WhatsAppIcon /></span>
              Enquire with us on WhatsApp
            </a>
          </div>
        </section>

        {/* 4. Dedicated Inline About Us Section */}
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
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to enquire about your custom saree & jewelry orders.')}`}
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
                  <a href="tel:+919000510329" className="text-maroon-900 font-medium hover:underline">+91 90005 10329</a>
                </div>
                <div className="flex gap-3">
                  <span className="text-gold-600 font-bold shrink-0">✉️ Email:</span>
                  <a href="mailto:shreivara@gmail.com" className="text-maroon-900 font-medium hover:underline">shreivara@gmail.com</a>
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