/**
 * Workbook row → product group planning.
 *
 * The Final Listing sheet is row-oriented, but the catalog is product-oriented:
 * one product owns many rows (size cohorts, colour blocks). This module does
 * the deterministic fold without touching React or browser APIs so the same
 * rules can be exercised by the native test runner.
 *
 * Grouping order:
 * 1. Style code when present (the sheet's production identity).
 * 2. Style type + gender when no code exists, so Boy/Girl/Female/Male rows of
 *    the same title never collapse into one product.
 * 3. Split a group when non-empty HSN values conflict (tax classification is
 *    product-level in the schema, not a variant override).
 */

export const UNCATEGORIZED_CATEGORY = 'Uncategorized';

/** HSN/SAC is optional, but when present it is 4–8 digits. */
export function isValidHsnCode(raw: string): boolean {
  const value = raw.trim();
  return value === '' || /^[0-9]{4,8}$/.test(value);
}

export interface ImportSourceRow {
  /** Physical spreadsheet row, 1-based (audit reference). */
  rowNo: number;
  /** Workbook S.No — internal reference, not the product identity. */
  serialNo?: number;
  name: string;
  styleCode: string;
  gender: string;
  colors: string[];
  sizes: string[];
  placements: string[];
  price: number;
  compareAtPrice?: number;
  weight: string;
  shippingWeight: string;
  dimensions: string;
  tax: string;
  hsnCode: string;
  category?: string;
  /** Raw source cells, excluding the Excel ID. */
  raw?: Record<string, string>;
}

export interface ImportVariantDraft {
  color: string;
  size: string;
  price: number;
  compareAtPrice?: number;
  weight?: string;
  shippingWeight?: string;
  dimensions?: string;
  sourceSerialNo?: number;
}

export interface ImportSourceRowDraft {
  sourceSerialNo?: number;
  sourceRowNo: number;
  raw: Record<string, string>;
}

export interface ImportProductGroup {
  /** Stable source grouping key; mirrors products.source_group_key. */
  key: string;
  name: string;
  styleCode: string;
  gender: string;
  category: string;
  hsnCode: string;
  serialNo?: number;
  colors: string[];
  sizes: string[];
  placements: string[];
  taxRate?: number;
  weight?: string;
  shippingWeight?: string;
  dimensions?: string;
  variants: ImportVariantDraft[];
  sourceRows: ImportSourceRowDraft[];
}

export interface ImportGroupingResult {
  groups: ImportProductGroup[];
  errors: Array<{ row: number; message: string }>;
}

const clean = (value: string): string => value.trim().replace(/\s+/g, ' ');
const lower = (value: string): string => clean(value).toLowerCase();
const unique = (values: string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

/** Case/space-insensitive dedupe for labels whose spelling is not identity. */
const uniqueLabels = (values: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const label = clean(value);
    if (!label) continue;
    const key = lower(label);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
};

function baseGroupKey(row: ImportSourceRow): string {
  const code = lower(row.styleCode);
  if (code) return `code:${code}`;
  return `name:${lower(row.name)}|gender:${lower(row.gender) || 'unspecified'}`;
}

function firstValue(rows: ImportSourceRow[], pick: (row: ImportSourceRow) => string): string {
  for (const row of rows) {
    const value = clean(pick(row));
    if (value) return value;
  }
  return '';
}

function parseTax(raw: string): number | undefined {
  const text = clean(raw);
  if (text === '') return undefined;
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

/**
 * Fold validated workbook rows into draft products.
 *
 * Row-level validation (required Style/Base Price, numeric tax, HSN shape,
 * gender enum) happens before this call so errors can point at the spreadsheet
 * row. This pass adds group-level errors: conflicting tax/category/gender and
 * duplicate color/size combinations.
 */
export function groupImportRows(rows: ImportSourceRow[]): ImportGroupingResult {
  const errors: ImportGroupingResult['errors'] = [];
  const baseGroups = new Map<string, ImportSourceRow[]>();

  for (const row of rows) {
    const key = baseGroupKey(row);
    const bucket = baseGroups.get(key);
    if (bucket) bucket.push(row);
    else baseGroups.set(key, [row]);
  }

  const groups: ImportProductGroup[] = [];

  for (const [baseKey, baseRows] of baseGroups) {
    const hsnValues = unique(baseRows.map((row) => row.hsnCode));
    const splitByHsn = hsnValues.length > 1;
    const buckets = new Map<string, ImportSourceRow[]>();

    for (const row of baseRows) {
      const hsn = clean(row.hsnCode);
      const key = splitByHsn ? `${baseKey}|hsn:${lower(hsn) || 'none'}` : baseKey;
      const bucket = buckets.get(key);
      if (bucket) bucket.push(row);
      else buckets.set(key, [row]);
    }

    for (const [key, groupRows] of buckets) {
      const name = firstValue(groupRows, (row) => row.name);
      const styleCodes = uniqueLabels(groupRows.map((row) => row.styleCode));
      const genders = uniqueLabels(groupRows.map((row) => row.gender));
      const categories = uniqueLabels(groupRows.map((row) => row.category ?? ''));
      const taxes = uniqueLabels(groupRows.map((row) => row.tax));

      if (styleCodes.length > 1) {
        errors.push({
          row: groupRows[0].rowNo,
          message: `"${name}": more than one style code (${styleCodes.join(', ')}) landed in one product group.`,
        });
      }
      if (genders.length > 1) {
        errors.push({
          row: groupRows[0].rowNo,
          message: `"${name}": more than one gender (${genders.join(', ')}) landed in one product group. Add a style code to split it.`,
        });
      }
      if (categories.length > 1) {
        errors.push({
          row: groupRows[0].rowNo,
          message: `"${name}": more than one category (${categories.join(', ')}) landed in one product group.`,
        });
      }
      if (taxes.length > 1) {
        errors.push({
          row: groupRows[0].rowNo,
          message: `"${name}": more than one tax rate (${taxes.map((t) => `${t}%`).join(', ')}) landed in one product group.`,
        });
      }

      const variants: ImportVariantDraft[] = [];
      const seenCombos = new Map<string, ImportSourceRow>();

      for (const row of groupRows) {
        const colors = unique(row.colors);
        const sizes = unique(row.sizes);
        const rowColors = colors.length > 0 ? colors : ['Default'];
        const rowSizes = sizes.length > 0 ? sizes : ['Standard'];

        for (const color of rowColors) {
          for (const size of rowSizes) {
            const combo = `${lower(color)}\u0000${lower(size)}`;
            const previous = seenCombos.get(combo);
            if (previous) {
              errors.push({
                row: row.rowNo,
                message: `"${name}": variant ${color} / ${size} already appears in row ${previous.rowNo}; kept the first row.`,
              });
              continue;
            }
            seenCombos.set(combo, row);
            variants.push({
              color,
              size,
              price: row.price,
              compareAtPrice: row.compareAtPrice,
              weight: clean(row.weight) || undefined,
              shippingWeight: clean(row.shippingWeight) || undefined,
              dimensions: clean(row.dimensions) || undefined,
              sourceSerialNo: row.serialNo,
            });
          }
        }
      }

      const sourceRows: ImportSourceRowDraft[] = groupRows.map((row) => ({
        sourceSerialNo: row.serialNo,
        sourceRowNo: row.rowNo,
        raw: row.raw ?? {},
      }));

      groups.push({
        key,
        name,
        styleCode: styleCodes[0] ?? '',
        gender: genders[0] ?? '',
        category: categories[0] || UNCATEGORIZED_CATEGORY,
        hsnCode: firstValue(groupRows, (row) => row.hsnCode),
        serialNo: groupRows.find((row) => row.serialNo !== undefined)?.serialNo,
        colors: unique(variants.map((variant) => variant.color)),
        sizes: unique(variants.map((variant) => variant.size)),
        placements: unique(groupRows.flatMap((row) => row.placements)),
        taxRate: parseTax(firstValue(groupRows, (row) => row.tax)),
        weight: firstValue(groupRows, (row) => row.weight) || undefined,
        shippingWeight: firstValue(groupRows, (row) => row.shippingWeight) || undefined,
        dimensions: firstValue(groupRows, (row) => row.dimensions) || undefined,
        variants,
        sourceRows,
      });
    }
  }

  return { groups, errors };
}
