-- Localised variant labels ({"en": "Large · up to 6 people", "fr": "Grande · jusqu'à 6 personnes", ...})
ALTER TABLE product_variants ADD COLUMN title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
