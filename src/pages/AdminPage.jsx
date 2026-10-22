import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categories, WHATSAPP_NUMBER } from '../data/products.js';
import { DEFAULT_PRODUCTS } from '../components/SiteLayout.jsx';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
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

function ProductForm({ product, onSave, onCancel, submitLabel }) {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(product?.image || '');

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is larger than 5 MB. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  }

  async function submitProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const result = await onSave(new FormData(form));
      if (!product) {
        form.reset();
        setImagePreview('');
      }
      setNotice(result?.warning || (product ? 'Product updated successfully.' : 'Product added successfully.'));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The product could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submitProduct} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {error && <p className="text-sm font-medium text-red-800 md:col-span-2 xl:col-span-3 bg-red-50 p-3 rounded-xl border border-red-200" role="alert">{error}</p>}
      {notice && <p className="text-sm font-medium text-emerald-800 md:col-span-2 xl:col-span-3 bg-emerald-50 p-3 rounded-xl border border-emerald-200" role="status">{notice}</p>}
      
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">
        SKU
        <input name="sku" required maxLength="64" readOnly={Boolean(product)} defaultValue={product?.sku ?? ''} placeholder="SHR-101" className="rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none read-only:text-neutral-500" />
      </label>
      
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">
        Product name
        <input name="name" required maxLength="120" defaultValue={product?.name ?? ''} placeholder="Royal Gold Temple Saree" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none" />
      </label>
      
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">
        Category
        <select name="category" required defaultValue={product?.category ?? categories[0]} className="cursor-pointer rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none">
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">
        Original price (INR)
        <input name="originalPrice" type="number" min="1" step="1" required defaultValue={product?.originalPrice ?? ''} placeholder="8999" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none" />
      </label>
      
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">
        Offer / Selling price (INR)
        <input name="sellingPrice" type="number" min="1" step="1" required defaultValue={product?.sellingPrice ?? ''} placeholder="6999" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none" />
      </label>
      
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">
        Stock quantity
        <input name="stock" type="number" min="0" step="1" required defaultValue={product?.stock ?? 5} placeholder="5" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none" />
      </label>
      
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">
        Sizes (comma-separated)
        <input name="sizes" maxLength="120" defaultValue={product?.sizes ?? ''} placeholder="Free size or S, M, L" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none" />
      </label>
      
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700 md:col-span-2">
        Offer details
        <textarea name="offerDetails" rows="2" maxLength="300" defaultValue={product?.offerDetails ?? ''} placeholder="Optional promotional callout (e.g., Grand Launch Offer)" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none" />
      </label>
      
      <div className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 md:col-span-2">
        <span>Product image (Upload file converted to Base64)</span>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required={!product && !imagePreview}
            onChange={handleFileChange}
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-maroon-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white focus:border-maroon-900 focus:outline-none cursor-pointer"
          />
          {imagePreview && (
            <div className="flex items-center gap-2.5 shrink-0 bg-gold-50/70 p-2 rounded-xl border border-gold-300">
              <img
                src={imagePreview}
                alt="Product preview"
                className="h-14 w-14 rounded-lg object-cover border border-gold-400 shadow-2xs"
              />
              <div className="text-[10px] text-maroon-950">
                <span className="block font-bold text-emerald-800">✓ Base64 Ready</span>
                <span className="text-neutral-500 font-normal">Preview loaded</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <label className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-700 md:col-span-2 xl:col-span-3 py-1 bg-amber-50/60 p-3.5 rounded-xl border border-gold-200">
        <input
          name="available"
          type="checkbox"
          defaultChecked={product ? product.available !== false : true}
          className="h-4 w-4 rounded accent-maroon-900 cursor-pointer"
        />
        <span>In Stock &amp; Available for Purchase (Storefront Visibility)</span>
      </label>
      
      <div className="flex justify-end gap-3 md:col-span-2 xl:col-span-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="cursor-pointer rounded-xl border border-neutral-300 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 transition">
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving} className="cursor-pointer rounded-xl bg-maroon-900 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-maroon-800 disabled:cursor-not-allowed disabled:opacity-60 shadow-xs">
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function DispatchedOrdersManager() {
  const [orders, setOrders] = useState(() => {
    try {
      const stored = localStorage.getItem('shreivara-orders');
      if (stored) return JSON.parse(stored);
    } catch (_) { }
    return DEFAULT_ORDERS;
  });

  const [filter, setFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [courierInput, setCourierInput] = useState('');
  const [trackingInput, setTrackingInput] = useState('');
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    phone: '',
    items: '',
    total: '',
    status: 'Pending',
    courier: '',
    trackingNumber: ''
  });

  function persist(newOrders) {
    setOrders(newOrders);
    try {
      localStorage.setItem('shreivara-orders', JSON.stringify(newOrders));
    } catch (_) { }
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

  function handleCreateOrder(e) {
    e.preventDefault();
    const orderId = `SHR-ORD-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];
    const created = {
      id: orderId,
      customerName: newOrder.customerName.trim(),
      phone: newOrder.phone.trim(),
      items: newOrder.items.trim(),
      total: Number(newOrder.total) || 0,
      orderDate: today,
      status: newOrder.status,
      courier: newOrder.courier.trim(),
      trackingNumber: newOrder.trackingNumber.trim(),
      dispatchDate: newOrder.status === 'Dispatched' ? today : ''
    };
    persist([created, ...orders]);
    setIsAddingOrder(false);
    setNewOrder({
      customerName: '',
      phone: '',
      items: '',
      total: '',
      status: 'Pending',
      courier: '',
      trackingNumber: ''
    });
  }

  function deleteOrder(id) {
    if (window.confirm('Are you sure you want to delete this order record?')) {
      persist(orders.filter((o) => o.id !== id));
    }
  }

  function generateWhatsAppTrackingUrl(order) {
    const cleanPhone = (order.phone || '').replace(/[^0-9]/g, '');
    const message = `Namaste ${order.customerName}! 🌸\n\nYour order *${order.id}* from *Shreivara Handlooms & Fine Jewelry* has been dispatched! 📦✨\n\n📋 *Items:* ${order.items}\n🚚 *Courier:* ${order.courier || 'Express Courier'}\n🔖 *Tracking/AWB:* ${order.trackingNumber || 'Tracking assigned'}\n\nThank you for choosing Shreivara! Feel free to reach out if you have any questions.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  const filtered = orders.filter((o) => (filter === 'All' ? true : o.status === filter));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="font-brand text-2xl font-bold text-maroon-900">Dispatched Orders Management</h2>
          <p className="text-xs text-neutral-500">Track shipments, update courier partners, and notify customers on WhatsApp.</p>
        </div>
        <div className="flex items-center gap-2">
          {['All', 'Pending', 'Dispatched'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === tab ? 'bg-maroon-900 text-white shadow-xs' : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsAddingOrder((v) => !v)}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-full bg-gold-600 hover:bg-gold-700 text-maroon-950 font-bold px-3.5 py-1.5 text-xs uppercase tracking-wider shadow-xs transition"
          >
            <span>+</span>
            <span>{isAddingOrder ? 'Close' : 'Record Order'}</span>
          </button>
        </div>
      </div>

      {isAddingOrder && (
        <form onSubmit={handleCreateOrder} className="rounded-2xl border-2 border-gold-400 bg-gold-50/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-brand text-lg font-bold text-maroon-950">Record New WhatsApp / Store Order</h3>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Manual Entry</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
              Customer Name *
              <input
                required
                type="text"
                placeholder="e.g. Sravani Rao"
                value={newOrder.customerName}
                onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-maroon-900 focus:outline-none"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
              WhatsApp Phone (with Country Code) *
              <input
                required
                type="text"
                placeholder="+91 98490 12345"
                value={newOrder.phone}
                onChange={(e) => setNewOrder({ ...newOrder, phone: e.target.value })}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-maroon-900 focus:outline-none"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
              Order Total (INR) *
              <input
                required
                type="number"
                min="0"
                placeholder="8999"
                value={newOrder.total}
                onChange={(e) => setNewOrder({ ...newOrder, total: e.target.value })}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-maroon-900 focus:outline-none"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700 sm:col-span-2 md:col-span-3">
              Item Details (Name, SKU, Qty) *
              <input
                required
                type="text"
                placeholder="e.g. Royal Kanjivaram Silk (SHR-001) × 1"
                value={newOrder.items}
                onChange={(e) => setNewOrder({ ...newOrder, items: e.target.value })}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-maroon-900 focus:outline-none"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
              Initial Status
              <select
                value={newOrder.status}
                onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                className="cursor-pointer rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-maroon-900 focus:outline-none"
              >
                <option value="Pending">Pending Dispatch</option>
                <option value="Dispatched">Already Dispatched</option>
              </select>
            </label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
              Courier Partner
              <input
                type="text"
                placeholder="DTDC, Blue Dart, etc."
                value={newOrder.courier}
                onChange={(e) => setNewOrder({ ...newOrder, courier: e.target.value })}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-maroon-900 focus:outline-none"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
              Tracking / AWB Number
              <input
                type="text"
                placeholder="DTDC8829104"
                value={newOrder.trackingNumber}
                onChange={(e) => setNewOrder({ ...newOrder, trackingNumber: e.target.value })}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-maroon-900 focus:outline-none"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingOrder(false)}
              className="cursor-pointer rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-maroon-900 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-maroon-800"
            >
              Save Order Record
            </button>
          </div>
        </form>
      )}

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
                  <p className="text-[10px] text-neutral-500 font-mono">{order.phone}</p>
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
                        placeholder="Courier (e.g. DTDC, Blue Dart)"
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
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    {order.phone && (
                      <a
                        href={generateWhatsAppTrackingUrl(order)}
                        target="_blank"
                        rel="noreferrer"
                        className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[10px] font-bold text-white shadow-2xs transition"
                        title="Notify customer with dispatch details on WhatsApp"
                      >
                        <span>WhatsApp</span>
                        <span>↗</span>
                      </a>
                    )}
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
                      {editingId === order.id ? 'Editing' : 'Tracking'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteOrder(order.id)}
                      className="cursor-pointer rounded-lg border border-neutral-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700 px-1.5 py-1 text-[10px] text-neutral-500"
                      title="Delete order record"
                    >
                      ✕
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

export default function AdminPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('shreivara_admin_unlocked') === 'true';
  });
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Products state persisted directly in localStorage
  const [products, setProducts] = useState(() => {
    try {
      const stored = localStorage.getItem('shreivara-products');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) { }
    return DEFAULT_PRODUCTS;
  });

  const [activeTab, setActiveTab] = useState('catalogue');
  const [editingSku, setEditingSku] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    document.title = 'Admin Panel | Shreivara Handlooms';
  }, []);

  // When opened, prompt for the passcode (shreivara2026) if not already unlocked
  useEffect(() => {
    if (!isAuthenticated) {
      const promptTimer = setTimeout(() => {
        const entered = window.prompt('Enter passcode to access Shreivara Admin Panel (Passcode: shreivara2026):');
        if (entered !== null) {
          if (entered.trim() === 'shreivara2026') {
            sessionStorage.setItem('shreivara_admin_unlocked', 'true');
            setIsAuthenticated(true);
            setAuthError('');
          } else {
            setAuthError('Access Denied: Incorrect passcode. Please enter the valid admin passcode.');
          }
        }
      }, 100);
      return () => clearTimeout(promptTimer);
    }
  }, [isAuthenticated]);

  function handlePasscodeSubmit(e) {
    e.preventDefault();
    if (passcodeInput.trim() === 'shreivara2026') {
      sessionStorage.setItem('shreivara_admin_unlocked', 'true');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Access Denied: Incorrect passcode. Please try again.');
    }
  }

  function handleSignOut() {
    sessionStorage.removeItem('shreivara_admin_unlocked');
    setIsAuthenticated(false);
    setPasscodeInput('');
    setAuthError('');
  }

  function persistProducts(next) {
    setProducts(next);
    try {
      localStorage.setItem('shreivara-products', JSON.stringify(next));
      // Dispatch storage event so open storefront tabs update immediately
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Could not save products to localStorage.', error);
      throw new Error('Storage is full. Please remove unused images or products.');
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
      available: formData.get('available') !== null,
    };
    const next = [newProduct, ...products];
    persistProducts(next);
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
        available: formData.get('available') !== null,
        ...(imageUrl ? { image: imageUrl } : {}),
      };
    });
    persistProducts(next);
    return { product: next.find((p) => p.sku === sku) };
  }

  async function toggleAvailability(sku) {
    const next = products.map((p) => {
      if (p.sku !== sku) return p;
      return { ...p, available: p.available === false ? true : false };
    });
    persistProducts(next);
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}"? This will permanently remove it from the catalogue.`)) return;
    setDeleteError('');
    try {
      const next = products.filter((p) => p.sku !== product.sku);
      persistProducts(next);
      setEditingSku('');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'The product could not be deleted.');
    }
  }

  // 1. Unauthenticated Passcode Entry View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-gold-300/80 shadow-2xl p-8 sm:p-10 space-y-6 text-center">
          <div className="space-y-2">
            <span className="inline-block p-3.5 rounded-full bg-gold-50 border border-gold-300 text-maroon-900 text-2xl shadow-xs">
              🔐
            </span>
            <p className="font-brand text-3xl font-medium tracking-wide text-maroon-950 uppercase">Shreivara</p>
            <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-gold-600">Admin Panel Access</p>
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed font-light">
            Enter the authorized administrator passcode to manage inventory, edit prices, update stock levels, and track dispatched shipments.
          </p>

          {authError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-800" role="alert">
              {authError}
            </div>
          )}

          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div className="text-left">
              <label htmlFor="admin-passcode" className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Passcode
              </label>
              <input
                id="admin-passcode"
                type="password"
                required
                autoFocus
                placeholder="Enter passcode (shreivara2026)"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                className="w-full rounded-xl border border-gold-300/90 bg-cream/30 px-4 py-3 text-sm focus:border-maroon-900 focus:outline-none focus:bg-white text-maroon-950 transition"
              />
            </div>

            <button
              type="submit"
              className="cursor-pointer w-full rounded-xl bg-maroon-900 hover:bg-maroon-800 text-gold-100 font-bold uppercase tracking-wider text-xs py-3.5 shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
            >
              Unlock Admin Panel
            </button>
          </form>

          <div className="pt-2 border-t border-neutral-100">
            <a
              href={typeof window !== 'undefined' && window.location.hostname.toLowerCase().includes('admin') ? 'https://shreivara-handlooms.vercel.app' : '/'}
              className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-maroon-900 font-medium transition"
            >
              <span>←</span> Return to Customer Storefront
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authenticated Full Admin Dashboard View
  const totalStock = products.reduce((acc, p) => acc + (p.stock ?? 5), 0);
  const activeProducts = products.filter((p) => p.available !== false).length;
  const soldOutProducts = products.filter((p) => p.available === false).length;
  const storefrontUrl = typeof window !== 'undefined' && window.location.hostname.toLowerCase().includes('admin')
    ? 'https://shreivara-handlooms.vercel.app'
    : '/';

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col text-neutral-900">
      {/* Dedicated Admin Portal Header */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-gold-300/80 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <a href={storefrontUrl} className="cursor-pointer group flex items-baseline gap-2">
              <span className="font-brand text-2xl font-medium tracking-[0.2em] uppercase text-maroon-950 group-hover:text-maroon-800 transition">
                Shreivara
              </span>
            </a>
            <span className="rounded-md bg-maroon-900 text-gold-200 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href={storefrontUrl}
              target={storefrontUrl.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="cursor-pointer inline-flex items-center gap-1 rounded-full border border-gold-400 bg-white hover:bg-gold-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-maroon-900 shadow-2xs transition"
              title="Open Customer Storefront"
            >
              <span>Storefront</span>
              <span className="text-xs">↗</span>
            </a>
            <button
              type="button"
              onClick={handleSignOut}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-neutral-300 hover:border-red-400 hover:bg-red-50 hover:text-red-800 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700 shadow-2xs transition"
              title="Lock console and sign out"
            >
              <span>Lock Console</span>
              <span>🔒</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-gold-200/90 bg-white p-5 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Designs</p>
            <p className="mt-1 font-brand text-3xl font-bold text-maroon-950">{products.length}</p>
          </div>
          <div className="rounded-2xl border border-gold-200/90 bg-white p-5 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Active (In Stock)</p>
            <p className="mt-1 font-brand text-3xl font-bold text-emerald-800">{activeProducts}</p>
          </div>
          <div className="rounded-2xl border border-gold-200/90 bg-white p-5 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Sold Out</p>
            <p className="mt-1 font-brand text-3xl font-bold text-red-700">{soldOutProducts}</p>
          </div>
          <div className="rounded-2xl border border-gold-200/90 bg-white p-5 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gold-600">Total Inventory Units</p>
            <p className="mt-1 font-brand text-3xl font-bold text-maroon-950">{totalStock}</p>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gold-300 pb-4">
          <div>
            <h1 className="font-brand text-3xl font-bold text-maroon-950">Store Management Console</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Control live storefront inventory, pricing, availability toggles, and courier shipments.</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('catalogue')}
              className={`cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'catalogue'
                  ? 'bg-maroon-900 text-white shadow-xs'
                  : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Inventory Manager
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'orders'
                  ? 'bg-maroon-900 text-white shadow-xs'
                  : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Dispatched Orders
            </button>
          </div>
        </div>

        {/* Tab 1: Orders Dashboard */}
        {activeTab === 'orders' ? (
          <section className="rounded-2xl border border-gold-300/80 bg-white p-6 sm:p-8 shadow-sm">
            <DispatchedOrdersManager />
          </section>
        ) : (
          /* Tab 2: Inventory & Catalogue Manager */
          <div className="space-y-8">
            {/* Add New Product Section */}
            <section className="rounded-2xl border border-gold-300/80 bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-6 border-b border-neutral-100 pb-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Product Entry</p>
                <h2 className="mt-1 font-brand text-2xl font-bold text-maroon-950">Add New Saree or Jewelry Piece</h2>
              </div>
              <ProductForm submitLabel="Add Product to Storefront" onSave={addProduct} />
            </section>

            {/* Manage Catalogue & Stock Section */}
            <section className="rounded-2xl border border-gold-300/80 bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Inventory Control</p>
                  <h2 className="mt-1 font-brand text-2xl font-bold text-maroon-950">Live Storefront Catalogue ({products.length})</h2>
                </div>
              </div>

              {deleteError && (
                <p className="mb-4 text-sm font-medium text-red-800 bg-red-50 p-3 rounded-xl border border-red-200" role="alert">
                  {deleteError}
                </p>
              )}

              <div className="grid gap-4">
                {products.map((product) =>
                  editingSku === product.sku ? (
                    <div key={product.sku} className="rounded-2xl border-2 border-gold-400 p-6 bg-gold-50/30">
                      <h3 className="font-brand text-xl font-bold text-maroon-950 mb-4">Editing {product.name} ({product.sku})</h3>
                      <ProductForm
                        product={product}
                        submitLabel="Save Changes"
                        onSave={(formData) => {
                          updateProduct(product.sku, formData);
                          setEditingSku('');
                        }}
                        onCancel={() => setEditingSku('')}
                      />
                    </div>
                  ) : (
                    <article
                      key={product.sku}
                      className="grid gap-4 rounded-2xl border border-neutral-200 p-4 sm:grid-cols-[100px_1fr_auto] sm:items-center bg-white shadow-2xs hover:shadow-xs transition"
                    >
                      <div className="relative h-24 w-24">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full rounded-xl object-cover border border-neutral-200"
                        />
                        {product.available === false && (
                          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 text-[9px] font-bold text-white uppercase tracking-wider">
                            Sold Out
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-maroon-950 font-brand text-xl">{product.name}</p>
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[9.5px] font-bold ${
                              product.available !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.available !== false ? '● In Stock' : '○ Sold Out'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-neutral-500 font-mono">
                          {product.sku} · <span className="font-sans font-medium text-gold-700">{product.category}</span> · Stock: {product.stock ?? 5} units
                        </p>
                        <p className="mt-1.5 text-sm font-semibold text-neutral-800 font-brand">
                          {formatCurrency(product.sellingPrice)}{' '}
                          <span className="text-neutral-400 font-normal line-through text-xs font-sans">
                            / {formatCurrency(product.originalPrice)}
                          </span>
                        </p>
                        {product.offerDetails && (
                          <p className="mt-1 text-xs text-amber-800 font-medium">✦ {product.offerDetails}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch sm:min-w-[130px]">
                        <button
                          type="button"
                          onClick={() => toggleAvailability(product.sku)}
                          className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                            product.available !== false
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              : 'border-neutral-400 bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                        >
                          {product.available !== false ? 'Mark Sold Out' : 'Mark In Stock'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError('');
                            setEditingSku(product.sku);
                          }}
                          className="cursor-pointer rounded-xl border border-maroon-900 px-3 py-1.5 text-xs font-semibold text-maroon-900 hover:bg-maroon-900 hover:text-white transition text-center"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(product)}
                          className="cursor-pointer rounded-xl border border-red-700 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-700 hover:text-white transition text-center"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  )
                )}

                {products.length === 0 && (
                  <p className="py-12 text-center text-sm text-neutral-500">No products found in catalogue.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
