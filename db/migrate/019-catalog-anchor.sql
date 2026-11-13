-- 019-catalog-anchor.sql — correct the imported pricing anchor
-- TL-BE-05. Data-only forward migration.

-- products.base_price is the retail pricing ANCHOR the admin editor derives
-- variant prices from (doc 04). The first import wrote the partner's cost
-- there; on save the editor would have repriced unpinned variants at cost.
-- Partner cost stays in product_source_rows.raw_data (and, later,
-- provider_product_mappings).
UPDATE products SET base_price = price WHERE source = 'csv';

-- Price tiers are explicit prices, not derived ones: pin them.
UPDATE product_variants v SET price_overridden = true
FROM products p
WHERE p.id = v.product_id AND p.source = 'csv' AND v.price <> p.base_price;

-- The demo categories appear in the storefront menu until staff hide them.
UPDATE categories SET show_in_megamenu = true;
