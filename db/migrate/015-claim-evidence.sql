-- 015-claim-evidence.sql — Qikink claim evidence rules (no new tables)
-- Source: Qikink support reply, 2026-11-10 (recorded in
-- DOC/backend/16-Fulfillment-Providers.md §4):
--   * an UNBOXING VIDEO is mandatory for "wrong product delivered" and
--     "missing product/item in the package" claims;
--   * other quality issues (damage, misprint, quality) are reviewed from
--     details + supporting images.
-- Forward migration: 004 and 009 are already applied, so their CHECKs are
-- replaced here by name instead of editing those files.

-- ------------------------------------------------------------ return_items
-- New reason 'missing_item' (an item missing from the parcel).
ALTER TABLE return_items DROP CONSTRAINT IF EXISTS return_items_reason_code_check;
ALTER TABLE return_items ADD CONSTRAINT return_items_reason_code_check
  CHECK (reason_code IN ('size_fit','wrong_variant','damaged','misprint',
                         'wrong_item','missing_item','quality','other'));

-- Replacement requests accept the defect reasons, now incl. missing_item.
ALTER TABLE return_items DROP CONSTRAINT IF EXISTS return_items_check2;
ALTER TABLE return_items ADD CONSTRAINT return_items_replacement_reason_check
  CHECK (request_type <> 'replacement'
         OR reason_code IN ('damaged','misprint','wrong_item','missing_item','quality'));

-- ------------------------------------------------------ fulfillment_claims
ALTER TABLE fulfillment_claims DROP CONSTRAINT IF EXISTS fulfillment_claims_type_check;
ALTER TABLE fulfillment_claims ADD CONSTRAINT fulfillment_claims_type_check
  CHECK (type IN ('damaged','misprint','wrong_item','missing_item',
                  'size_discrepancy','lost_in_transit'));

-- Set by the returns service when one of evidence_media_ids is a video of
-- the parcel being opened (media.mime_type video/*).
ALTER TABLE fulfillment_claims
  ADD COLUMN has_unboxing_video boolean NOT NULL DEFAULT false;

-- Qikink will not accept a wrong-item or missing-item claim without the
-- video, so such a claim cannot leave draft without it.
ALTER TABLE fulfillment_claims ADD CONSTRAINT fulfillment_claims_video_required
  CHECK (type NOT IN ('wrong_item','missing_item')
         OR status = 'draft'
         OR has_unboxing_video);
