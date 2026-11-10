-- 018-catalog-content.sql — storefront content the catalog module serves
-- TL-BE-05. Forward migration on the applied schema (no new tables).

-- Page layout + copy the storefront PDP renders. product_type drives the
-- layout family (variant picker label, size guide, care copy); details are
-- the bullet list; spec_table is the optional "Product Specifications"
-- block. price_is_draft marks retail prices the owner has not confirmed.
-- slug_aliases keep old URLs resolving after a rename (redirect target).
ALTER TABLE products
  ADD COLUMN product_type   varchar(20)
    CHECK (product_type IN ('apparel','kids-apparel','pet','drinkware','wall-art',
                            'phone-case','bag','stationery','home')),
  ADD COLUMN variant_label  varchar(50),
  ADD COLUMN details        text[]        NOT NULL DEFAULT '{}',
  ADD COLUMN composition    varchar(500),
  ADD COLUMN spec_table     jsonb,
  ADD COLUMN price_is_draft boolean       NOT NULL DEFAULT false,
  ADD COLUMN slug_aliases   varchar(280)[] NOT NULL DEFAULT '{}',
  ADD COLUMN badge          varchar(60);
CREATE INDEX idx_products_slug_aliases ON products USING gin (slug_aliases);

-- Gallery labels ("01 · FRONT") and colour-specific photos: an image may
-- belong to one colour value so the PDP swaps the gallery with the swatch.
ALTER TABLE product_images
  ADD COLUMN label          varchar(60),
  ADD COLUMN color_value_id uuid REFERENCES attribute_values (id) ON DELETE SET NULL;
CREATE INDEX idx_product_images_color_value_id ON product_images (color_value_id);

-- Per-product order of a linked attribute's values (sizes XS→3XL, colours
-- in merchandising order); attribute_values.position is the library order.
ALTER TABLE product_attribute_link_values
  ADD COLUMN position smallint NOT NULL DEFAULT 0 CHECK (position >= 0);
