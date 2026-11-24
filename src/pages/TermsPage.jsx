import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WHATSAPP_NUMBER } from '../data/products.js';

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0 text-[#25d366]" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.535 5.847L.057 23.667a.5.5 0 0 0 .612.612l5.82-1.478A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.012-1.373l-.36-.214-3.727.947.963-3.617-.234-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z" />
    </svg>
  );
}

export default function TermsPage() {
  useEffect(() => {
    document.title = 'Terms & Conditions | Shreivara Handlooms';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const sections = [
    {
      id: 'acceptance',
      number: '01',
      title: 'Acceptance of Terms',
      content: (
        <>
          <p>
            Welcome to <strong>Shreivara Handlooms &amp; Fine Jewelry</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). By accessing our website at{' '}
            <a href="https://shreivara-handlooms.vercel.app" className="text-maroon-900 underline font-medium">shreivara-handlooms.vercel.app</a>, browsing our collections, or placing an order through our official WhatsApp desk (+91 90005 10329), you agree to be bound by these Terms and Conditions.
          </p>
          <p className="mt-2">
            Please read these terms carefully before confirming any order. If you have questions regarding any point, our customer care team is available to guide you on WhatsApp.
          </p>
        </>
      )
    },
    {
      id: 'handloom-authenticity',
      number: '02',
      title: 'Handloom Authenticity & Artisan Weaving',
      content: (
        <>
          <p>
            Every saree in our collection—including <strong>Kanchi Pattu, Mangalagiri, Fancy Silk, and Organza</strong>—is crafted by master weavers using traditional weaving techniques.
          </p>
          <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs sm:text-sm text-amber-900 space-y-1.5">
            <p className="font-semibold text-maroon-900">✦ Hallmark of Authentic Handlooms:</p>
            <p>
              Subtle yarn slubs, minor motif texture variations, selvedge thread ties, or natural dye nuances are inherent characteristics of genuine handloom weaving and hand-finishing. These are not defects; they stand as testament to authentic handcrafted artistry.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'colors-imagery',
      number: '03',
      title: 'Product Imagery & Color Accuracy',
      content: (
        <>
          <p>
            We photograph all sarees and jewelry pieces in clean studio lighting and natural daylight to display true colors, zari luster, and border details as accurately as possible.
          </p>
          <p className="mt-2">
            However, digital screen resolutions, device display calibrations (OLED, LCD, Night Shift, TrueTone), and mobile brightness settings may cause slight color variations between your screen and the physical garment.
          </p>
          <p className="mt-2 text-xs sm:text-sm text-neutral-600">
            <strong>Tip:</strong> If you would like a live video or additional photo drape preview before ordering, feel free to request it via our WhatsApp helpline.
          </p>
        </>
      )
    },
    {
      id: 'orders-whatsapp',
      number: '04',
      title: 'Order Placement & WhatsApp Verification',
      content: (
        <>
          <p>
            To provide personal attention for every piece, all orders and reservations are confirmed directly via WhatsApp:
          </p>
          <ol className="mt-3 list-decimal list-inside space-y-2 text-xs sm:text-sm text-neutral-700">
            <li><strong>Select Your Products:</strong> Add items to your shopping cart or click &ldquo;Order on WhatsApp&rdquo; on any saree or jewelry card.</li>
            <li><strong>Forward Order Details:</strong> In the cart drawer, click &ldquo;Proceed to Pay on WhatsApp&rdquo; to send the formatted order list with product codes (SKUs) to our studio number.</li>
            <li><strong>Stock &amp; Availability Check:</strong> Our team checks live inventory and confirms the saree or jewelry set availability immediately.</li>
            <li><strong>Secure Payment:</strong> Once confirmed, we provide official UPI (GPay, PhonePe, Paytm) or IMPS/NEFT bank transfer coordinates. Upon receipt of payment confirmation, your order is locked and booked for dispatch.</li>
          </ol>
        </>
      )
    },
    {
      id: 'pricing-gst',
      number: '05',
      title: 'Pricing, GST & Taxes',
      content: (
        <>
          <p>
            All prices are listed in Indian National Rupees (INR ₹).
          </p>
          <ul className="mt-3 list-disc list-inside space-y-2 text-xs sm:text-sm text-neutral-700">
            <li><strong>Goods and Services Tax (GST):</strong> In accordance with Indian tax regulations, a statutory <strong>5% GST</strong> (2.5% CGST + 2.5% SGST) applies to handloom textiles, sarees, and garments. This is calculated transparently during cart checkout.</li>
            <li><strong>Price Revisions:</strong> We reserve the right to revise prices for upcoming weaving batches or catalog additions without prior notice. Confirmed orders already booked will not be affected by price updates.</li>
          </ul>
        </>
      )
    },
    {
      id: 'shipping-delivery',
      number: '06',
      title: 'Domestic Shipping & Delivery Across India',
      content: (
        <>
          <p>
            We provide reliable express doorstep delivery to residential and commercial addresses across India:
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">Orders ₹3,000 &amp; Above</span>
              <p className="mt-1 text-sm font-semibold text-emerald-800">FREE Doorstep Delivery across India</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">Orders Below ₹3,000</span>
              <p className="mt-1 text-sm font-semibold text-amber-800">₹100 Flat Express Courier Charge</p>
            </div>
          </div>
          <ul className="mt-4 list-disc list-inside space-y-2 text-xs sm:text-sm text-neutral-700">
            <li><strong>Dispatch Timeline:</strong> Ready-to-ship handloom sarees are carefully inspected, steam-pressed, and dispatched within 24 to 48 hours of payment confirmation.</li>
            <li><strong>Estimated Transit Time:</strong> 3 to 7 business days depending on pincode location (metro cities generally arrive within 2–4 days; regional areas within 5–7 days).</li>
            <li><strong>Courier Partners:</strong> Deliveries are shipped via premier express courier networks (DTDC, Blue Dart, Delhivery, Speed Post). Tracking numbers are shared directly on WhatsApp upon dispatch.</li>
            <li><strong>Scope of Delivery:</strong> We currently cater to all serviceable pincodes within India. International shipments are not offered at this time.</li>
          </ul>
        </>
      )
    },
    {
      id: 'returns-cancellations',
      number: '07',
      title: 'Returns, Exchanges & Damaged Deliveries',
      content: (
        <>
          <p>
            Due to the delicate, handcrafted nature of pure silk sarees, zari embroidery, and bridal jewelry sets, we adhere to a careful return policy:
          </p>
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50/70 p-4 text-xs sm:text-sm text-red-950 space-y-2">
            <p className="font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>Mandatory Unboxing Video Requirement:</span>
            </p>
            <p>
              To process claims for transit damage, defect, or missing items, customers <strong>must record a clear, continuous, uninterrupted video</strong> showing the outer courier box/tamper-evident packaging from the sealed stage through unboxing and inspection of the piece.
            </p>
            <p className="text-[11.5px] text-red-900">
              Claims must be reported to our WhatsApp support within <strong>48 hours</strong> of delivery with the unboxing video attached.
            </p>
          </div>
          <ul className="mt-3 list-disc list-inside space-y-1.5 text-xs sm:text-sm text-neutral-700">
            <li>Items must be unworn, unwashed, unaltered (tassels / fall / pico not added after receipt), and returned with all original tags and protective packaging.</li>
            <li>Custom orders, blouse stitched sarees, and discounted sale items are non-exchangeable and non-refundable.</li>
          </ul>
        </>
      )
    },
    {
      id: 'garment-care',
      number: '08',
      title: 'Care Guidelines for Silk & Handlooms',
      content: (
        <>
          <p>
            Handcrafted natural fibers and pure zari require gentle care to retain their luster across generations:
          </p>
          <ul className="mt-3 list-disc list-inside space-y-2 text-xs sm:text-sm text-neutral-700">
            <li><strong>Silk Sarees:</strong> Dry clean only. Never machine wash or soak handloom silks. Store wrapped in breathable muslin or pure cotton saree bags in a cool, dry wardrobe. Change fold lines periodically to avoid creasing.</li>
            <li><strong>Ironing:</strong> Press on low-to-medium heat on the reverse side, preferably using a protective cotton press cloth over zari borders.</li>
            <li><strong>Jewelry:</strong> Keep traditional jewelry away from moisture, hair sprays, and direct perfumes. Store in individual air-tight zip pouches.</li>
          </ul>
        </>
      )
    },
    {
      id: 'contact-studio',
      number: '09',
      title: 'Customer Support & Studio Address',
      content: (
        <>
          <p>
            For any assistance, order tracking, custom saree styling, or visit appointments, reach our dedicated studio team:
          </p>
          <div className="mt-4 rounded-xl border border-[#ded5c6] bg-[#faf6ee] p-5 space-y-3 text-xs sm:text-sm">
            <div className="flex gap-3">
              <span className="font-bold text-maroon-900 shrink-0">📍 Studio Address:</span>
              <p className="text-gray-700">
                <strong>Shreivara Handlooms &amp; Fine Jewelry</strong><br />
                Plot No. 42, Heritage Weavers Lane, Jubilee Hills,<br />
                Hyderabad, Telangana — 500033, India
              </p>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-maroon-900 shrink-0">📞 WhatsApp &amp; Phone:</span>
              <a href="tel:+919000510329" className="text-maroon-900 font-medium underline hover:text-maroon-800">+91 90005 10329</a>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-maroon-900 shrink-0">✉️ Email:</span>
              <a href="mailto:shreivara@gmail.com" className="text-gray-700 underline hover:text-maroon-900">shreivara@gmail.com</a>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-maroon-900 shrink-0">🕒 Working Hours:</span>
              <p className="text-gray-700">Monday – Saturday: 10:30 AM – 7:30 PM IST</p>
            </div>
          </div>
        </>
      )
    }
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Breadcrumb & Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-neutral-500">
        <Link to="/" className="cursor-pointer hover:text-maroon-900 hover:underline">Home</Link>
        <span>/</span>
        <span className="font-medium text-neutral-800">Terms &amp; Conditions</span>
      </nav>

      {/* Header Banner */}
      <section className="rounded-2xl border border-[#ded5c6] bg-white p-6 sm:p-10 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e9e1d3] pb-6">
          <div>
            <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-600 mb-1">
              Shreivara Handlooms
            </span>
            <h1 className="font-brand text-3xl sm:text-4xl lg:text-5xl font-medium text-maroon-900">
              Terms &amp; Conditions
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-xl">
              Guidelines, policies, and terms governing our artisan saree collections, WhatsApp orders, and domestic delivery across India.
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-block rounded-full bg-[#f4f8f4] border border-[#2d5a43]/20 px-3.5 py-1.5 text-xs font-semibold text-[#2d5a43]">
              Effective: November 2026
            </span>
          </div>
        </div>

        {/* Quick Summary Highlights */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="rounded-xl bg-[#faf6ee] border border-gold-500/20 p-3">
            <span className="text-xl block">🌿</span>
            <p className="mt-1 text-[11px] font-bold text-maroon-900 uppercase tracking-wider">100% Authentic</p>
            <p className="text-[10px] text-neutral-500">Pure Artisan Handlooms</p>
          </div>
          <div className="rounded-xl bg-[#faf6ee] border border-gold-500/20 p-3">
            <span className="text-xl block">🚚</span>
            <p className="mt-1 text-[11px] font-bold text-maroon-900 uppercase tracking-wider">Pan-India Delivery</p>
            <p className="text-[10px] text-neutral-500">Free above ₹3,000</p>
          </div>
          <div className="rounded-xl bg-[#faf6ee] border border-gold-500/20 p-3">
            <span className="text-xl block">💬</span>
            <p className="mt-1 text-[11px] font-bold text-maroon-900 uppercase tracking-wider">WhatsApp Assisted</p>
            <p className="text-[10px] text-neutral-500">Live Stock &amp; Drape Check</p>
          </div>
          <div className="rounded-xl bg-[#faf6ee] border border-gold-500/20 p-3">
            <span className="text-xl block">📦</span>
            <p className="mt-1 text-[11px] font-bold text-maroon-900 uppercase tracking-wider">Safe Transit</p>
            <p className="text-[10px] text-neutral-500">Express Insured Courier</p>
          </div>
        </div>
      </section>

      {/* Structured Terms Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <article
            key={section.id}
            id={section.id}
            className="scroll-mt-24 rounded-xl border border-[#ded5c6] bg-white p-6 sm:p-8 shadow-2xs transition hover:border-[#b68a55]"
          >
            <div className="flex items-start gap-4">
              <span className="font-mono text-xs font-bold text-gold-600 bg-[#faf6ee] px-2.5 py-1 rounded-md border border-gold-500/30 shrink-0">
                {section.number}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-brand text-xl sm:text-2xl font-bold text-maroon-900 mb-3">
                  {section.title}
                </h2>
                <div className="text-xs sm:text-sm text-neutral-700 leading-relaxed space-y-2">
                  {section.content}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Floating Bottom Help Banner */}
      <div className="mt-10 rounded-2xl border border-gold-500/40 bg-gradient-to-r from-[#faf6ee] via-white to-[#faf6ee] p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <h3 className="font-brand text-2xl sm:text-3xl font-bold text-maroon-900">
          Have Questions About Our Sarees or Orders?
        </h3>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
          Our team is available on WhatsApp to assist with fabric details, live video previews, and order confirmations.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {WHATSAPP_NUMBER && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I have a query regarding your Terms & Conditions on https://shreivara-handlooms.vercel.app.')}`}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#25d366] hover:bg-[#1ebe5d] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition"
            >
              <span className="h-4 w-4 shrink-0"><WhatsAppIcon /></span>
              <span>Chat on WhatsApp (+91 90005 10329)</span>
            </a>
          )}
          <Link
            to="/#collections"
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-maroon-900 hover:bg-maroon-800 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#f8f5ed] shadow-xs transition"
          >
            Explore Saree Collections
          </Link>
        </div>
      </div>
    </main>
  );
}
