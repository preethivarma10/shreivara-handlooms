import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categories, WHATSAPP_NUMBER } from '../data/products.js';
import { DEFAULT_PRODUCTS } from '../components/SiteLayout.jsx';
import {
  insertProductToSupabase,
  updateProductInSupabase,
  deleteProductFromSupabase,
  toggleProductAvailabilityInSupabase,
  fetchProductsFromSupabase,
  uploadImageToStorage,
  cleanSupabaseUrl,
  isSupabaseConfigured,
  hasManualSupabaseOverride,
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from '../lib/supabase.js';

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

export async function readAndCompressImage(file, maxWidth = 900, maxHeight = 1200, quality = 0.75) {
  if (!file || !(file instanceof File)) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read the image file.'));
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (typeof dataUrl !== 'string') {
        resolve(null);
        return;
      }
      // If SVG or very small file (< 35 KB), use directly
      if (file.type === 'image/svg+xml' || file.size < 35 * 1024) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (_) {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

const IMAGE_SLOTS = [
  { id: 0, title: 'Slot 1: Main Image', subtitle: 'Primary card & catalog view', required: true },
  { id: 1, title: 'Slot 2: Detail / Weave', subtitle: 'Close-up fabric & zari weave', required: false },
  { id: 2, title: 'Slot 3: Pallu / Back', subtitle: 'Grand border & pallu details', required: false },
  { id: 3, title: 'Slot 4: Draped / Full View', subtitle: 'Model drape or full expanse', required: false },
];

function ProductForm({ product, onSave, onCancel, submitLabel, availableCategories = categories }) {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Multi-image state (up to 4 slots) ──────────────────────────────────
  const parseExistingImages = () => {
    const raw = product?.imagesList ?? product?.images ?? product?.image_url ?? product?.image ?? '';
    if (Array.isArray(raw)) return [...raw.slice(0, 4), '', '', '', ''].slice(0, 4).map(String);
    if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return [...parsed.slice(0, 4), '', '', '', ''].slice(0, 4).map(String);
      } catch {}
      return [raw.trim(), '', '', ''];
    }
    return ['', '', '', ''];
  };

  const [imageUrls, setImageUrls] = useState(parseExistingImages);
  const [slotModes, setSlotModes] = useState(['upload', 'upload', 'upload', 'upload']);
  const [uploadingSlots, setUploadingSlots] = useState({});
  const [slotNotes, setSlotNotes] = useState({});

  // Controlled form fields for real-time button validation
  const [name, setName] = useState(product?.name ?? '');
  const [sellingPrice, setSellingPrice] = useState(product?.sellingPrice ?? '');

  useEffect(() => {
    setName(product?.name ?? '');
    setSellingPrice(product?.sellingPrice ?? '');
    setImageUrls(parseExistingImages());
  }, [product]);

  function setImageUrl(idx, val) {
    setImageUrls((prev) => prev.map((v, i) => (i === idx ? val : v)));
  }

  function setSlotMode(idx, mode) {
    setSlotModes((prev) => prev.map((m, i) => (i === idx ? mode : m)));
  }

  function clearSlot(idx) {
    setImageUrls((prev) => prev.map((v, i) => (i === idx ? '' : v)));
    setSlotNotes((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  }

  async function handleSlotFile(idx, e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploadingSlots((prev) => ({ ...prev, [idx]: true }));
    setSlotNotes((prev) => ({ ...prev, [idx]: 'Compressing & uploading photo…' }));

    try {
      const result = await uploadImageToStorage(file, 'products');
      if (result?.url) {
        setImageUrls((prev) => prev.map((v, i) => (i === idx ? result.url : v)));
        const note = result.publicUrl
          ? '✓ Uploaded to Supabase Cloud'
          : (result.warning || '✓ Compressed & ready');
        setSlotNotes((prev) => ({ ...prev, [idx]: note }));
      } else {
        setSlotNotes((prev) => ({ ...prev, [idx]: 'Upload failed' }));
        setError(result?.error || 'Could not upload image. Please try again or paste an image link.');
      }
    } catch (err) {
      setSlotNotes((prev) => ({ ...prev, [idx]: 'Upload failed' }));
      setError('Could not process photo upload. Please try again.');
    } finally {
      setUploadingSlots((prev) => ({ ...prev, [idx]: false }));
      e.target.value = '';
    }
  }

  // Manual category support
  const isCustomExisting = Boolean(product?.category && !categories.includes(product.category));
  const [isManualCategory, setIsManualCategory] = useState(isCustomExisting);
  const [selectedCategory, setSelectedCategory] = useState(
    product?.category && availableCategories.includes(product.category)
      ? product.category
      : availableCategories[0] || 'Kanchi Pattu'
  );
  const [manualCategoryValue, setManualCategoryValue] = useState(isCustomExisting ? product.category : '');

  async function submitProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setNotice('');

    const isUploadingAny = Object.values(uploadingSlots).some(Boolean);
    if (isUploadingAny) {
      setError('Please wait for photo upload to cloud storage to complete before saving.');
      return;
    }

    const cleanImages = imageUrls.map(String).map((s) => s.trim()).filter(Boolean);
    if (cleanImages.length === 0) {
      setError('Please add at least one product image (upload a photo or paste a URL) before publishing.');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData(form);
      // Inject current clean images into FormData
      fd.set('images', JSON.stringify(cleanImages));
      fd.set('imageUrls', JSON.stringify(cleanImages));
      fd.set('image', cleanImages[0] || '');
      fd.set('compressedImage', cleanImages[0] || '');

      const result = await onSave(fd);
      if (!product) {
        form.reset();
        setName('');
        setSellingPrice('');
        setImageUrls(['', '', '', '']);
        setSlotNotes({});
        setIsManualCategory(false);
        setManualCategoryValue('');
      }
      setNotice(result?.warning || (product ? 'Product updated successfully.' : 'Product published to storefront successfully!'));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The product could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  const isUploadingAny = Object.values(uploadingSlots).some(Boolean);
  const cleanImages = imageUrls.map(String).map((s) => s.trim()).filter(Boolean);
  const hasImages = cleanImages.length > 0;
  const isFormReady = Boolean(name.trim()) && Boolean(sellingPrice && Number(sellingPrice) > 0) && hasImages;

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
        <input
          name="name"
          required
          maxLength="120"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Royal Gold Temple Saree"
          className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none"
        />
      </label>

      <div className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">
        <div className="flex items-center justify-between">
          <span>Category *</span>
          <button
            type="button"
            onClick={() => {
              setIsManualCategory((prev) => !prev);
              if (!isManualCategory && !manualCategoryValue) {
                setManualCategoryValue('');
              }
            }}
            className="cursor-pointer text-[10.5px] font-bold text-maroon-900 hover:text-gold-700 underline tracking-normal normal-case transition"
          >
            {isManualCategory ? '← Choose from list' : '+ Enter manually'}
          </button>
        </div>

        {isManualCategory ? (
          <div>
            <input
              name="category"
              required
              type="text"
              placeholder="e.g. Banarasi Silk, Linen, Bridal Jewelry"
              value={manualCategoryValue}
              onChange={(e) => setManualCategoryValue(e.target.value)}
              className="w-full rounded-xl border-2 border-gold-400 bg-gold-50/40 px-3 py-2.5 text-sm font-normal text-maroon-950 focus:border-maroon-900 focus:outline-none placeholder:text-neutral-400"
              autoFocus
            />
            <span className="text-[10px] text-neutral-500 font-normal normal-case tracking-normal mt-1 block">
              Type custom category name (will appear in storefront filters)
            </span>
          </div>
        ) : (
          <select
            name="category"
            required
            value={selectedCategory}
            onChange={(e) => {
              if (e.target.value === '__MANUAL__') {
                setIsManualCategory(true);
              } else {
                setSelectedCategory(e.target.value);
              }
            }}
            className="cursor-pointer rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none"
          >
            {availableCategories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
            <option value="__MANUAL__">+ Enter New Category Manually...</option>
          </select>
        )}
      </div>

      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">
        Original price (INR)
        <input name="originalPrice" type="number" min="1" step="1" required defaultValue={product?.originalPrice ?? ''} placeholder="8999" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none" />
      </label>

      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">
        Offer / Selling price (INR)
        <input
          name="sellingPrice"
          type="number"
          min="1"
          step="1"
          required
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
          placeholder="6999"
          className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-maroon-900 focus:outline-none"
        />
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

      {/* ── 4-Slot Multi-Image Manager (Upload or URL per slot) ─────────── */}
      <div className="md:col-span-2 xl:col-span-3 space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gold-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">Product Images (Up to 4 Slots)</span>
            <p className="text-[11px] text-neutral-500 font-normal">Each slot supports direct device photo upload (with client auto-compression) OR pasting an external image URL.</p>
          </div>
          <span className="text-[10px] font-semibold text-maroon-900 bg-gold-100/70 border border-gold-300 px-2.5 py-1 rounded-full">
            Slot 1 is required (Main catalog view)
          </span>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          {IMAGE_SLOTS.map((slot, idx) => {
            const hasImage = Boolean(imageUrls[idx]);
            const isUploading = Boolean(uploadingSlots[idx]);
            const note = slotNotes[idx];
            const currentMode = slotModes[idx];

            return (
              <div
                key={slot.id}
                className={`rounded-2xl border transition p-3.5 space-y-2.5 ${
                  hasImage
                    ? 'border-gold-300/80 bg-white shadow-xs'
                    : 'border-[#ded5c6] bg-[#fbf9f4]/60 hover:border-gold-400'
                }`}
              >
                {/* Slot Header: Title & Toggle */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-maroon-900 flex items-center gap-1">
                      {slot.title}
                      {slot.required && <span className="text-red-500 font-bold">*</span>}
                    </span>
                    <p className="text-[10px] text-neutral-500">{slot.subtitle}</p>
                  </div>

                  {/* Mode Toggle Pills (Upload vs URL) */}
                  <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-[10px] shrink-0">
                    <button
                      type="button"
                      onClick={() => setSlotMode(idx, 'upload')}
                      className={`cursor-pointer rounded-md px-2 py-0.5 font-medium transition ${
                        currentMode === 'upload'
                          ? 'bg-maroon-900 text-white shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      📷 Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlotMode(idx, 'url')}
                      className={`cursor-pointer rounded-md px-2 py-0.5 font-medium transition ${
                        currentMode === 'url'
                          ? 'bg-maroon-900 text-white shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      🔗 URL
                    </button>
                  </div>
                </div>

                {/* Slot Body: Image Preview OR Input Area */}
                {hasImage ? (
                  <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-[#fdfbf7] p-2.5">
                    {/* Square Thumbnail */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gold-300 bg-neutral-100">
                      <img
                        src={imageUrls[idx]}
                        alt={`${slot.title} preview`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect fill="%23f1e9d9"/></svg>';
                        }}
                      />
                    </div>

                    {/* Metadata & Status */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {imageUrls[idx].includes('supabase.co') ? (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-800">
                            ☁️ Cloud Storage
                          </span>
                        ) : imageUrls[idx].startsWith('data:image') ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-900">
                            📱 Compressed Photo
                          </span>
                        ) : (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-900">
                            🔗 Web Link
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400">Ready</span>
                      </div>
                      <p className="truncate text-[10.5px] text-neutral-600 font-mono" title={imageUrls[idx]}>
                        {imageUrls[idx]}
                      </p>
                      {note && <p className="text-[10px] font-medium text-emerald-700">{note}</p>}
                    </div>

                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={() => clearSlot(idx)}
                      className="cursor-pointer shrink-0 rounded-lg border border-red-200 bg-red-50 p-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 hover:text-red-900 transition"
                      title="Remove image from this slot"
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ) : isUploading ? (
                  <div className="flex min-h-[84px] flex-col items-center justify-center rounded-xl border border-dashed border-gold-400 bg-gold-50/50 p-4 text-center">
                    <svg className="h-5 w-5 animate-spin text-maroon-900" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <p className="mt-1.5 text-xs font-semibold text-maroon-900">Compressing &amp; Uploading…</p>
                    <p className="text-[9.5px] text-neutral-500">Auto-optimizing for high-speed mobile loading</p>
                  </div>
                ) : currentMode === 'upload' ? (
                  <div>
                    <label className="flex min-h-[84px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d9d0c1] bg-white p-3 text-center transition hover:border-maroon-900 hover:bg-[#faf6ee]">
                      <svg className="h-6 w-6 text-maroon-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="mt-1 text-xs font-semibold text-maroon-900">
                        Choose photo from phone / computer
                      </span>
                      <span className="text-[9.5px] text-neutral-500">
                        Auto-compressed client-side for fast mobile viewing
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/*"
                        className="hidden"
                        onChange={(e) => handleSlotFile(idx, e)}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="url"
                      placeholder={`https://... (${slot.title.toLowerCase()} URL)`}
                      value={imageUrls[idx]}
                      onChange={(e) => setImageUrl(idx, e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-normal focus:border-maroon-900 focus:outline-none placeholder:text-neutral-400"
                    />
                    <p className="text-[9.5px] text-neutral-400">Paste any direct image URL (Unsplash, CDN, etc.)</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Hidden inputs for legacy handler compatibility */}
        <input type="hidden" name="image" value={imageUrls.find(Boolean) || ''} />
        <input type="hidden" name="compressedImage" value={imageUrls.find(Boolean) || ''} />
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

      {/* ── Submit / Action Bar ──────────────────────────────────── */}
      <div className="md:col-span-2 xl:col-span-3 pt-4 border-t border-gold-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs text-neutral-600">
          {isUploadingAny ? (
            <span className="flex items-center gap-1.5 font-semibold text-amber-800">
              <svg className="h-4 w-4 animate-spin text-amber-800" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Photo uploading in progress… Please wait before saving.
            </span>
          ) : !hasImages ? (
            <span className="text-amber-800 font-medium flex items-center gap-1">
              ⚠️ Add at least 1 image (Upload photo or paste URL) to enable publish
            </span>
          ) : !name.trim() ? (
            <span className="text-neutral-500 font-medium">
              Enter Product Name to enable publish
            </span>
          ) : !sellingPrice ? (
            <span className="text-neutral-500 font-medium">
              Enter Selling Price to enable publish
            </span>
          ) : (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              ✓ Ready: {cleanImages.length} {cleanImages.length === 1 ? 'image' : 'images'} attached
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 justify-end w-full sm:w-auto">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-xl border border-neutral-300 px-5 py-3 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 transition"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving || isUploadingAny || !isFormReady}
            className={`w-full sm:w-auto rounded-xl px-8 py-3.5 text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 ${
              isFormReady && !saving && !isUploadingAny
                ? 'bg-maroon-900 hover:bg-maroon-800 text-white cursor-pointer active:scale-[0.98]'
                : 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed opacity-80'
            }`}
          >
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Publishing to Storefront…</span>
              </>
            ) : isUploadingAny ? (
              <span>Uploading Photos…</span>
            ) : (
              <span>{submitLabel}</span>
            )}
          </button>
        </div>
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
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${filter === tab ? 'bg-maroon-900 text-white shadow-xs' : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
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
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${order.status === 'Dispatched'
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

  // Dynamically derive all available categories (default + custom ones added to products)
  const availableCategories = useMemo(() => {
    return Array.from(
      new Set([
        ...categories,
        ...products.map((p) => (p.category || '').trim()).filter(Boolean)
      ])
    );
  }, [products]);
  const [showDbModal, setShowDbModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(SUPABASE_URL || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(SUPABASE_ANON_KEY || '');
  const [dbModalNotice, setDbModalNotice] = useState('');

  useEffect(() => {
    document.title = 'Admin Panel | Shreivara Handlooms';
  }, []);

  // Fetch from backend API /api/products and Supabase on mount
  useEffect(() => {
    async function loadAdminCatalog() {
      // 1. Fetch from backend API
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const apiData = await res.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            setProducts(apiData);
            try {
              localStorage.setItem('shreivara-products', JSON.stringify(apiData));
            } catch (_) { }
          }
        }
      } catch (err) {
        console.warn('Could not fetch from /api/products in Admin:', err);
      }

      // 2. Fetch from Supabase Cloud if configured
      if (isSupabaseConfigured) {
        try {
          const remote = await fetchProductsFromSupabase();
          if (Array.isArray(remote) && remote.length > 0) {
            setProducts(remote);
            try {
              localStorage.setItem('shreivara-products', JSON.stringify(remote));
            } catch (_) { }
          }
        } catch (err) {
          console.warn('Error loading from Supabase in Admin:', err);
        }
      }
    }
    loadAdminCatalog();
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
      const json = JSON.stringify(next);
      localStorage.setItem('shreivara-products', json);
    } catch (error) {
      console.warn('Direct save to localStorage failed, cleaning heavy entries...', error);
      try {
        // Strip out any oversized legacy base64 images that might be filling the quota
        const trimmed = next.map((p) => {
          if (typeof p.image === 'string' && p.image.length > 250000) {
            return { ...p, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80' };
          }
          return p;
        });
        localStorage.setItem('shreivara-products', JSON.stringify(trimmed));
      } catch (innerError) {
        console.error('Could not save products to localStorage.', innerError);
        throw new Error('Browser storage quota exceeded. Please remove some products or use Image URLs.');
      }
    }

    // 1. BroadcastChannel: instant, guaranteed sync across all tabs & windows on this domain
    try {
      const bc = new BroadcastChannel('shreivara_products_channel');
      bc.postMessage({ type: 'PRODUCTS_UPDATED', products: next });
      bc.close();
    } catch (_) { }

    // 2. StorageEvent for cross-tab listeners
    try {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'shreivara-products',
        newValue: JSON.stringify(next),
        storageArea: window.localStorage,
      }));
    } catch (_) { }

    // 3. CustomEvent for same-window listeners
    try {
      window.dispatchEvent(new CustomEvent('shreivara-products-updated', { detail: next }));
    } catch (_) { }
  }

  async function resolveProductImages(formData) {
    // 1. Multi-image URLs from new form (JSON array in 'images' or 'imageUrls')
    const rawJson = (formData.get('images') || formData.get('imageUrls') || '').toString().trim();
    if (rawJson) {
      try {
        const arr = JSON.parse(rawJson);
        if (Array.isArray(arr)) {
          const clean = arr.map(String).map((s) => s.trim()).filter(Boolean);
          if (clean.length > 0) {
            return { imagesList: clean, image: clean[0] };
          }
        }
      } catch {}
    }

    // 2. Legacy: single URL input
    const urlInput = (formData.get('imageUrl') || formData.get('image') || '').toString().trim();
    if (urlInput) return { imagesList: [urlInput], image: urlInput };

    // 3. Legacy: pre-compressed image dataUrl
    const compressed = (formData.get('compressedImage') || '').toString().trim();
    if (compressed) return { imagesList: [compressed], image: compressed };

    return null;
  }

  async function addProduct(formData) {
    const sku = (formData.get('sku') || '').toString().trim();
    if (!sku) throw new Error('SKU is required.');
    if (products.some((p) => p.sku === sku)) throw new Error(`A product with SKU "${sku}" already exists.`);

    const resolved = await resolveProductImages(formData);
    const cleanImages = (resolved?.imagesList || []).filter(Boolean);
    if (cleanImages.length === 0) throw new Error('Please add at least one product image before saving.');
    const imageUrl = cleanImages[0] || '';

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
      imagesList: cleanImages,
      images: cleanImages,
      available: formData.get('available') !== null,
    };

    // 1. Post to backend /api/products API (if running in full-stack mode)
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
    } catch (_) {}

    // 2. Sync to Supabase Cloud Database if configured
    let supabaseNotice = '';
    if (isSupabaseConfigured) {
      const { error: sbError } = await insertProductToSupabase(newProduct);
      if (sbError) {
        console.warn('Supabase insert notice:', sbError.message);
        supabaseNotice = ` (Supabase notice: ${sbError.message})`;
      } else {
        supabaseNotice = ' (Synced to Supabase Cloud!)';
      }
    }

    const next = [newProduct, ...products];
    persistProducts(next);

    return {
      product: newProduct,
      warning: `Product "${newProduct.name}" (SKU: ${sku}) published successfully!${supabaseNotice}`,
    };
  }

  async function updateProduct(sku, formData) {
    const resolved = await resolveProductImages(formData);
    const cleanImages = resolved?.imagesList ? resolved.imagesList.filter(Boolean) : null;

    let updatedProduct = null;
    const next = products.map((p) => {
      if (p.sku !== sku) return p;
      const imagesList = cleanImages && cleanImages.length > 0
        ? cleanImages
        : (Array.isArray(p.images) && p.images.length > 0 ? p.images.filter(Boolean) : [p.image].filter(Boolean));
      const image = imagesList[0] || p.image || '';

      updatedProduct = {
        ...p,
        name: (formData.get('name') || '').toString().trim() || p.name,
        category: (formData.get('category') || '').toString().trim() || p.category,
        originalPrice: Number(formData.get('originalPrice')) || p.originalPrice,
        sellingPrice: Number(formData.get('sellingPrice')) || p.sellingPrice,
        stock: Number(formData.get('stock')) || p.stock || 5,
        sizes: (formData.get('sizes') || '').toString().trim(),
        offerDetails: (formData.get('offerDetails') || '').toString().trim(),
        available: formData.get('available') !== null,
        image,
        images: imagesList,
        imagesList,
      };
      return updatedProduct;
    });

    persistProducts(next);

    let supabaseNotice = '';
    if (updatedProduct) {
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct),
        });
      } catch (_) {}

      if (isSupabaseConfigured) {
        const { error: sbError } = await updateProductInSupabase(sku, updatedProduct);
        if (sbError) {
          console.warn('Supabase update notice:', sbError.message);
          supabaseNotice = ` (Supabase notice: ${sbError.message})`;
        } else {
          supabaseNotice = ' (Synced to Supabase Cloud!)';
        }
      }
    }

    return {
      product: updatedProduct,
      warning: `Changes for "${updatedProduct?.name || sku}" saved successfully!${supabaseNotice}`,
    };
  }

  async function toggleAvailability(sku) {
    const next = products.map((p) => {
      if (p.sku !== sku) return p;
      const nextAvail = p.available === false ? true : false;
      return { ...p, available: nextAvail };
    });
    persistProducts(next);

    const updated = next.find((p) => p.sku === sku);
    if (updated) {
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
      } catch (_) { }

      if (isSupabaseConfigured) {
        toggleProductAvailabilityInSupabase(sku, updated.available).catch((err) => console.warn('Supabase toggle error:', err));
      }
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}"? This will permanently remove it from the catalogue.`)) return;
    setDeleteError('');
    try {
      // 1. Call backend API to delete
      try {
        await fetch(`/api/products?sku=${encodeURIComponent(product.sku)}`, {
          method: 'DELETE',
        });
      } catch (_) { }

      // 2. Call Supabase to delete if configured
      if (isSupabaseConfigured) {
        await deleteProductFromSupabase(product.sku);
      }
      const next = products.filter((p) => p.sku !== product.sku);
      persistProducts(next);
      setEditingSku('');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'The product could not be deleted.');
    }
  }

  function handleSaveSupabaseCredentials(e) {
    e.preventDefault();
    try {
      const cleanedUrl = cleanSupabaseUrl(supabaseUrlInput);
      if (cleanedUrl) {
        localStorage.setItem('shreivara_supabase_url', cleanedUrl);
      } else {
        localStorage.removeItem('shreivara_supabase_url');
      }
      const cleanedKey = supabaseKeyInput.trim();
      if (cleanedKey) {
        localStorage.setItem('shreivara_supabase_anon_key', cleanedKey);
      } else {
        localStorage.removeItem('shreivara_supabase_anon_key');
      }
      setDbModalNotice('Credentials saved! Reloading to connect with Supabase…');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      setDbModalNotice('Error saving credentials to browser storage.');
    }
  }

  function handleResetSupabaseCredentials() {
    try {
      localStorage.removeItem('shreivara_supabase_url');
      localStorage.removeItem('shreivara_supabase_anon_key');
      setDbModalNotice('Cleared custom browser override. Reverting to default environment credentials…');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      setDbModalNotice('Error resetting credentials.');
    }
  }

  // 1. Unauthenticated Passcode Entry View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-gold-300/80 shadow-2xl p-8 sm:p-10 space-y-6 text-center">
          <div className="space-y-2 flex flex-col items-center">
            <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-gold-400/90 shadow-md bg-[#0A1612]">
              <img
                src="/shreivara-logo.jpg"
                alt="Shreivara Handlooms Official Profile"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="font-brand text-3xl font-medium tracking-wide text-maroon-950 uppercase mt-1">Shreivara</p>
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
            <a href={storefrontUrl} className="cursor-pointer group flex items-center gap-2.5">
              <div className="relative h-8 w-8 rounded-full overflow-hidden border border-gold-400/90 bg-[#0A1612] shadow-2xs">
                <img
                  src="/shreivara-logo.jpg"
                  alt="Shreivara Official Profile Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="font-brand text-2xl font-medium tracking-[0.2em] uppercase text-maroon-950 group-hover:text-maroon-800 transition">
                Shreivara
              </span>
            </a>
            <span className="rounded-md bg-maroon-900 text-gold-200 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowDbModal(true)}
              className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition border ${isSupabaseConfigured
                  ? 'border-emerald-500/80 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 shadow-2xs'
                  : 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 shadow-2xs'
                }`}
              title="Configure Supabase Cloud Database"
            >
              <span className={`h-2 w-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="hidden sm:inline">{isSupabaseConfigured ? 'Supabase Connected' : 'Connect Supabase'}</span>
              <span className="sm:hidden">{isSupabaseConfigured ? 'Cloud' : 'DB'}</span>
            </button>

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
              <span>Lock</span>
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
              className={`cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${activeTab === 'catalogue'
                  ? 'bg-maroon-900 text-white shadow-xs'
                  : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
            >
              Inventory Manager
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${activeTab === 'orders'
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
              <ProductForm
                submitLabel="Add Product to Storefront"
                onSave={addProduct}
                availableCategories={availableCategories}
              />
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
                        availableCategories={availableCategories}
                        onSave={async (formData) => {
                          const result = await updateProduct(product.sku, formData);
                          setEditingSku('');
                          return result;
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
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[9.5px] font-bold ${product.available !== false
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
                          className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${product.available !== false
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

      {/* Supabase Cloud Database Configuration Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-gold-300 p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold-600">Database Connection</span>
                <h3 className="font-brand text-2xl font-bold text-maroon-950">Supabase Cloud Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDbModal(false)}
                className="cursor-pointer rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <div className={`p-3.5 rounded-2xl border text-xs font-medium ${isSupabaseConfigured
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
              {isSupabaseConfigured
                ? hasManualSupabaseOverride
                  ? '✓ Connected to Supabase Cloud via custom browser override in this device. Products sync directly to your database.'
                  : '✓ Connected to Supabase Cloud out of the box via default environment variables (import.meta.env).'
                : '○ Supabase is not yet configured. The store is running on local fallback. Enter your credentials below or configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your hosting environment.'}
            </div>

            {dbModalNotice && (
              <p className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs font-semibold text-blue-800">
                {dbModalNotice}
              </p>
            )}

            <form onSubmit={handleSaveSupabaseCredentials} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://galouvizafkfuhjhfhsb.supabase.co"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  onBlur={() => setSupabaseUrlInput((prev) => cleanSupabaseUrl(prev))}
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-mono focus:border-maroon-900 focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-neutral-500">
                  Trailing slashes and /rest/v1 are automatically stripped. Default: {SUPABASE_URL || 'https://galouvizafkfuhjhfhsb.supabase.co'}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Supabase Anon Public API Key
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs font-mono focus:border-maroon-900 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                {hasManualSupabaseOverride && (
                  <button
                    type="button"
                    onClick={handleResetSupabaseCredentials}
                    className="cursor-pointer text-xs text-red-700 hover:text-red-900 underline font-medium"
                  >
                    Clear Override (Use Env Defaults)
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowDbModal(false)}
                    className="cursor-pointer rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer rounded-xl bg-maroon-900 hover:bg-maroon-800 text-white font-bold uppercase tracking-wider text-xs px-5 py-2 shadow-xs"
                  >
                    Save &amp; Connect
                  </button>
                </div>
              </div>
            </form>

            {/* SQL Table Helper */}
            <div className="border-t border-neutral-100 pt-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                Need to create the products table?
              </p>
              <p className="text-xs text-neutral-500">
                In your Supabase project dashboard, go to the <strong>SQL Editor</strong> and run:
              </p>
              <pre className="p-3 bg-neutral-900 text-emerald-400 rounded-xl text-[10.5px] font-mono overflow-x-auto leading-relaxed">
                {`create table if not exists products (
  sku text primary key,
  name text not null,
  category text not null,
  original_price numeric not null,
  selling_price numeric not null,
  stock integer default 5,
  sizes text default '',
  offer_details text default '',
  image text not null,
  available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
