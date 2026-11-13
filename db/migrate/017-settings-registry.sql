-- 017-settings-registry.sql — store_settings cleanup for the settings module
-- TL-BE-04. Data-only forward migration (no DDL).

-- Provider state now lives in integration_providers (is_active, environment);
-- these three keys duplicated it and could drift from the registry.
DELETE FROM store_settings
WHERE key IN ('fulfillment.partner', 'fulfillment.environment', 'payments.stripe_live_mode');

-- Money keys are stored as rupee decimal strings ("150.00"), never JSON
-- floats. Older numeric rows are rewritten in place; the reader accepts both.
UPDATE store_settings
SET value = to_jsonb(to_char((value #>> '{}')::numeric, 'FM999999990.00'))
WHERE key IN ('shipping.free_threshold', 'shipping.standard_fee', 'shipping.cod_fee')
  AND jsonb_typeof(value) = 'number';
