# GST Invoices — Format and Data (Draft)

> Status: Draft | Last Updated: 2026-11-10
> Backlog: `TL-INT-GST-INVOICES`. Needs the GSTIN and the accountant's
> sign-off on rates before go-live. **Draft notice:** this is a proposed
> format, not tax advice.

## Seller details (to be completed)

| Field | Value |
|---|---|
| Legal name | The Unplugged Wear (legal entity name to be confirmed) |
| Address | 17-Sanskruti Park Row House, Behind Subhash Garden, Near Doctor's Park Society, Jahangirpura, Surat, Gujarat 395005, India |
| State / code | Gujarat / 24 |
| GSTIN | **pending — owner will provide** |

These go in `store_settings` (`invoice.seller_*`), not in code.

## Numbering

- **Tax invoice:** `TUW/2627/000123` — prefix / financial year (Apr–Mar,
  `26-27` written `2627`) / 6-digit sequence. 15 characters (GST limit 16).
- **Credit note** (refunds, negative exchange difference, cancellations
  after invoicing): `TCN/2627/000045`.
- Sequences restart at 1 every 1 April, are consecutive with no gaps, and
  are allocated inside the same database transaction that creates the
  document (one row lock per series per year).

## When an invoice is issued

When the order is **confirmed** (cancel window over, sent to the
fulfilment partner). A cancellation before that needs no invoice. Gift
card purchases: a voucher is invoiced when it is redeemed against goods,
not when it is bought (confirm with the accountant).

## What the invoice shows

1. "Tax Invoice", invoice number and date.
2. Seller name, address, GSTIN, state + code.
3. Customer name, billing and shipping address; customer GSTIN if they
   enter one (B2B).
4. Place of supply (shipping state + code).
5. One row per item: description, HSN (from `products.hsn`), quantity,
   unit price, discount, taxable value, GST rate, tax amount.
6. Shipping charge as its own row, taxed at the goods' rate.
7. Tax split: **CGST + SGST** (half each) when shipping inside Gujarat,
   **IGST** when shipping to another state.
8. Totals: taxable value, tax, discount, gift card applied, grand total,
   amount in words.
9. "Tax payable on reverse charge: No"; "computer-generated invoice".

Store prices **include** GST (`store_settings.tax.included = true`), so
taxable value = price ÷ (1 + rate). The rate comes from `products.tax_rate`
per line; slab rules (e.g. a rate that depends on the selling price) are
applied by the tax module and must be confirmed by the accountant.
E-invoicing (IRN/QR) is only required above the turnover threshold and is
out of scope for v1.

## Data needed (to be added when this item is built)

| Table | Purpose |
|---|---|
| `document_sequences` | Next number per series (`invoice`, `credit_note`) per financial year |
| `invoices` | Immutable snapshot: number, date, order, seller and buyer snapshots, place of supply, totals, tax split, PDF key |
| `invoice_items` | Per line: description, HSN, qty, price, discount, taxable value, rate, CGST/SGST/IGST amounts |
| `credit_notes` (+ items) | Same shape, linked to the invoice and the refund |

Invoices are never edited; corrections are credit notes.
