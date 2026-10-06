CREATE TABLE newsletter_subscribers (
  id         BIGSERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  locale     TEXT NOT NULL DEFAULT 'en',
  consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),  -- GDPR: explicit opt-in timestamp
  unsubscribed_at TIMESTAMPTZ
);
