CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  unit_price INTEGER NOT NULL CHECK (unit_price > 0),
  total_price INTEGER NOT NULL CHECK (total_price = unit_price * quantity),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'fulfilled', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX orders_email_created_at_idx ON orders (email, created_at DESC);
