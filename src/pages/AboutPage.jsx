import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WHATSAPP_NUMBER } from '../data/products.js';

const collections = [
  ['Kanchi Pattu', 'Rich, occasion-ready silk styles.'],
  ['Mangalagiri', 'Graceful sarees with a classic look.'],
  ['Fancy Silk', 'Statement styles for festive dressing.'],
  ['Organza & Chiffon', 'Light, refined drapes for special days.']
];

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0 text-[#25d366]" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.535 5.847L.057 23.667a.5.5 0 0 0 .612.612l5.82-1.478A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.012-1.373l-.36-.214-3.727.947.963-3.617-.234-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z" />
    </svg>
  );
}

export default function AboutPage() {
  useEffect(() => {
    document.title = 'About Shreivara Handlooms | Heritage Craftsmanship';
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-14 space-y-16">
      {/* Editorial Hero Feature */}
      <section className="grid overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 text-white shadow-xl md:grid-cols-2 relative">
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16 relative z-10">
          <span className="inline-block w-fit text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 border border-neutral-800 px-3 py-1 rounded-full mb-4">
            The Shreivara edit
          </span>
          <h1 className="font-brand text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight text-white tracking-tight">
            Sarees and jewellery for the moments worth keeping.
          </h1>
          <p className="mt-4 max-w-xl text-xs sm:text-sm leading-relaxed text-neutral-400 font-light">
            Shreivara brings together expressive sarees and traditional jewellery for celebrations, gifting, and days that call for something special. Explore Kanchi Pattu, Mangalagiri, Fancy Silk, and Organza &amp; Chiffon, then ask us about our jewellery collection.
          </p>
          <div className="mt-7">
            <Link
              to="/#collections"
              className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-white text-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-wider shadow-sm transition hover:bg-neutral-100"
            >
              Explore the collection
            </Link>
          </div>
        </div>
        <div className="relative min-h-80 md:min-h-full overflow-hidden bg-neutral-900">
          <img
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85"
            alt="A richly colored traditional saree"
            className="h-full min-h-80 w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>
      </section>

      {/* Thoughtful Selection Editorial Section */}
      <section className="grid gap-8 border-b border-neutral-200 pb-12 sm:grid-cols-2 lg:gap-16">
        <div>
          <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 mb-2">
            A thoughtful selection
          </span>
          <h2 className="font-brand text-3xl sm:text-4xl font-normal text-neutral-950 leading-tight">
            Find a weave for your occasion.
          </h2>
        </div>
        <div className="flex items-center">
          <p className="text-xs sm:text-sm leading-relaxed text-neutral-600 font-light">
            Browse by style or search by saree name and SKU. Each listing shows its price and a direct WhatsApp order option, so you can ask about availability and delivery before placing an order.
          </p>
        </div>
      </section>

      {/* Saree Categories Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-label="Saree categories">
        {collections.map(([name, description]) => (
          <div
            key={name}
            className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-2xs hover:border-neutral-900 transition-all"
          >
            <span className="text-neutral-400 text-xs">✦</span>
            <h3 className="mt-2 font-brand text-2xl font-normal text-neutral-950">{name}</h3>
            <p className="mt-2 text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">{description}</p>
          </div>
        ))}
      </section>

      {/* Traditional Jewellery Callout */}
      <section className="flex flex-col items-start justify-between gap-6 rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-8 sm:flex-row sm:items-center shadow-2xs">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">Finishing Touch</span>
          <h2 className="mt-1 font-brand text-2xl sm:text-3xl font-normal text-neutral-950">Traditional Jewellery</h2>
          <p className="mt-1 text-xs sm:text-sm text-neutral-600 font-light">Ask us about the jewellery available to complete your look.</p>
        </div>
        {WHATSAPP_NUMBER && (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to see your jewellery collection.')}`}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-neutral-950 hover:bg-black px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition"
          >
            <WhatsAppIcon />
            Enquire on WhatsApp
          </a>
        )}
      </section>
    </main>
  );
}