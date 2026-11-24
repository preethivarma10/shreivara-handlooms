import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categories, WHATSAPP_NUMBER } from '../data/products.js';
import { DEFAULT_PRODUCTS } from '../components/SiteLayout.jsx';
import shreivaraLogo from '../assets/shreivara-logo.jpg';
import {
  insertProductToSupabase,
  updateProductInSupabase,
  deleteProductFromSupabase,
  toggleProductAvailabilityInSupabase,
  fetchProductsFromSupabase,
  uploadImageToStorage,
  isSupabaseConfigured
} from '../lib/supabase.js';

function formatCurrency(value) {
  const num = typeof value === 'number' ? value : parseOrderTotal(value);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
}

function parseOrderTotal(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
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
    trackingUrl: 'https://track.dtdc.com/ctbs-tracking/customerInterface.tr?submitName=showTrackingDetail&strCnno=DTDC8829104',
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
    trackingUrl: 'https://www.bluedart.com/tracking',
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
    trackingUrl: '',
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
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');

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

  function clearAllSlots() {
    setImageUrls(['', '', '', '']);
    setSlotNotes({});
  }

  async function handleBatchFiles(e) {
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;

    setError('');
    const filesToProcess = fileList.slice(0, 4);
    setBatchUploading(true);
    setBatchProgress(`Compressing & preparing ${filesToProcess.length} photos…`);

    try {
      const newUrls = [...imageUrls];
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        setBatchProgress(`Uploading photo ${i + 1} of ${filesToProcess.length}…`);
        setUploadingSlots((prev) => ({ ...prev, [i]: true }));
        setSlotNotes((prev) => ({ ...prev, [i]: 'Compressing & uploading…' }));

        try {
          const result = await uploadImageToStorage(file, 'products');
          if (result?.url) {
            newUrls[i] = result.url;
            const note = result.publicUrl
              ? '✓ Photo uploaded'
              : (result.warning || '✓ Compressed & ready');
            setSlotNotes((prev) => ({ ...prev, [i]: note }));
          }
        } catch (err) {
          console.error('Batch upload error for slot', i, err);
        } finally {
          setUploadingSlots((prev) => ({ ...prev, [i]: false }));
        }
      }
      setImageUrls(newUrls);
      setBatchProgress(`✓ Successfully loaded ${filesToProcess.length} photos into slots!`);
      setTimeout(() => setBatchProgress(''), 3500);
    } catch (err) {
      setError('Could not complete multi-photo upload. Please try individual slots.');
    } finally {
      setBatchUploading(false);
      e.target.value = '';
    }
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
          ? '✓ Photo uploaded'
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

    const isUploadingAny = Object.values(uploadingSlots).some(Boolean) || batchUploading;
    if (isUploadingAny) {
      setError('Please wait for photo upload to complete before saving.');
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

  const isUploadingAny = Object.values(uploadingSlots).some(Boolean) || batchUploading;
  const cleanImages = imageUrls.map(String).map((s) => s.trim()).filter(Boolean);
  const hasImages = cleanImages.length > 0;
  const isFormReady = Boolean(name.trim()) && Boolean(sellingPrice && Number(sellingPrice) > 0) && hasImages;

  return (
    <form onSubmit={submitProduct} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {error && <p className="text-sm font-medium text-red-800 md:col-span-2 xl:col-span-3 bg-red-50 p-3 rounded-xl border border-red-200" role="alert">{error}</p>}
      {notice && <p className="text-xs font-semibold text-[#183a24] md:col-span-2 xl:col-span-3 bg-[#eef7f0] p-3.5 rounded-xl border border-[#a9d1b0]" role="status">{notice}</p>}

      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">
        SKU
        <input name="sku" required maxLength="64" readOnly={Boolean(product)} defaultValue={product?.sku ?? ''} placeholder="SHR-101" className="rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-sm font-normal focus:border-[#285338] focus:outline-none read-only:text-neutral-500" />
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
          className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-[#285338] focus:outline-none"
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
            className="cursor-pointer text-[10.5px] font-bold text-[#285338] hover:text-[#183a24] underline tracking-normal normal-case transition"
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
              className="w-full rounded-xl border-2 border-[#8db597] bg-[#f4f9f5] px-3 py-2.5 text-sm font-normal text-[#142e1d] focus:border-[#285338] focus:outline-none placeholder:text-neutral-400"
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
            className="cursor-pointer rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-[#285338] focus:outline-none"
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
        <input name="originalPrice" type="number" min="1" step="1" required defaultValue={product?.originalPrice ?? ''} placeholder="8999" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-[#285338] focus:outline-none" />
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
          className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-[#285338] focus:outline-none"
        />
      </label>

      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">
        Stock quantity
        <input name="stock" type="number" min="0" step="1" required defaultValue={product?.stock ?? 5} placeholder="5" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-[#285338] focus:outline-none" />
      </label>

      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700">
        Sizes (comma-separated)
        <input name="sizes" maxLength="120" defaultValue={product?.sizes ?? ''} placeholder="Free size or S, M, L" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-[#285338] focus:outline-none" />
      </label>

      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700 md:col-span-2">
        Offer details
        <textarea name="offerDetails" rows="2" maxLength="300" defaultValue={product?.offerDetails ?? ''} placeholder="Optional promotional callout (e.g., Grand Launch Offer)" className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal focus:border-[#285338] focus:outline-none" />
      </label>

      {/* ── 4-Slot Multi-Image Manager (Upload or URL per slot) ─────────── */}
      <div className="md:col-span-2 xl:col-span-3 space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#c4dcce]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">Product Images (Up to 4 Slots)</span>
            <p className="text-[11px] text-neutral-500 font-normal">Each slot supports direct device photo upload (with client auto-compression) OR pasting an external image URL.</p>
          </div>
          <span className="text-[10px] font-semibold text-[#183a24] bg-[#e2f0e6] border border-[#8db597] px-2.5 py-1 rounded-full">
            Slot 1 is required (Main catalog view)
          </span>
        </div>

        {/* ── Bulk Multi-Photo Quick Select (1 to 4 photos in one tap) ── */}
        <div className="rounded-2xl border-2 border-dashed border-[#8db597] bg-[#f2f8f3] p-4 transition hover:bg-[#e8f3ea]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#142e1d] flex items-center gap-1.5">
                <span className="text-base">📸</span> Select Multiple Photos at Once (Up to 4)
              </span>
              <p className="text-[11.5px] text-neutral-600">
                Choose up to 4 photos from your phone gallery or computer in a single tap — they will auto-fill Slots 1 to 4!
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {cleanImages.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllSlots}
                  className="cursor-pointer rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition"
                  title="Clear all photo slots"
                >
                  Clear All ({cleanImages.length})
                </button>
              )}

              <label className={`cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-[#285338] px-4 py-2.5 text-xs font-semibold text-[#FAF7EE] shadow-xs hover:bg-[#1e402b] transition ${batchUploading ? 'opacity-70 pointer-events-none' : ''}`}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{batchUploading ? 'Processing Photos…' : 'Select Up to 4 Photos'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleBatchFiles}
                  disabled={batchUploading}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {batchProgress && (
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#183a24] bg-white/90 p-2.5 rounded-xl border border-[#8db597] shadow-2xs">
              {batchUploading && <span className="inline-block animate-spin">⏳</span>}
              <span>{batchProgress}</span>
            </div>
          )}
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
                    ? 'border-[#8db597] bg-white shadow-xs'
                    : 'border-[#c4dcce] bg-[#fbf9f4]/60 hover:border-[#8db597]'
                }`}
              >
                {/* Slot Header: Title & Toggle */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-[#183a24] flex items-center gap-1">
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
                          ? 'bg-[#285338] text-white shadow-xs'
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
                          ? 'bg-[#285338] text-white shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      🔗 URL
                    </button>
                  </div>
                </div>

                {/* Slot Body: Image Preview OR Input Area */}
                {hasImage ? (
                  <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-[#FAF7EE] p-2.5">
                    {/* Square Thumbnail */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#8db597] bg-neutral-100">
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
                        <span className="rounded-full bg-[#e2f0e6] border border-[#8db597] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-[#183a24]">
                          ✓ Photo Added
                        </span>
                      </div>
                      <p className="truncate text-[10.5px] text-neutral-600 font-mono" title={imageUrls[idx]}>
                        {imageUrls[idx]}
                      </p>
                      {note && <p className="text-[10px] font-medium text-[#285338]">{note}</p>}
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
                  <div className="flex min-h-[84px] flex-col items-center justify-center rounded-xl border border-dashed border-[#8db597] bg-[#f2f8f3] p-4 text-center">
                    <svg className="h-5 w-5 animate-spin text-[#285338]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <p className="mt-1.5 text-xs font-semibold text-[#183a24]">Compressing &amp; Uploading…</p>
                    <p className="text-[9.5px] text-neutral-500">Auto-optimizing for high-speed mobile loading</p>
                  </div>
                ) : currentMode === 'upload' ? (
                  <div>
                    <label className="flex min-h-[84px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c4dcce] bg-white p-3 text-center transition hover:border-[#285338] hover:bg-[#f2f8f3]">
                      <svg className="h-6 w-6 text-[#285338]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="mt-1 text-xs font-semibold text-[#183a24]">
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
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-normal focus:border-[#285338] focus:outline-none placeholder:text-neutral-400"
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

      <label className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-700 md:col-span-2 xl:col-span-3 py-1 bg-[#f0f7f2] p-3.5 rounded-xl border border-[#b2d5bd]">
        <input
          name="available"
          type="checkbox"
          defaultChecked={product ? product.available !== false : true}
          className="h-4 w-4 rounded accent-[#285338] cursor-pointer"
        />
        <span>In Stock &amp; Available for Purchase (Storefront Visibility)</span>
      </label>

      {/* ── Submit / Action Bar ──────────────────────────────────── */}
      <div className="md:col-span-2 xl:col-span-3 pt-4 border-t border-[#c4dcce] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs text-neutral-600">
          {isUploadingAny ? (
            <span className="flex items-center gap-1.5 font-semibold text-[#285338]">
              <svg className="h-4 w-4 animate-spin text-[#285338]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Photo uploading in progress… Please wait before saving.
            </span>
          ) : !hasImages ? (
            <span className="text-[#183a24] font-medium flex items-center gap-1">
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
            <span className="text-[#285338] font-semibold flex items-center gap-1">
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
                ? 'bg-[#285338] hover:bg-[#1e402b] text-[#FAF7EE] cursor-pointer active:scale-[0.98]'
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
  const [editForm, setEditForm] = useState({
    courier: '',
    trackingNumber: '',
    trackingUrl: '',
    total: '',
    items: '',
    customerName: '',
    phone: ''
  });
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    phone: '',
    items: '',
    total: '',
    courier: '',
    trackingNumber: '',
    trackingUrl: ''
  });

  function persist(newOrders) {
    setOrders(newOrders);
    try {
      localStorage.setItem('shreivara-orders', JSON.stringify(newOrders));
    } catch (_) { }
  }

  function startEditing(order) {
    setEditingId(order.id);
    setEditForm({
      courier: order.courier || '',
      trackingNumber: order.trackingNumber || '',
      trackingUrl: order.trackingUrl || '',
      total: order.total !== undefined ? String(order.total) : '',
      items: order.items || '',
      customerName: order.customerName || '',
      phone: order.phone || ''
    });
  }

  function saveOrderDetails(id) {
    const today = new Date().toISOString().split('T')[0];
    const updated = orders.map((o) => {
      if (o.id === id) {
        const hasTracking = Boolean(editForm.trackingUrl.trim() || editForm.trackingNumber.trim());
        return {
          ...o,
          customerName: editForm.customerName.trim() || o.customerName,
          phone: editForm.phone.trim() || o.phone,
          items: editForm.items.trim() || o.items,
          courier: editForm.courier.trim(),
          trackingNumber: editForm.trackingNumber.trim(),
          trackingUrl: editForm.trackingUrl.trim(),
          total: editForm.total !== '' ? parseOrderTotal(editForm.total) : o.total,
          status: hasTracking ? 'Dispatched' : 'Pending',
          dispatchDate: hasTracking ? (o.dispatchDate || today) : o.dispatchDate
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
    const hasTracking = Boolean(newOrder.trackingUrl.trim() || newOrder.trackingNumber.trim());
    const created = {
      id: orderId,
      customerName: newOrder.customerName.trim(),
      phone: newOrder.phone.trim(),
      items: newOrder.items.trim(),
      total: parseOrderTotal(newOrder.total),
      orderDate: today,
      status: hasTracking ? 'Dispatched' : 'Pending',
      courier: newOrder.courier.trim(),
      trackingNumber: newOrder.trackingNumber.trim(),
      trackingUrl: newOrder.trackingUrl.trim(),
      dispatchDate: hasTracking ? today : ''
    };
    persist([created, ...orders]);
    setIsAddingOrder(false);
    setNewOrder({
      customerName: '',
      phone: '',
      items: '',
      total: '',
      courier: '',
      trackingNumber: '',
      trackingUrl: ''
    });
  }

  function deleteOrder(id) {
    if (window.confirm('Are you sure you want to delete this order record? This cannot be undone.')) {
      persist(orders.filter((o) => o.id !== id));
    }
  }

  function getDirectTrackingUrl(order) {
    if (order.trackingUrl && order.trackingUrl.startsWith('http')) return order.trackingUrl;
    if (order.trackingNumber && order.trackingNumber.startsWith('http')) return order.trackingNumber;
    const num = (order.trackingNumber || '').trim();
    const courier = (order.courier || '').toLowerCase();
    if (!num) return null;
    if (courier.includes('dtdc')) return `https://www.dtdc.in/tracking/shipment-tracking.asp`;
    if (courier.includes('blue dart') || courier.includes('bluedart')) return `https://www.bluedart.com/tracking`;
    if (courier.includes('delhivery')) return `https://www.delhivery.com/track/package/${num}`;
    if (courier.includes('speed post') || courier.includes('india post')) return `https://www.indiapost.gov.in`;
    return null;
  }

  function generateWhatsAppTrackingUrl(order) {
    const cleanPhone = (order.phone || '').replace(/[^0-9]/g, '');
    const trackingLink = getDirectTrackingUrl(order);
    const trackingSection = trackingLink
      ? `🔗 *Courier Tracking Link (Live Updates):*\n${trackingLink}`
      : `🔖 *Tracking / AWB:* ${order.trackingNumber || 'Courier tracking link will be shared shortly'}`;
    const message = `Namaste ${order.customerName}! 🌸\n\nYour order *${order.id}* from *Shreivara Handlooms & Fine Jewelry* has been shipped! 📦✨\n\n📋 *Items:* ${order.items}\n🚚 *Courier Partner:* ${order.courier || 'Express Courier'}\n${trackingSection}\n\nYou can click the link above anytime to check live delivery updates directly from the courier.\n\nThank you for choosing Shreivara! Feel free to reach out if you have any questions.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  const [showAutoReplyGuide, setShowAutoReplyGuide] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const autoReplyTemplate = `Namaste! 🌸 Thank you for choosing Shreivara Handlooms & Fine Jewelry. We have received your order details! Our team is checking live inventory and will confirm the availability of your selected piece(s) and deliver to you shortly. ✨`;

  function copyAutoReplyTemplate() {
    try {
      navigator.clipboard.writeText(autoReplyTemplate);
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 2500);
    } catch (_) {}
  }

  function generateWhatsAppAvailabilityUrl(order) {
    const cleanPhone = (order.phone || '').replace(/[^0-9]/g, '');
    const message = `Namaste ${order.customerName || 'valued customer'}! 🌸\n\nThank you for choosing *Shreivara Handlooms & Fine Jewelry*! ✨\n\nWe are pleased to confirm that your selected item(s) are *available in stock*:\n📋 *Items:* ${order.items || 'Selected Handloom Piece'}\n💰 *Order Total:* ${order.total || ''}\n\n📦 *Delivery Confirmation:*\nWe will safely pack and deliver your order to your address via Express Courier. We will share your live courier tracking link with you right here on WhatsApp as soon as it is dispatched.\n\nPlease confirm if you would like us to proceed with dispatch!\n\nWarm regards,\n*Shreivara Handlooms*`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  // Summary Metrics (No limit on order totals)
  const totalOrdersCount = orders.length;
  const totalOrdersAmount = orders.reduce((sum, o) => sum + (parseOrderTotal(o.total) || 0), 0);
  const withTrackingCount = orders.filter((o) => Boolean(getDirectTrackingUrl(o) || o.trackingNumber)).length;
  const awaitingTrackingCount = orders.filter((o) => !getDirectTrackingUrl(o) && !o.trackingNumber).length;

  const filtered = orders.filter((o) => {
    if (filter === 'All') return true;
    if (filter === 'With Tracking Link') return Boolean(getDirectTrackingUrl(o) || o.trackingNumber);
    if (filter === 'Awaiting Courier Link') return !getDirectTrackingUrl(o) && !o.trackingNumber;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c4dcce] pb-4">
        <div>
          <h2 className="font-brand text-2xl font-bold text-[#142e1d]">Dispatched Orders Management</h2>
          <p className="text-xs text-neutral-500">Provide official courier tracking details links to customers and notify them on WhatsApp.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAutoReplyGuide((v) => !v)}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-[#8db597] bg-white hover:bg-[#eef7f0] text-[#183a24] font-bold px-3.5 py-2 text-xs uppercase tracking-wider shadow-2xs transition"
            title="Setup automated WhatsApp order reply"
          >
            <span>📱</span>
            <span>{showAutoReplyGuide ? 'Hide Auto-Reply Guide' : 'WhatsApp Auto-Reply'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddingOrder((v) => !v)}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-full bg-[#285338] hover:bg-[#1e402b] text-[#FAF7EE] font-bold px-4 py-2 text-xs uppercase tracking-wider shadow-xs transition"
          >
            <span>+</span>
            <span>{isAddingOrder ? 'Close' : 'Record Order'}</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Auto-Reply Setup Guide Banner */}
      {showAutoReplyGuide && (
        <div className="rounded-2xl border-2 border-[#8db597] bg-[#f4f9f5] p-5 space-y-3.5 shadow-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#c4dcce] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">📲</span>
              <h3 className="font-brand text-lg font-bold text-[#142e1d]">Automatic WhatsApp Order Confirmation Setup</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAutoReplyGuide(false)}
              className="cursor-pointer text-xs font-bold text-[#285338] hover:text-[#1e402b]"
            >
              ✕ Close Guide
            </button>
          </div>

          <p className="text-xs text-[#285338] leading-relaxed">
            When customers send you an order from your storefront to WhatsApp (<strong>+91 90005 10329</strong>), WhatsApp Business can automatically send them an instant reply confirming you will check availability and deliver to them.
          </p>

          <div className="rounded-xl border border-[#c4dcce] bg-white p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#285338]">Recommended Auto-Reply Message:</p>
              <button
                type="button"
                onClick={copyAutoReplyTemplate}
                className="cursor-pointer rounded-lg bg-[#285338] hover:bg-[#1e402b] text-[#FAF7EE] px-3 py-1 text-[11px] font-bold shadow-2xs transition"
              >
                {copiedTemplate ? '✓ Copied to Clipboard!' : '📋 Copy Message Template'}
              </button>
            </div>
            <p className="text-xs text-neutral-800 bg-[#FAF7EE] p-3 rounded-lg font-sans border border-[#dceade] italic leading-relaxed">
              "{autoReplyTemplate}"
            </p>
          </div>

          <div className="space-y-1.5 text-xs text-neutral-700 bg-white/70 p-3.5 rounded-xl border border-[#c4dcce]">
            <p className="font-bold text-[#142e1d]">How to enable on your phone in 1 minute (Free in WhatsApp Business):</p>
            <ol className="list-decimal pl-5 space-y-1 text-[11.5px] text-neutral-800">
              <li>Open <strong>WhatsApp Business</strong> on your phone (the number linked to +91 90005 10329).</li>
              <li>Go to <strong>Settings</strong> &rarr; <strong>Business Tools</strong> &rarr; <strong>Greeting message</strong> (or <em>Away message</em>).</li>
              <li>Turn <strong>ON</strong> <em>"Send greeting message"</em>.</li>
              <li>Tap on <em>Greeting message</em>, paste the template text copied above, and tap <strong>Save</strong>.</li>
            </ol>
            <p className="text-[11px] text-[#285338] font-medium pt-1">
              ✨ Once enabled, every time a customer messages your WhatsApp line, WhatsApp will reply with this confirmation automatically within seconds!
            </p>
          </div>
        </div>
      )}

      {/* Orders Summary Metric Cards (Shows Order Total without Limit) */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#c4dcce] bg-white p-4 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#285338]">Total Orders</p>
          <p className="mt-1 font-brand text-2xl sm:text-3xl font-bold text-[#142e1d]">{totalOrdersCount}</p>
          <p className="mt-0.5 text-[10px] text-neutral-500">All recorded orders</p>
        </div>
        <div className="rounded-2xl border border-[#c4dcce] bg-white p-4 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#285338]">Total Orders Value</p>
          <p className="mt-1 font-brand text-2xl sm:text-3xl font-bold text-[#142e1d]">{formatCurrency(totalOrdersAmount)}</p>
          <p className="mt-0.5 text-[10px] text-[#285338] font-medium">No order total limit</p>
        </div>
        <div className="rounded-2xl border border-[#c4dcce] bg-white p-4 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#285338]">With Courier Link</p>
          <p className="mt-1 font-brand text-2xl sm:text-3xl font-bold text-[#1e442c]">{withTrackingCount}</p>
          <p className="mt-0.5 text-[10px] text-neutral-500">Live courier tracking link</p>
        </div>
        <div className="rounded-2xl border border-[#c4dcce] bg-white p-4 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#705623]">Awaiting Courier Link</p>
          <p className="mt-1 font-brand text-2xl sm:text-3xl font-bold text-[#705623]">{awaitingTrackingCount}</p>
          <p className="mt-0.5 text-[10px] text-neutral-500">Needs tracking link</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'All', label: `All Orders (${totalOrdersCount})` },
          { key: 'With Tracking Link', label: `With Courier Link (${withTrackingCount})` },
          { key: 'Awaiting Courier Link', label: `Awaiting Courier Link (${awaitingTrackingCount})` }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              filter === tab.key
                ? 'bg-[#285338] text-[#FAF7EE] shadow-xs'
                : 'border border-[#b2d5bd] bg-white text-[#183a24] hover:bg-[#eef7f0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isAddingOrder && (
        <form onSubmit={handleCreateOrder} className="rounded-2xl border-2 border-[#8db597] bg-[#f4f9f5] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-brand text-lg font-bold text-[#142e1d]">Record New Customer Order</h3>
              <p className="text-xs text-neutral-600">Enter customer details, order amount, and the tracking link provided by your courier.</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#183a24] bg-[#e2f0e6] px-2 py-0.5 rounded-full border border-[#8db597]">
              New Entry
            </span>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
              Customer Name *
              <input
                required
                type="text"
                placeholder="e.g. Sravani Rao"
                value={newOrder.customerName}
                onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-[#285338] focus:outline-none"
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
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-[#285338] focus:outline-none"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
              Order Total (INR, No Limit) *
              <input
                required
                type="text"
                inputMode="numeric"
                placeholder="e.g. 1,49,999 (No limit)"
                value={newOrder.total}
                onChange={(e) => setNewOrder({ ...newOrder, total: e.target.value })}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-[#285338] focus:outline-none font-semibold text-[#142e1d]"
              />
              <span className="text-[10px] text-neutral-500 font-normal">Supports any amount with or without commas</span>
            </label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700 sm:col-span-2 md:col-span-3">
              Item Details (Name, SKU, Qty) *
              <input
                required
                type="text"
                placeholder="e.g. Royal Kanjivaram Silk (SHR-001) × 1"
                value={newOrder.items}
                onChange={(e) => setNewOrder({ ...newOrder, items: e.target.value })}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-[#285338] focus:outline-none"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
              Courier Partner Name
              <input
                type="text"
                placeholder="e.g. DTDC, Blue Dart, Delhivery, Speed Post"
                value={newOrder.courier}
                onChange={(e) => setNewOrder({ ...newOrder, courier: e.target.value })}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-[#285338] focus:outline-none"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700 sm:col-span-2">
              Courier Tracking Details Link (URL from Courier)
              <input
                type="url"
                placeholder="https://track.dtdc.com/... (Link given by courier)"
                value={newOrder.trackingUrl}
                onChange={(e) => setNewOrder({ ...newOrder, trackingUrl: e.target.value })}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-[#285338] focus:outline-none"
              />
              <span className="text-[10px] text-neutral-500 font-normal">Paste the live tracking details link provided by the courier</span>
            </label>
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
              AWB / Consignment Number (Optional)
              <input
                type="text"
                placeholder="e.g. DTDC8829104"
                value={newOrder.trackingNumber}
                onChange={(e) => setNewOrder({ ...newOrder, trackingNumber: e.target.value })}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-[#285338] focus:outline-none"
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
              className="cursor-pointer rounded-xl bg-[#285338] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#FAF7EE] hover:bg-[#1e402b] shadow-xs"
            >
              Save Order Record
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[#c4dcce] bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#c4dcce] bg-[#edf5ef] text-[11px] font-semibold uppercase tracking-wider text-[#142e1d]">
              <th className="py-3 px-4">Order ID &amp; Date</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Item Details</th>
              <th className="py-3 px-4">Total Amount</th>
              <th className="py-3 px-4">Tracking Status</th>
              <th className="py-3 px-4">Courier Partner &amp; Tracking Details Link</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2efe5]">
            {filtered.map((order) => {
              const trackingUrl = getDirectTrackingUrl(order);
              const isEditingThis = editingId === order.id;
              const hasTrackingLink = Boolean(trackingUrl || order.trackingNumber);

              return (
                <tr key={order.id} className="hover:bg-[#f2f8f3] transition">
                  <td className="py-3.5 px-4 font-semibold text-[#285338] whitespace-nowrap">
                    {order.id}
                    <div className="text-[10px] font-normal text-neutral-400">{order.orderDate}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {isEditingThis ? (
                      <div className="flex flex-col gap-1 min-w-[130px]">
                        <input
                          type="text"
                          value={editForm.customerName}
                          onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                          placeholder="Customer Name"
                          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs focus:border-[#285338] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder="Phone"
                          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs focus:border-[#285338] focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-neutral-900">{order.customerName}</p>
                        <p className="text-[10px] text-neutral-500 font-mono">{order.phone}</p>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-neutral-700">
                    {isEditingThis ? (
                      <input
                        type="text"
                        value={editForm.items}
                        onChange={(e) => setEditForm({ ...editForm, items: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-2 py-1 text-xs focus:border-[#285338] focus:outline-none"
                      />
                    ) : (
                      order.items
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-neutral-900 whitespace-nowrap">
                    {isEditingThis ? (
                      <div className="flex flex-col gap-0.5">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editForm.total}
                          onChange={(e) => setEditForm({ ...editForm, total: e.target.value })}
                          className="w-28 rounded-lg border border-neutral-300 px-2 py-1 text-xs focus:border-[#285338] focus:outline-none font-bold text-[#142e1d]"
                          title="Enter order total in INR (No limit)"
                        />
                        <span className="text-[9px] text-neutral-400">No limit</span>
                      </div>
                    ) : (
                      formatCurrency(order.total)
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {hasTrackingLink ? (
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-[#e2f0e6] text-[#183a24] border-[#8db597]">
                        ● Live Tracking Link
                      </span>
                    ) : (
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-[#fbf7ed] text-[#705623] border-[#e8d8b5]">
                        ○ Awaiting Courier Link
                      </span>
                    )}
                    {order.dispatchDate && (
                      <div className="text-[9px] text-neutral-500 mt-0.5 font-mono">Date: {order.dispatchDate}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 min-w-[200px]">
                    {isEditingThis ? (
                      <div className="flex flex-col gap-1.5 min-w-[220px]">
                        <input
                          type="text"
                          placeholder="Courier Partner (e.g. DTDC, Blue Dart)"
                          value={editForm.courier}
                          onChange={(e) => setEditForm({ ...editForm, courier: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs focus:border-[#285338] focus:outline-none"
                        />
                        <input
                          type="url"
                          placeholder="Courier Tracking Link (https://...)"
                          value={editForm.trackingUrl}
                          onChange={(e) => setEditForm({ ...editForm, trackingUrl: e.target.value })}
                          className="rounded-lg border border-[#8db597] bg-[#f4f9f5] px-2 py-1 text-xs focus:border-[#285338] focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="AWB / Tracking #"
                          value={editForm.trackingNumber}
                          onChange={(e) => setEditForm({ ...editForm, trackingNumber: e.target.value })}
                          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs focus:border-[#285338] focus:outline-none"
                        />
                        <div className="flex gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => saveOrderDetails(order.id)}
                            className="cursor-pointer rounded-lg bg-[#285338] px-3 py-1 text-[11px] font-bold text-[#FAF7EE] hover:bg-[#1e402b] transition"
                          >
                            Save Tracking Link
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="cursor-pointer rounded-lg border border-neutral-300 px-2.5 py-1 text-[11px] text-neutral-600 hover:bg-neutral-100 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-semibold text-neutral-800 flex items-center gap-1.5">
                          <span>🚚</span>
                          <span>{order.courier || 'Express Courier'}</span>
                        </p>
                        {order.trackingNumber && (
                          <p className="font-mono text-[10px] text-neutral-500">AWB: {order.trackingNumber}</p>
                        )}
                        {trackingUrl ? (
                          <a
                            href={trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-[#8db597] bg-[#eef7f0] hover:bg-[#e2f0e6] px-2.5 py-1 text-[11px] font-bold text-[#183a24] transition shadow-2xs"
                            title="Open tracking details provided by courier"
                          >
                            <span>🔗 View Courier Tracking Details</span>
                            <span className="text-[10px]">↗</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-neutral-400 italic">No courier link added yet</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {order.phone && (
                        <>
                          <a
                            href={generateWhatsAppAvailabilityUrl(order)}
                            target="_blank"
                            rel="noreferrer"
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-[#8db597] bg-white hover:bg-[#eef7f0] px-2.5 py-1.5 text-[11px] font-semibold text-[#183a24] shadow-2xs transition"
                            title="Confirm availability & delivery schedule with customer on WhatsApp"
                          >
                            <span>✓ Availability</span>
                            <span className="text-[10px]">↗</span>
                          </a>
                          <a
                            href={generateWhatsAppTrackingUrl(order)}
                            target="_blank"
                            rel="noreferrer"
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-2xs transition"
                            title="Send courier tracking details link to customer on WhatsApp"
                          >
                            <span>🚚 Tracking</span>
                            <span className="text-[10px]">↗</span>
                          </a>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditingThis) {
                            setEditingId(null);
                          } else {
                            startEditing(order);
                          }
                        }}
                        className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition shadow-2xs ${
                          isEditingThis
                            ? 'bg-neutral-100 border-neutral-300 text-neutral-700'
                            : 'border-[#8db597] bg-white hover:bg-[#eef7f0] text-[#183a24]'
                        }`}
                        title="Add or update courier tracking link"
                      >
                        {isEditingThis ? 'Close' : '🔗 Courier Link'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteOrder(order.id)}
                        className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 px-2.5 py-1.5 text-[11px] font-bold text-red-700 shadow-2xs transition"
                        title="Delete order record permanently"
                      >
                        <span aria-hidden="true">🗑️</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
    if (isSupabaseConfigured) {
      try {
        await insertProductToSupabase(newProduct);
      } catch (err) {
        console.warn('Supabase insert notice:', err);
      }
    }

    const next = [newProduct, ...products];
    persistProducts(next);

    return {
      product: newProduct,
      warning: `Product "${newProduct.name}" (SKU: ${sku}) published successfully!`,
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

    if (updatedProduct) {
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct),
        });
      } catch (_) {}

      if (isSupabaseConfigured) {
        try {
          await updateProductInSupabase(sku, updatedProduct);
        } catch (err) {
          console.warn('Supabase update notice:', err);
        }
      }
    }

    return {
      product: updatedProduct,
      warning: `Changes for "${updatedProduct?.name || sku}" saved successfully!`,
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

  // Authenticated Full Admin Dashboard View
  const totalStock = products.reduce((acc, p) => acc + (p.stock ?? 5), 0);
  const activeProducts = products.filter((p) => p.available !== false).length;
  const soldOutProducts = products.filter((p) => p.available === false).length;
  const storefrontUrl = typeof window !== 'undefined' && window.location.hostname.toLowerCase().includes('admin')
    ? 'https://shreivara-handlooms.vercel.app'
    : '/';

  return (
    <div className="min-h-screen bg-[#FAF7EE] flex flex-col text-[#183a24]">
      {/* Dedicated Admin Portal Header - Pista & Cream Luxury Theme */}
      <header className="sticky top-0 z-40 bg-[#FAF7EE]/95 backdrop-blur-md border-b border-[#c8decb] shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <a href={storefrontUrl} className="cursor-pointer group flex items-center gap-2.5">
              <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden border-2 border-[#8db597] bg-[#142e1d] shadow-xs shrink-0">
                <img
                  src={shreivaraLogo}
                  alt="Shreivara Official Logo"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { e.currentTarget.src = '/shreivara-logo.jpg'; }}
                />
              </div>
              <span className="font-brand text-2xl font-semibold tracking-tight text-[#142e1d] group-hover:text-[#285338] transition">
                Shreivara
              </span>
            </a>
            <span className="rounded-full border border-[#8db597] bg-[#e2f0e6] text-[#183a24] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] shadow-2xs">
              Admin Panel
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={storefrontUrl}
              target={storefrontUrl.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-[#8db597] bg-white hover:bg-[#eef7f0] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#183a24] shadow-2xs transition"
              title="Open Customer Storefront"
            >
              <span>Storefront</span>
              <span className="text-xs">↗</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#c4dcce] bg-white p-5 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#285338]">Total Designs</p>
            <p className="mt-1 font-brand text-3xl font-bold text-[#142e1d]">{products.length}</p>
          </div>
          <div className="rounded-2xl border border-[#c4dcce] bg-white p-5 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#285338]">Active (In Stock)</p>
            <p className="mt-1 font-brand text-3xl font-bold text-[#142e1d]">{activeProducts}</p>
          </div>
          <div className="rounded-2xl border border-[#c4dcce] bg-white p-5 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7a8c80]">Sold Out</p>
            <p className="mt-1 font-brand text-3xl font-bold text-[#4a5e51]">{soldOutProducts}</p>
          </div>
          <div className="rounded-2xl border border-[#c4dcce] bg-white p-5 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#285338]">Total Inventory Units</p>
            <p className="mt-1 font-brand text-3xl font-bold text-[#142e1d]">{totalStock}</p>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c8decb] pb-4">
          <div>
            <h1 className="font-brand text-3xl font-bold text-[#142e1d]">Store Management Console</h1>
            <p className="text-xs text-[#5c6e64] mt-0.5">Control live storefront inventory, pricing, availability toggles, and courier shipments.</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('catalogue')}
              className={`cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'catalogue'
                  ? 'bg-[#285338] text-[#FAF7EE] shadow-xs'
                  : 'border border-[#8db597] bg-white text-[#183a24] hover:bg-[#eef7f0]'
              }`}
            >
              Inventory Manager
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'orders'
                  ? 'bg-[#285338] text-[#FAF7EE] shadow-xs'
                  : 'border border-[#8db597] bg-white text-[#183a24] hover:bg-[#eef7f0]'
              }`}
            >
              Dispatched Orders
            </button>
          </div>
        </div>

        {/* Tab 1: Orders Dashboard */}
        {activeTab === 'orders' ? (
          <section className="rounded-2xl border border-[#c4dcce] bg-white p-6 sm:p-8 shadow-sm">
            <DispatchedOrdersManager />
          </section>
        ) : (
          /* Tab 2: Inventory & Catalogue Manager */
          <div className="space-y-8">
            {/* Add New Product Section */}
            <section className="rounded-2xl border border-[#c4dcce] bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-6 border-b border-[#e2f0e6] pb-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#285338]">Product Entry</p>
                <h2 className="mt-1 font-brand text-2xl font-bold text-[#142e1d]">Add New Saree or Jewelry Piece</h2>
              </div>
              <ProductForm
                submitLabel="Add Product to Storefront"
                onSave={addProduct}
                availableCategories={availableCategories}
              />
            </section>

            {/* Manage Catalogue & Stock Section */}
            <section className="rounded-2xl border border-[#c4dcce] bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[#e2f0e6] pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#285338]">Inventory Control</p>
                  <h2 className="mt-1 font-brand text-2xl font-bold text-[#142e1d]">Live Storefront Catalogue ({products.length})</h2>
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
                    <div key={product.sku} className="rounded-2xl border-2 border-[#8db597] p-6 bg-[#f4f9f5]">
                      <h3 className="font-brand text-xl font-bold text-[#142e1d] mb-4">Editing {product.name} ({product.sku})</h3>
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
                      className="grid gap-4 rounded-2xl border border-[#d0e2d5] p-4 sm:grid-cols-[100px_1fr_auto] sm:items-center bg-white shadow-2xs hover:shadow-xs transition"
                    >
                      <div className="relative h-24 w-24">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full rounded-xl object-cover border border-[#d0e2d5]"
                        />
                        {product.available === false && (
                          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 text-[9px] font-bold text-white uppercase tracking-wider">
                            Sold Out
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[#142e1d] font-brand text-xl">{product.name}</p>
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[9.5px] font-bold border ${product.available !== false
                                ? 'bg-[#e2f0e6] text-[#183a24] border-[#8db597]'
                                : 'bg-[#f0f4f1] text-[#7a8c80] border-[#c4dcce]'
                              }`}
                          >
                            {product.available !== false ? '● In Stock' : '○ Sold Out'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#5c6e64] font-mono">
                          {product.sku} · <span className="font-sans font-medium text-[#285338]">{product.category}</span> · Stock: {product.stock ?? 5} units
                        </p>
                        <p className="mt-1.5 text-sm font-semibold text-[#142e1d] font-brand">
                          {formatCurrency(product.sellingPrice)}{' '}
                          <span className="text-neutral-400 font-normal line-through text-xs font-sans">
                            / {formatCurrency(product.originalPrice)}
                          </span>
                        </p>
                        {product.offerDetails && (
                          <p className="mt-1 text-xs text-[#285338] font-medium">✦ {product.offerDetails}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch sm:min-w-[130px]">
                        <button
                          type="button"
                          onClick={() => toggleAvailability(product.sku)}
                          className="cursor-pointer rounded-xl border border-[#8db597] bg-white hover:bg-[#eef7f0] px-3 py-1.5 text-xs font-semibold text-[#183a24] transition text-center shadow-2xs"
                        >
                          {product.available !== false ? 'Mark Sold Out' : 'Mark In Stock'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError('');
                            setEditingSku(product.sku);
                          }}
                          className="cursor-pointer rounded-xl bg-[#285338] hover:bg-[#1e402b] px-3 py-1.5 text-xs font-semibold text-[#FAF7EE] transition text-center shadow-2xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(product)}
                          className="cursor-pointer inline-flex items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition text-center shadow-2xs"
                          title="Delete product permanently"
                        >
                          <span>🗑️</span>
                          <span>Delete</span>
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
