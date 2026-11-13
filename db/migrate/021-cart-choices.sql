-- 021-cart-choices.sql — Cart lines remember the colour and size picked.
-- variant_label stays the frozen display line ("Black / M"); these two keep
-- the shopper's choice as separate values so a line can be shown, changed
-- and merged without parsing that label (DOC/backend/05, TL-BE-07).
ALTER TABLE cart_items ADD COLUMN color varchar(150);
ALTER TABLE cart_items ADD COLUMN size  varchar(150);
