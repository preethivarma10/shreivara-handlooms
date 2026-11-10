import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching products:', error);
        } else if (data) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <h2 className="text-2xl font-serif text-gold-400 mb-6 text-center">Latest Collections</h2>

      {loading ? (
        <p className="text-center text-gold-200/60">Loading exclusive pieces...</p>
      ) : products.length === 0 ? (
        <p className="text-center text-gold-200/60">No products available yet. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {products.map((product) => (
            <div key={product.id} className="bg-neutral-900 border border-burgundy-900/50 rounded-lg overflow-hidden p-4">
              <img
                src={product.image_url || (Array.isArray(product.images) ? product.images[0] : product.images)}
                alt={product.name}
                className="w-full h-80 object-cover rounded-md mb-4"
              />
              <h3 className="text-lg font-serif text-white">{product.name}</h3>
              <p className="text-gold-400 font-medium mt-1">₹{product.price}</p>
              <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{product.description}</p>

              <a
                href={`https://wa.me/919000510329?text=I want to order/inquire about ${encodeURIComponent(product.name)} priced at ₹${product.price}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full bg-burgundy-900 hover:bg-burgundy-800 text-white text-center py-2 rounded transition-colors"
              >
                Inquire via WhatsApp
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}