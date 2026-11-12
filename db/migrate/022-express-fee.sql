-- 022-express-fee.sql — Express delivery fee becomes a setting (TL-BE-08).
-- The checkout offered express delivery at a fee written in the page; the
-- server now prices it from store_settings like the other shipping fees.
INSERT INTO store_settings (key, value)
VALUES ('shipping.express_fee', to_jsonb('250.00'::text))
ON CONFLICT (key) DO NOTHING;
