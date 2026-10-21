import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------
// Mirror of lib/productImport.ts (self-contained per this project's
// test convention). The contract under test:
//   style code → one group; no code → name + gender; HSN conflicts split;
//   duplicate color/size combos are rejected; missing category is
//   Uncategorized, never T-Shirts.
// ---------------------------------------------------------------
const UNCATEGORIZED_CATEGORY = 'Uncategorized';
const isValidHsnCode = (raw) => raw.trim() === '' || /^[0-9]{4,8}$/.test(raw.trim());
const clean = (value) => value.trim().replace(/\s+/g, ' ');
const lower = (value) => clean(value).toLowerCase();
const unique = (values) => [...new Set(values.map(clean).filter(Boolean))];
const uniqueLabels = (values) => {
  const seen = new Set();
  const out = [];
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

const baseGroupKey = (row) => {
  const code = lower(row.styleCode);
  if (code) return `code:${code}`;
  return `name:${lower(row.name)}|gender:${lower(row.gender) || 'unspecified'}`;
};

const firstValue = (rows, pick) => {
  for (const row of rows) {
    const value = clean(pick(row));
    if (value) return value;
  }
  return '';
};

const parseTax = (raw) => {
  const text = clean(raw);
  if (text === '') return undefined;
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
};

const groupImportRows = (rows) => {
  const errors = [];
  const baseGroups = new Map();
  for (const row of rows) {
    const key = baseGroupKey(row);
    const bucket = baseGroups.get(key);
    if (bucket) bucket.push(row);
    else baseGroups.set(key, [row]);
  }

  const groups = [];
  for (const [baseKey, baseRows] of baseGroups) {
    const hsnValues = unique(baseRows.map((row) => row.hsnCode));
    const splitByHsn = hsnValues.length > 1;
    const buckets = new Map();
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
        errors.push({ row: groupRows[0].rowNo, message: `"${name}": more than one style code` });
      }
      if (genders.length > 1) {
        errors.push({ row: groupRows[0].rowNo, message: `"${name}": more than one gender` });
      }
      if (categories.length > 1) {
        errors.push({ row: groupRows[0].rowNo, message: `"${name}": more than one category` });
      }
      if (taxes.length > 1) {
        errors.push({ row: groupRows[0].rowNo, message: `"${name}": more than one tax rate` });
      }

      const variants = [];
      const seenCombos = new Map();
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
        sourceRows: groupRows.map((row) => ({
          sourceSerialNo: row.serialNo,
          sourceRowNo: row.rowNo,
          raw: row.raw ?? {},
        })),
      });
    }
  }

  return { groups, errors };
};

const row = (overrides = {}) => ({
  rowNo: 2,
  serialNo: 1,
  name: 'Classic Crew T-Shirt',
  styleCode: '',
  gender: 'Male',
  colors: ['Black'],
  sizes: ['M'],
  placements: [],
  price: 799,
  weight: '180',
  shippingWeight: '200',
  dimensions: '18x20x2.3',
  tax: '5',
  hsnCode: '61091000',
  category: '',
  raw: {},
  ...overrides,
});

describe('Workbook import grouping', () => {
  test('groups coded rows into one product and keeps row-level variants', () => {
    const { groups, errors } = groupImportRows([
      row({ rowNo: 3, serialNo: 10, styleCode: 'FC34', colors: ['Black'], sizes: ['S', 'M'] }),
      row({
        rowNo: 4,
        serialNo: 11,
        styleCode: 'fc34',
        colors: ['Chalk White'],
        sizes: ['L'],
        price: 899,
        weight: '200',
      }),
    ]);

    assert.equal(errors.length, 0);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].styleCode, 'FC34');
    assert.equal(groups[0].variants.length, 3);
    assert.deepEqual(groups[0].colors, ['Black', 'Chalk White']);
    assert.deepEqual(groups[0].sizes, ['S', 'M', 'L']);
    assert.equal(groups[0].variants[2].price, 899);
    assert.equal(groups[0].variants[2].weight, '200');
    assert.equal(groups[0].variants[2].sourceSerialNo, 11);
    assert.equal(groups[0].sourceRows.length, 2);
  });

  test('no-code rows group by name + gender, so Boy and Girl stay separate', () => {
    const { groups } = groupImportRows([
      row({ rowNo: 2, serialNo: 1, gender: 'Boy' }),
      row({ rowNo: 3, serialNo: 2, gender: 'Girl' }),
      row({ rowNo: 4, serialNo: 3, gender: 'boy', sizes: ['L'] }),
    ]);

    assert.equal(groups.length, 2);
    assert.deepEqual(groups.map((group) => group.gender), ['Boy', 'Girl']);
    assert.equal(groups[0].variants.length, 2);
  });

  test('splits a group when non-empty HSN values conflict', () => {
    const { groups } = groupImportRows([
      row({ rowNo: 2, serialNo: 1, styleCode: 'MP25', hsnCode: '61091000' }),
      row({ rowNo: 3, serialNo: 2, styleCode: 'MP25', hsnCode: '610990' }),
    ]);

    assert.equal(groups.length, 2);
    assert.deepEqual(
      groups.map((group) => group.hsnCode).sort(),
      ['61091000', '610990']
    );
  });

  test('rejects duplicate color/size combinations and keeps the first row', () => {
    const { groups, errors } = groupImportRows([
      row({ rowNo: 2, serialNo: 1, styleCode: 'FC34', colors: ['Black'], sizes: ['M'] }),
      row({ rowNo: 3, serialNo: 2, styleCode: 'FC34', colors: ['black'], sizes: ['m'], price: 999 }),
    ]);

    assert.equal(groups[0].variants.length, 1);
    assert.equal(groups[0].variants[0].price, 799);
    assert.match(errors[0].message, /already appears in row 2/);
  });

  test('falls back to Uncategorized and Default/Standard values', () => {
    const { groups } = groupImportRows([
      row({ colors: [], sizes: [], category: '', hsnCode: '', tax: '' }),
    ]);

    assert.equal(groups[0].category, UNCATEGORIZED_CATEGORY);
    assert.deepEqual(groups[0].colors, ['Default']);
    assert.deepEqual(groups[0].sizes, ['Standard']);
    assert.equal(groups[0].variants.length, 1);
    assert.equal(groups[0].taxRate, undefined);
  });

  test('flags conflicting tax rates instead of silently picking one', () => {
    const { errors } = groupImportRows([
      row({ rowNo: 2, styleCode: 'FC34', tax: '5' }),
      row({ rowNo: 3, styleCode: 'FC34', tax: '12' }),
    ]);

    assert.match(errors[0].message, /more than one tax rate/);
  });

  test('validates optional HSN as 4–8 digits', () => {
    assert.equal(isValidHsnCode(''), true);
    assert.equal(isValidHsnCode('6109'), true);
    assert.equal(isValidHsnCode('61091000'), true);
    assert.equal(isValidHsnCode('610'), false);
    assert.equal(isValidHsnCode('610910001'), false);
    assert.equal(isValidHsnCode('61A9'), false);
  });
});
