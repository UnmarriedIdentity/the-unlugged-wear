-- 024-payout-reference.sql — One bank UTR or UPI reference proves one payout.
-- one_refund_per_payout_reference is unique per (method, reference), so the
-- same UTR could be recorded once as a UPI payout and again as a bank
-- transfer. Manual payouts now share one rule regardless of method (TL-BE-09).
CREATE UNIQUE INDEX one_manual_payout_per_reference
  ON refunds (upper(payout_reference))
  WHERE method IN ('upi', 'bank_transfer') AND payout_reference IS NOT NULL;
