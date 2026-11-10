// Break-it unit tests for import planning (no database).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQikinkListing, groupImportRows, suggestOptionAxis, sortOptions, draftRetailPaise, slugify, variantKey } from './planner.ts';

const row = (over: Record<string, unknown> = {}) => ({ qikinkId: 1, gender: 'Unisex', style: 'Classic Tee | UC22', sizes: 'S,M,L', colors: 'Black,White', basePriceINR: 300, placements: 'Front', hsn: '610910', taxRatePercent: 5, ...over });

test('hostile rows are refused with their row number; good rows survive', () => {
  const { rows, issues } = parseQikinkListing([
    row(), null, 'text', row({ style: '' }), row({ style: '  | UC22' }), row({ gender: 'Robot' }), row({ basePriceINR: -5 }),
    row({ basePriceINR: 'NaN' }), row({ basePriceINR: 0 }), row({ hsn: '12' }), row({ sizes: 'NA' }), row({ taxRatePercent: 99 }),
    row({ style: 'x'.repeat(201) }), row({ basePriceINR: '₹1,234.50', style: "Women's \"Fancy\" 🌸 Tee", gender: '' }),
  ]);
  assert.equal(rows.length, 2);
  assert.deepEqual(issues.map((i) => i.row), [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  assert.equal(rows[1]!.costPaise, 123450, 'rupee strings with ₹ and commas parse exactly');
  assert.equal(rows[1]!.gender, 'Unisex', 'blank gender defaults to Unisex');
  assert.equal(rows[1]!.styleCode, '', 'no code after the pipe');
});

test('grouping: code first, name + gender otherwise; price tiers stay per variant', () => {
  const { rows } = parseQikinkListing([
    row({ qikinkId: 1, sizes: 'S,M,L', basePriceINR: 300 }),
    row({ qikinkId: 2, sizes: 'XXL,3XL', basePriceINR: 360 }),
    row({ qikinkId: 3, style: 'Crew Tee', gender: 'Boy' }),
    row({ qikinkId: 4, style: 'Crew Tee', gender: 'Girl' }),
  ]);
  const { groups } = groupImportRows(rows);
  assert.equal(groups.length, 3);
  const tee = groups.find((g) => g.key === 'code:uc22')!;
  assert.equal(tee.variants.length, 2 * 5);
  assert.deepEqual(tee.options, ['S', 'M', 'L', 'XXL', '3XL']);
  assert.deepEqual([...new Set(tee.variants.map((v) => v.costPaise))], [30000, 36000]);
  assert.ok(groups.some((g) => g.key === 'name:crew tee|gender:boy') && groups.some((g) => g.key === 'name:crew tee|gender:girl'));
});

test('duplicates are reported, first row wins; HSN conflicts split the group', () => {
  const { rows } = parseQikinkListing([row({ qikinkId: 1 }), row({ qikinkId: 2, sizes: 'm', colors: 'BLACK' }), row({ qikinkId: 3, sizes: 'XL', hsn: '620520' })]);
  const { groups, issues } = groupImportRows(rows);
  assert.equal(groups.length, 2, 'two HSN codes → two products');
  assert.ok(issues.some((i) => /already came from row 1/.test(i.message)), 'case-insensitive duplicate combo');
  assert.ok(issues.some((i) => i.field === 'hsn'));
});

test('option axis suggestion and size ordering', () => {
  assert.equal(suggestOptionAxis(['XS', 'm', '3XL']), 'size');
  assert.equal(suggestOptionAxis(['0-12M', '2-3Yrs']), 'size');
  assert.equal(suggestOptionAxis(['iPhone 15', '14 Pro Max', '13 Mini']), 'model');
  assert.equal(suggestOptionAxis(['12x18 In', '18x24In', 'A4']), 'dimensions');
  assert.equal(suggestOptionAxis(['11oz', '20 oz', '750 ml']), 'capacity');
  assert.equal(suggestOptionAxis(['Spiral', 'Hardbound']), 'style');
  assert.deepEqual(sortOptions(['XL', 'S', '3XL', 'M', 'XS'], 'size'), ['XS', 'S', 'M', 'XL', '3XL']);
});

test('draft retail rule: integer math at every boundary', () => {
  assert.equal(draftRetailPaise(10000), 29900, '₹100 cost → minimum ₹299');
  assert.equal(draftRetailPaise(100000), 249900, '₹1,000 × 2.5 = ₹2,500 exactly → ₹2,499');
  assert.equal(draftRetailPaise(100001), 259900, 'one paisa more → next ₹100 band');
  assert.equal(draftRetailPaise(1), 29900);
  for (let c = 1; c < 400000; c += 997) assert.ok(Number.isInteger(draftRetailPaise(c)) && draftRetailPaise(c) % 100 === 0);
});

test('slugs and variant keys are safe and stable', () => {
  assert.equal(slugify("Women's Café T-Shirt & Co!"), 'womens-cafe-t-shirt-and-co');
  assert.equal(slugify('🌸🌸'), 'item');
  assert.equal(slugify('a'.repeat(500)).length, 200);
  assert.equal(variantKey('Navy Blue', '3XL'), 'color=navy-blue|opt=3xl');
  assert.equal(variantKey(null, '11oz'), 'opt=11oz');
});
