-- Stock can no longer go negative: a paid order that exceeds the stock now clamps it at zero and is flagged for review
-- (see applyPaymentResult in src/lib/orders.js). Existing negative values are reset first so the constraint can be added.
UPDATE product_variants SET stock = 0 WHERE stock < 0;
ALTER TABLE product_variants ADD CONSTRAINT product_variants_stock_nonnegative CHECK (stock >= 0);
