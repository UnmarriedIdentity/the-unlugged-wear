// Import planning — pure, no database (DOC/backend/07). One product is one
// style group, not one spreadsheet row:
//   1. group by style code when present;
//   2. otherwise by style name + gender (Boy/Girl/Female/Male never merge);
//   3. split a group whose non-empty HSN values conflict;
//   4. keep every source row; one variant per colour × option with the
//      row's own price (Qikink prices some sizes higher → a "From" ladder).
// The importer never guesses a category: groups stage as uncategorised drafts.
// Moved from tuw-admin/src/lib/productImport.ts (TL-BE-05.12).

export interface ImportSourceRow {
  /** Physical row, 1-based (audit reference). */
  rowNo: number;
  /** Partner/workbook serial — internal reference, not the product identity. */
  serialNo?: number;
  name: string;
  styleCode: string;
  gender: string;
  colors: string[];
  sizes: string[];
  placements: string[];
  /** Partner unit cost in paise (the sheet's Base Price). */
  costPaise: number;
  weightG?: number;
  shippingWeightG?: number;
  dimensions?: string;
  taxRate?: number;
  hsnCode: string;
  /** Explicit Category column; absent stages as uncategorised. */
  category?: string;
  raw: Record<string, unknown>;
}

export interface ImportVariantDraft {
  color: string | null;
  option: string;
  costPaise: number;
  weightG?: number;
  shippingWeightG?: number;
  dimensions?: string;
  rowNo: number;
}

export type OptionAxis = 'size' | 'model' | 'dimensions' | 'capacity' | 'shape' | 'style';

export interface ImportProductGroup {
  /** Stable grouping key; mirrors products.source_group_key. */
  key: string;
  name: string;
  styleCode: string | null;
  gender: string;
  hsnCode: string | null;
  taxRate?: number;
  category?: string;
  colors: string[];
  options: string[];
  optionAxis: OptionAxis;
  placements: string[];
  weightG?: number;
  shippingWeightG?: number;
  dimensions?: string;
  variants: ImportVariantDraft[];
  rows: ImportSourceRow[];
}

export interface ImportIssue {
  row: number;
  field?: string;
  message: string;
}

export const GENDERS = ['Female', 'Male', 'Unisex', 'Kids', 'Boy', 'Girl'] as const;
const STYLE_CODE = /^[A-Z]{1,3}\d{2}$/;
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];

const clean = (v: string) => v.trim().replace(/\s+/g, ' ');
const lower = (v: string) => clean(v).toLowerCase();
const splitList = (v: unknown) =>
  String(v ?? '').split(',').map(clean).filter((x) => x && x.toUpperCase() !== 'NA');
const uniqueBy = (values: string[]) => {
  const seen = new Set<string>();
  return values.filter((v) => !seen.has(lower(v)) && seen.add(lower(v)));
};

export const isValidHsnCode = (raw: string) => raw.trim() === '' || /^[0-9]{4,8}$/.test(raw.trim());

/** Rupee number from the sheet → integer paise; never trusts floats. */
function rupeesToPaise(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/[₹,\s]/g, ''));
  if (!Number.isFinite(n) || n < 0 || n > 10_000_000) return null;
  return Math.round(n * 100);
}

const optionalInt = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n < 1_000_000 ? Math.round(n) : undefined;
};

/**
 * Qikink "Final Listing" JSON rows → validated source rows. Bad rows are
 * reported and skipped; one bad row never aborts the batch.
 */
export function parseQikinkListing(rows: unknown[]): { rows: ImportSourceRow[]; issues: ImportIssue[] } {
  const out: ImportSourceRow[] = [];
  const issues: ImportIssue[] = [];
  rows.forEach((value, i) => {
    const rowNo = i + 1;
    if (!value || typeof value !== 'object') return issues.push({ row: rowNo, message: 'Row is not an object.' });
    const r = value as Record<string, unknown>;
    const [rawName = '', rawCode = ''] = String(r.style ?? '').split('|').map(clean);
    if (!rawName) return issues.push({ row: rowNo, field: 'style', message: 'Style name is required.' });
    if (rawName.length > 200) return issues.push({ row: rowNo, field: 'style', message: 'Style name is too long.' });
    const gender = clean(String(r.gender ?? '')) || 'Unisex';
    if (!(GENDERS as readonly string[]).includes(gender)) return issues.push({ row: rowNo, field: 'gender', message: `Unknown gender "${gender}".` });
    const cost = rupeesToPaise(r.basePriceINR);
    if (cost === null || cost === 0) return issues.push({ row: rowNo, field: 'basePriceINR', message: 'Base price must be a positive amount.' });
    const hsn = clean(String(r.hsn ?? ''));
    if (!isValidHsnCode(hsn)) return issues.push({ row: rowNo, field: 'hsn', message: 'HSN must be 4–8 digits.' });
    const sizes = splitList(r.sizes);
    if (!sizes.length) return issues.push({ row: rowNo, field: 'sizes', message: 'At least one size/option is required.' });
    const tax = r.taxRatePercent === undefined || r.taxRatePercent === null || r.taxRatePercent === '' ? undefined : Number(r.taxRatePercent);
    if (tax !== undefined && !(Number.isFinite(tax) && tax >= 0 && tax <= 28)) return issues.push({ row: rowNo, field: 'taxRatePercent', message: 'Tax rate must be 0–28%.' });
    const serial = Number(r.qikinkId);
    out.push({
      rowNo,
      serialNo: Number.isInteger(serial) && serial > 0 ? serial : undefined,
      name: rawName,
      styleCode: STYLE_CODE.test(rawCode) ? rawCode : '',
      gender,
      colors: splitList(r.colors),
      sizes,
      placements: splitList(r.placements),
      costPaise: cost,
      weightG: optionalInt(r.weightGrams),
      shippingWeightG: optionalInt(r.shippingWeightGrams),
      dimensions: clean(String(r.packageDimensionsCm ?? '')) || undefined,
      taxRate: tax,
      hsnCode: hsn,
      category: clean(String(r.category ?? '')).slice(0, 150) || undefined,
      raw: r,
    });
  });
  return { rows: out, issues };
}

const baseKey = (row: ImportSourceRow) =>
  row.styleCode ? `code:${lower(row.styleCode)}` : `name:${lower(row.name)}|gender:${lower(row.gender)}`;

/** Which library definition the sheet's "sizes" column means for a group. */
export function suggestOptionAxis(options: string[]): OptionAxis {
  const all = (re: RegExp) => options.every((o) => re.test(o));
  if (all(/^(xs|s|m|l|xl|xxl|[2-5]xl|free size|one size)$/i) || all(/^\d+(-\d+)?\s*(m|months|yrs?|years?|y)?$/i)) return 'size';
  if (all(/(iphone|samsung|galaxy|oneplus|redmi|vivo|oppo|realme|pixel|^\d{1,2}( (pro|plus|mini|max|pro max|air))?$|pro max|^\d{1,2}[rt]$)/i)) return 'model';
  if (all(/(\d+(\.\d+)?\s*x\s*\d+(\.\d+)?|\bin(ch)?\b|\bcm\b|^a[0-6]$)/i)) return 'dimensions';
  if (all(/\b\d+(\.\d+)?\s*(ml|oz|l|ltr)\b/i)) return 'capacity';
  if (all(/(round|square|heart|rectangle|oval|circle)/i)) return 'shape';
  return 'style';
}

export function sortOptions(options: string[], axis: OptionAxis): string[] {
  if (axis !== 'size') return options;
  const rank = (o: string) => {
    const i = SIZE_ORDER.indexOf(o.toUpperCase());
    if (i >= 0) return i;
    const n = parseFloat(o);
    return Number.isFinite(n) ? 100 + n : 999;
  };
  return [...options].sort((a, b) => rank(a) - rank(b));
}

export function groupImportRows(rows: ImportSourceRow[]): { groups: ImportProductGroup[]; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];
  const base = new Map<string, ImportSourceRow[]>();
  for (const row of rows) {
    const k = baseKey(row);
    base.set(k, [...(base.get(k) ?? []), row]);
  }

  const groups: ImportProductGroup[] = [];
  for (const [key, baseRows] of base) {
    const hsns = uniqueBy(baseRows.map((r) => r.hsnCode).filter(Boolean));
    const buckets = new Map<string, ImportSourceRow[]>();
    for (const row of baseRows) {
      const k = hsns.length > 1 ? `${key}|hsn:${row.hsnCode || 'none'}` : key;
      buckets.set(k, [...(buckets.get(k) ?? []), row]);
    }
    if (hsns.length > 1) issues.push({ row: baseRows[0]!.rowNo, field: 'hsn', message: `"${baseRows[0]!.name}": HSN codes differ (${hsns.join(', ')}); split into ${hsns.length} products.` });

    for (const [groupKey, groupRows] of buckets) {
      const first = groupRows[0]!;
      const genders = uniqueBy(groupRows.map((r) => r.gender));
      if (genders.length > 1) issues.push({ row: first.rowNo, field: 'gender', message: `"${first.name}": more than one gender (${genders.join(', ')}) under one style code.` });
      const taxes = [...new Set(groupRows.map((r) => r.taxRate).filter((t) => t !== undefined))];
      if (taxes.length > 1) issues.push({ row: first.rowNo, field: 'taxRatePercent', message: `"${first.name}": more than one tax rate (${taxes.join('%, ')}%); kept ${taxes[0]}%.` });

      const variants: ImportVariantDraft[] = [];
      const seen = new Map<string, number>();
      for (const row of groupRows) {
        const colors = row.colors.length ? uniqueBy(row.colors) : [null];
        for (const color of colors) {
          for (const option of uniqueBy(row.sizes)) {
            const combo = `${color ? lower(color) : '∅'}\u0000${lower(option)}`;
            const prev = seen.get(combo);
            if (prev !== undefined) {
              issues.push({ row: row.rowNo, message: `"${first.name}": ${color ?? 'no colour'} / ${option} already came from row ${prev}; kept the first.` });
              continue;
            }
            seen.set(combo, row.rowNo);
            variants.push({ color, option, costPaise: row.costPaise, weightG: row.weightG, shippingWeightG: row.shippingWeightG, dimensions: row.dimensions, rowNo: row.rowNo });
          }
        }
      }
      const options = uniqueBy(variants.map((v) => v.option));
      const axis = suggestOptionAxis(options);
      groups.push({
        key: groupKey,
        name: first.name,
        styleCode: first.styleCode || null,
        gender: genders[0] ?? 'Unisex',
        hsnCode: groupRows.find((r) => r.hsnCode)?.hsnCode ?? null,
        taxRate: taxes[0],
        category: groupRows.find((r) => r.category)?.category,
        colors: uniqueBy(variants.map((v) => v.color).filter((c): c is string => c !== null)),
        options: sortOptions(options, axis),
        optionAxis: axis,
        placements: uniqueBy(groupRows.flatMap((r) => r.placements)),
        weightG: groupRows.find((r) => r.weightG)?.weightG,
        shippingWeightG: groupRows.find((r) => r.shippingWeightG)?.shippingWeightG,
        dimensions: groupRows.find((r) => r.dimensions)?.dimensions,
        variants,
        rows: groupRows,
      });
    }
  }
  return { groups, issues };
}

/** Draft retail rule until the owner confirms prices: cost × 2.5, up to ₹_99, min ₹299. */
export function draftRetailPaise(costPaise: number): number {
  // Integer math only: hundreds of rupees = ceil(cost × 2.5 / ₹100) = ceil(costPaise × 5 / 20000).
  const hundreds = Math.floor((costPaise * 5 + 19_999) / 20_000);
  return Math.max(299, hundreds * 100 - 1) * 100;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/'/g, '').replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 200) || 'item';

/** Deterministic, bounded SKU part: "Navy Blue" → "NAVY-BLUE". */
export const skuPart = (s: string) => slugify(s).toUpperCase().slice(0, 20);

export const variantKey = (color: string | null, option: string) =>
  `${color ? `color=${slugify(color)}|` : ''}opt=${slugify(option)}`;

/** Partner colour names → swatch hex (library defaults; staff can edit). */
export const PARTNER_COLOUR_HEX: Record<string, string> = {
  'baby blue': '#A9CBE8', 'baby pink': '#F2C4CE', beige: '#D9C7A7', black: '#141414',
  'black charcoal melange': '#2E2E2E', 'black white': '#141414', 'black melange': '#2B2B2B',
  'bottle green': '#1F4D3A', 'brick red': '#9C3B2E', 'brown black': '#3B2A22', 'charcoal melange': '#4A4A4A',
  'coffee brown': '#5B3A29', 'coffee brown off white': '#5B3A29', copper: '#B06A3B', coral: '#F07F6B',
  'flag green': '#2E7D32', flamingo: '#F5A3B7', 'golden yellow': '#E8B32E', 'green black': '#1E3B2A',
  grey: '#9A9A9A', 'grey melange': '#A7A9AC', jade: '#2E8B74', khaki: '#B9A77E', lavender: '#B9A7D6',
  'light baby pink': '#F4C7D0', maroon: '#6E1E2A', 'maroon off white': '#6E1E2A', mint: '#B8E2C8',
  mushroom: '#B5A99A', 'mustard yellow': '#D4A021', 'mustard yellow off white': '#D4A021',
  'navy blue': '#1F2A44', 'navy melange': '#2E3A55', 'new yellow': '#F2D43D', 'off white': '#F2EEE3',
  'olive green': '#5A5F2E', 'olive green off white': '#5A5F2E', orange: '#E8742A', 'orchid blue': '#7B8CC9',
  peach: '#F6C1A0', 'petrol blue': '#1F5167', pink: '#F08CB0', purple: '#5E3A87', 'purple melange': '#6B4E8C',
  red: '#C62828', 'royal blue': '#2747A8', silver: '#C0C0C0', skyblue: '#7EC8E3', 'steel grey': '#6E7378',
  white: '#FFFFFF', 'white black': '#FFFFFF', 'white lavender': '#FFFFFF', yellow: '#F5D547',
};

/** "NAVY BLUE" / "navy blue" → "Navy Blue" (library spelling). */
export const titleCase = (s: string) => clean(s).toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
