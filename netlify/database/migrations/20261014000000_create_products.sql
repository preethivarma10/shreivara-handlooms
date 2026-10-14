CREATE TABLE products (
  sku TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  original_price INTEGER NOT NULL CHECK (original_price > 0),
  selling_price INTEGER NOT NULL CHECK (selling_price > 0 AND selling_price <= original_price),
  image TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO products (sku, name, category, original_price, selling_price, image) VALUES
  ('SVA-101', 'Kumari Kanchi Pattu Saree', 'Kanchi Pattu', 8999, 6999, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80'),
  ('SVA-102', 'Mangalagiri Pearl Silk', 'Mangalagiri', 6999, 5199, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'),
  ('SVA-103', 'Golden Temple Fancy Silk', 'Fancy Silk', 9999, 7499, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=80'),
  ('SVA-104', 'Rose Organza Festive Drape', 'Organza & Chiffon', 7499, 5599, 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80'),
  ('SVA-105', 'Royal Heritage Kanchi Set', 'Kanchi Pattu', 10999, 8299, 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80'),
  ('SVA-106', 'Ivory Mangalagiri Grace', 'Mangalagiri', 6499, 4699, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80'),
  ('SVA-107', 'Monarch Fancy Silk Elegance', 'Fancy Silk', 11999, 8999, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'),
  ('SVA-108', 'Lotus Chiffon Glow', 'Organza & Chiffon', 6799, 4899, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80');
