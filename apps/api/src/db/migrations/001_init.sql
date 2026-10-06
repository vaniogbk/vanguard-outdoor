CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ───────────── Customers & admins ─────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name    TEXT NOT NULL DEFAULT '',
  last_name     TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  locale        TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'fr', 'de')),
  default_address JSONB,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────── Catalog ─────────────
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        JSONB NOT NULL,          -- {"en": "...", "fr": "...", "de": "..."}
  description JSONB NOT NULL DEFAULT '{}'::jsonb,
  image       TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  brand         TEXT NOT NULL CHECK (brand IN ('reactive-outdoor', 'kilos-gear', 'vanguard')),
  source_handle TEXT,
  source_url    TEXT,
  category_id   INT REFERENCES categories(id) ON DELETE SET NULL,
  title         JSONB NOT NULL,
  description   JSONB NOT NULL DEFAULT '{}'::jsonb,
  highlights    JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"en": ["...", "..."], ...}
  images        JSONB NOT NULL DEFAULT '[]'::jsonb, -- ["https://...", ...]
  tags          TEXT[] NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  featured      BOOLEAN NOT NULL DEFAULT false,
  rating        NUMERIC(2,1),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand, source_handle)
);
CREATE INDEX products_category_idx ON products(category_id);
CREATE INDEX products_status_idx ON products(status);

CREATE TABLE product_variants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku              TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL DEFAULT 'Default',
  options          JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_cents      INT NOT NULL CHECK (price_cents >= 0),
  compare_at_cents INT CHECK (compare_at_cents IS NULL OR compare_at_cents >= 0),
  stock            INT NOT NULL DEFAULT 0,
  weight_grams     INT NOT NULL DEFAULT 1000,
  position         INT NOT NULL DEFAULT 0,
  source_variant_id TEXT
);
CREATE INDEX variants_product_idx ON product_variants(product_id);

-- ───────────── Orders ─────────────
CREATE SEQUENCE order_number_seq START 100001;

CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number           TEXT NOT NULL UNIQUE DEFAULT ('VG-' || nextval('order_number_seq')),
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  email            TEXT NOT NULL,
  locale           TEXT NOT NULL DEFAULT 'en',
  status           TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN (
                     'pending_payment', 'paid', 'processing', 'shipped', 'delivered',
                     'cancelled', 'refunded', 'payment_failed')),
  currency         TEXT NOT NULL DEFAULT 'EUR',
  subtotal_cents   INT NOT NULL,
  shipping_cents   INT NOT NULL,
  discount_cents   INT NOT NULL DEFAULT 0,
  vat_cents        INT NOT NULL DEFAULT 0,      -- VAT included in total (prices are VAT-inclusive)
  vat_rate         NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_cents      INT NOT NULL,
  shipping_address JSONB NOT NULL,
  shipping_method  TEXT NOT NULL DEFAULT 'standard',
  carrier          TEXT,
  tracking_number  TEXT,
  tracking_url     TEXT,
  payment_provider TEXT NOT NULL,
  payment_session_id TEXT,
  payment_reference  TEXT,
  access_token     TEXT NOT NULL DEFAULT encode(gen_random_bytes(18), 'hex'),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at          TIMESTAMPTZ,
  shipped_at       TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ
);
CREATE INDEX orders_user_idx ON orders(user_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_idx ON orders(created_at DESC);

CREATE TABLE order_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id       UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  variant_title    TEXT,
  sku              TEXT,
  image            TEXT,
  unit_price_cents INT NOT NULL,
  quantity         INT NOT NULL CHECK (quantity > 0),
  line_total_cents INT NOT NULL
);
CREATE INDEX order_items_order_idx ON order_items(order_id);

-- Timeline shown to the customer (tracking) and to admins
CREATE TABLE order_events (
  id         BIGSERIAL PRIMARY KEY,
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  message    TEXT,
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  visible_to_customer BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX order_events_order_idx ON order_events(order_id);

-- Idempotency log for PSP webhooks
CREATE TABLE payment_events (
  id         BIGSERIAL PRIMARY KEY,
  provider   TEXT NOT NULL,
  event_key  TEXT NOT NULL,
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, event_key)
);
