// Builds src/storefront/mocks/catalog.generated.ts from data/qikink-listing.json
// (the Qikink "Final Listing" sheet). Run: pnpm run catalog:generate
//
// Rows that share a style are merged into one product (Qikink splits price
// tiers by size). Styles already hand-written in fixtures.ts are skipped.
// Retail prices are a draft rule (cost × 2.5, rounded up to ₹_99, min ₹299);
// Qikink costs never reach the generated file.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rows = JSON.parse(readFileSync(join(root, 'data/qikink-listing.json'), 'utf8'));

// Styles already curated in fixtures.ts (by Qikink code, or gender + name when Qikink has no code).
const CURATED_CODES = new Set(['FC32', 'FC39', 'MP25', 'UC22', 'UC61', 'UH35', 'UH62', 'UH83', 'UJ29', 'UR50', 'US52']);
const CURATED_NAMES = new Set(['Unisex|Tote Bag Zipper', 'Unisex|Black Coffee Mug', 'Kids|Hoodie']);

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];

const COLOUR_HEX = {
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

// Product type drives the page layout (variant label, size guide, care copy).
function productTypeFor(name, gender) {
  const n = name.toLowerCase();
  if (/dog/.test(n)) return 'pet';
  if (/mug|bottle|sipper|tumbler|cup|coaster/.test(n)) return 'drinkware';
  if (/poster|canvas|frame|wall/.test(n)) return 'wall-art';
  if (/case|cover/.test(n) && /mobile|phone|iphone|samsung|oneplus|redmi|vivo|oppo|realme|case/.test(n)) return 'phone-case';
  if (/tote|bag|pouch|backpack/.test(n)) return 'bag';
  if (/planner|notebook|diary|sticker|bookmark|calendar|card|patch|badge/.test(n)) return 'stationery';
  if (/cushion|pillow|placemat|puzzle|ornament|clock|stand|mousepad|mouse pad|keychain|key chain|magnet|towel|apron|blanket|mask|cap|hat|socks/.test(n))
    return 'home';
  if (['Kids', 'Boy', 'Girl'].includes(gender) || /kids|romper|baby/.test(n)) return 'kids-apparel';
  return 'apparel';
}

function categoryFor(name, type) {
  const n = name.toLowerCase();
  if (type === 'kids-apparel') return 'kids';
  if (type === 'drinkware') return 'mugs';
  if (type !== 'apparel') return 'accessories';
  if (/jacket|bomber|varsity/.test(n)) return 'jackets';
  if (/hood|sweatshirt/.test(n)) return 'hoodies';
  if (/jogger|pant|short|trouser/.test(n)) return 'pants';
  return 'tees';
}

const AUDIENCE = { Unisex: ['men', 'women'], Male: ['men'], Female: ['women'], Kids: ['kids'], Boy: ['kids'], Girl: ['kids'] };
const GENDER_PREFIX = { Male: "Men's", Female: "Women's", Boy: "Boys'", Girl: "Girls'", Kids: 'Kids' };

const titleCase = (s) =>
  s
    .replace(/([a-z])Sublimation/gi, '$1 Sublimation')
    .replace(/\bIPHONE\b/g, 'iPhone')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|[\s-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
    .replace(/\bAop\b/g, 'AOP')
    .replace(/\bIPhone\b/g, 'iPhone')
    .replace(/\bT-shirt/gi, 'T-Shirt');

function displayTitle(name, gender, type, nameCount) {
  let t = titleCase(name.replace(/\bWomens\b/i, "Women's").replace(/\bMens\b/i, "Men's").replace(/\bNonZipper\b/i, 'Non-Zipper'));
  const hasPrefix = /^(men's|women's|kids|boys'|girls')/i.test(t);
  // Same style name sold for several genders (e.g. "Classic Crew T-Shirt") needs telling apart.
  if (!hasPrefix && (nameCount > 1 || type === 'kids-apparel') && GENDER_PREFIX[gender] && gender !== 'Unisex') {
    t = `${GENDER_PREFIX[gender]} ${t}`;
  }
  return t;
}

const slugify = (s) =>
  s.toLowerCase().replace(/'/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Temporary lifestyle photos (public/images/samples) until real product shots
// exist. Alt text starts with "Placeholder" so pages label them as samples.
const SAMPLE_PHOTOS = {
  men: ['men-linen-blazer.jpg', 'men-navy-blazer.jpg', 'men-linen-shirt.jpg'],
  women: ['women-suede-jacket.jpg', 'women-brown-top.jpg', 'women-white-cardigan.jpg', 'women-pleated-skirt.jpg'],
};
const ALL_SAMPLES = [...SAMPLE_PHOTOS.women, ...SAMPLE_PHOTOS.men];
function samplePhotoFor(gender, n) {
  const pool = gender === 'Male' || gender === 'Boy' ? SAMPLE_PHOTOS.men : gender === 'Female' || gender === 'Girl' ? SAMPLE_PHOTOS.women : ALL_SAMPLES;
  return `/images/samples/${pool[n % pool.length]}`;
}

const draftPrice = (costINR) => Math.max(299, Math.ceil((costINR * 2.5) / 100) * 100 - 1);

const splitList = (s) =>
  s.split(',').map((x) => x.trim()).filter((x) => x && x.toUpperCase() !== 'NA');

function sortSizes(sizes, type) {
  if (type !== 'apparel' && type !== 'pet') return sizes;
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase());
    const ib = SIZE_ORDER.indexOf(b.toUpperCase());
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

function sortKidsSizes(sizes) {
  return [...sizes].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

const VARIANT_LABEL = {
  apparel: 'Size', 'kids-apparel': 'Age', pet: 'Size', drinkware: 'Option', 'wall-art': 'Size',
  'phone-case': 'Phone model', bag: 'Option', stationery: 'Option', home: 'Option',
};

const CARE = {
  apparel: ['Machine wash cold, inside out', 'Do not bleach', 'Do not iron directly on the print', 'Line dry in shade'],
  'kids-apparel': ['Machine wash cold, inside out', 'Do not bleach', 'Do not iron directly on the print', 'Line dry in shade'],
  pet: ['Hand wash cold', 'Do not bleach', 'Line dry in shade'],
  drinkware: ['Hand wash recommended to keep the print sharp', 'Care details to be confirmed with our print partner (draft)'],
  'wall-art': ['Wipe gently with a dry, soft cloth', 'Keep away from direct sunlight and damp walls'],
  'phone-case': ['Wipe clean with a soft, slightly damp cloth'],
  bag: ['Spot clean or hand wash cold', 'Do not iron directly on the print', 'Line dry in shade'],
  stationery: ['Keep dry and away from direct sunlight'],
  home: ['Care details to be confirmed with our print partner (draft)'],
};

const DESCRIPTION = {
  apparel: 'printed to order with the leaping deer of The Unplugged Wear.',
  'kids-apparel': 'for kids, printed to order with the leaping deer of The Unplugged Wear.',
  pet: 'for dogs, printed to order with the leaping deer of The Unplugged Wear.',
  drinkware: 'printed to order with the leaping deer of The Unplugged Wear.',
  'wall-art': 'printed to order for your wall.',
  'phone-case': 'printed to order for your phone model.',
  bag: 'printed to order with the leaping deer of The Unplugged Wear.',
  stationery: 'printed to order with the leaping deer of The Unplugged Wear.',
  home: 'printed to order with the leaping deer of The Unplugged Wear.',
};

// ---- group rows into styles ------------------------------------------------
const groups = new Map();
for (const row of rows) {
  const [rawName, rawCode] = row.style.split('|').map((s) => s.trim());
  const code = rawCode && /^[A-Z]{1,3}\d{2}$/.test(rawCode) ? rawCode : null;
  const key = `${row.gender || 'Unisex'}|${rawName}`;
  if (!groups.has(key)) groups.set(key, { name: rawName, gender: row.gender || 'Unisex', code, rows: [] });
  groups.get(key).rows.push(row);
}

const nameCounts = new Map();
for (const g of groups.values()) nameCounts.set(g.name.toLowerCase(), (nameCounts.get(g.name.toLowerCase()) ?? 0) + 1);

const products = [];
const usedSlugs = new Set();
let index = 0;
for (const [key, g] of groups) {
  if ((g.code && CURATED_CODES.has(g.code)) || CURATED_NAMES.has(key)) continue;
  index += 1;
  const type = productTypeFor(g.name, g.gender);
  const title = displayTitle(g.name, g.gender, type, nameCounts.get(g.name.toLowerCase()));
  let slug = slugify(title);
  while (usedSlugs.has(slug)) slug = `${slug}-${g.gender.toLowerCase()}`;
  usedSlugs.add(slug);

  const rawSizes = [...new Set(g.rows.flatMap((r) => splitList(r.sizes)))];
  const sizes = type === 'kids-apparel' && rawSizes.every((s) => /^\d+/.test(s)) ? sortKidsSizes(rawSizes) : sortSizes(rawSizes, type);
  const colours = [...new Set(g.rows.flatMap((r) => splitList(r.colors)))];
  const placements = [...new Set(g.rows.flatMap((r) => splitList(r.placements)))];
  const cost = Math.max(...g.rows.map((r) => Number(r.basePriceINR) || 0));
  const weights = g.rows.map((r) => Number(r.weightGrams)).filter(Boolean);
  const weight = weights.length ? Math.round(weights.reduce((a, b) => a + b, 0) / weights.length) : null;
  const price = draftPrice(cost);
  const tax = g.rows.find((r) => r.taxRatePercent)?.taxRatePercent ?? null;
  const hsn = g.rows.find((r) => r.hsn)?.hsn ?? '';
  const isApparel = type === 'apparel' || type === 'kids-apparel' || type === 'pet';
  const sizeRange = sizes.length > 1 ? `${sizes[0]}–${sizes[sizes.length - 1]}` : sizes[0] ?? 'One size';
  const audienceLabel = { Unisex: 'Unisex', Male: 'Men', Female: 'Women', Kids: 'Kids', Boy: 'Boys', Girl: 'Girls' }[g.gender];
  const subtitleParts = [
    isApparel ? audienceLabel : null,
    sizes.length > 1 ? (isApparel ? sizeRange : `${sizes.length} options`) : sizes[0],
    colours.length > 1 ? `${colours.length} colours` : null,
  ].filter(Boolean);

  products.push({
    id: `qk-${g.code ? g.code.toLowerCase() : slug}`,
    slug,
    title,
    subtitle: subtitleParts.join(' · '),
    category: categoryFor(g.name, type),
    ...(isApparel ? { audience: AUDIENCE[g.gender] } : {}),
    productType: type,
    variantLabel: VARIANT_LABEL[type],
    ...(g.code ? { partnerStyleCode: g.code } : {}),
    priceINR: price,
    priceMinorINR: price * 100,
    priceIsDraft: true,
    publicationStatus: 'published',
    partnerProvider: 'Qikink Direct API',
    partnerAvailability: 'ready_to_print',
    images: [{ url: samplePhotoFor(g.gender, index), alt: `Placeholder sample photo for the ${title}` }],
    colors: (colours.length ? colours : ['White']).map((c) => ({
      name: titleCase(c),
      hex: COLOUR_HEX[c.toLowerCase()] ?? '#D9D4C7',
      value: slugify(c),
    })),
    sizes: (sizes.length ? sizes : ['One size']).map((s) => ({ size: s, inStock: true, stockCount: 100 })),
    printAreas: placements,
    ...(weight ? { weightGrams: weight } : {}),
    ...(tax ? { taxRatePercent: tax } : {}),
    ...(hsn ? { hsnCode: hsn } : {}),
    description: `${title} ${DESCRIPTION[type]} Full description to follow (draft).`,
    details: [
      `${VARIANT_LABEL[type]}${sizes.length > 1 ? 's' : ''}: ${sizes.length ? sizes.join(', ') : 'One size'}`,
      `Printed to order — print areas: ${placements.length ? placements.join(', ').toLowerCase() : 'to be confirmed'}`,
      ...(weight ? [`Approximate weight: ${weight} g`] : []),
    ],
    careInstructions: CARE[type],
    composition: 'Material details to be confirmed with our print partner (draft)',
    sustainabilityBadge: 'Printed to order',
    sortIndex: index,
  });
}

const header = `// GENERATED by scripts/generate-catalog.mjs from data/qikink-listing.json — do not edit by hand.
// Prices are drafts (cost × 2.5 rounded to ₹_99) until the owner confirms them.
import type { Product } from '@storefront/lib/types';

`;
const body = `export const GENERATED_PRODUCTS: Product[] = ${JSON.stringify(
  products.map(({ sortIndex, ...p }) => p),
  null,
  1
)};
`;
writeFileSync(join(root, 'src/storefront/mocks/catalog.generated.ts'), header + body);

const byType = products.reduce((acc, p) => ((acc[p.productType] = (acc[p.productType] ?? 0) + 1), acc), {});
console.log(`Generated ${products.length} products`, byType);
