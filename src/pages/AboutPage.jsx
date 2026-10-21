import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WHATSAPP_NUMBER } from '../data/products.js';

const collections = [
  ['Kanchi Pattu', 'Rich, occasion-ready silk styles.'],
  ['Mangalagiri', 'Graceful sarees with a classic look.'],
  ['Fancy Silk', 'Statement styles for festive dressing.'],
  ['Organza & Chiffon', 'Light, refined drapes for special days.']
];

export default function AboutPage() {
  useEffect(() => {
    document.title = 'About Shreivara Handlooms';
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="grid overflow-hidden rounded-2xl bg-maroon-900 text-white md:grid-cols-2">
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-500">The Shreivara edit</p>
          <h1 className="mt-4 font-brand text-3xl font-bold leading-tight sm:text-4xl">Sarees and jewellery for the moments worth keeping.</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 sm:text-base">Shreivara brings together expressive sarees and traditional jewellery for celebrations, gifting, and days that call for something special. Explore Kanchi Pattu, Mangalagiri, Fancy Silk, and Organza &amp; Chiffon, then ask us about our jewellery collection.</p>
          <Link to="/#collections" className="cursor-pointer mt-8 inline-flex w-fit items-center rounded-lg bg-gold-500 px-5 py-3 text-sm font-bold text-maroon-900 transition hover:bg-white">Explore the collection</Link>
        </div>
        <div className="min-h-72 md:min-h-full">
          <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85" alt="A richly colored traditional saree" className="h-full min-h-72 w-full object-cover" />
        </div>
      </section>
      <section className="grid gap-8 border-b border-gray-200 py-10 sm:grid-cols-2 lg:gap-16 lg:py-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">A thoughtful selection</p>
          <h2 className="mt-3 font-brand text-2xl font-bold text-maroon-900">Find a weave for your occasion.</h2>
        </div>
        <p className="text-sm leading-7 text-gray-600 sm:text-base">Browse by style or search by saree name and SKU. Each listing shows its price and a direct WhatsApp order option, so you can ask about availability and delivery before placing an order.</p>
      </section>
      <section className="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:py-10" aria-label="Saree categories">
        {collections.map(([name, description]) => (
          <div key={name}>
            <h3 className="font-brand text-lg font-bold text-maroon-900">{name}</h3>
            <p className="mt-2 text-sm text-gray-600">{description}</p>
          </div>
        ))}
      </section>
      <section className="flex flex-col items-start justify-between gap-4 border-t border-gray-200 py-8 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-brand text-xl font-bold text-maroon-900">Traditional Jewellery</h2>
          <p className="mt-1 text-sm text-gray-600">Ask us about the jewellery available to complete your look.</p>
        </div>
        {WHATSAPP_NUMBER && (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Shreivara, I would like to see your jewellery collection.')}`}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer inline-flex items-center rounded-md bg-emerald-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
          >
            Enquire on WhatsApp
          </a>
        )}
      </section>
    </main>
  );
}