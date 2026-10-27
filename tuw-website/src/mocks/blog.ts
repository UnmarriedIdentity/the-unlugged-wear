// Deterministic storefront journal fixtures.
//
// The content is a validated JSON document, not HTML. Categories and tags
// mirror the canonical editorial vocabulary so the same filters and URLs
// can later resolve against the real database.

import {
  type JournalAuthor,
  type JournalCategory,
  type JournalContent,
  type JournalMediaAsset,
  type JournalPost,
  type JournalTag,
} from '@/lib/blog';

export const JOURNAL_CATEGORIES: JournalCategory[] = [
  {
    id: 'JCAT-01',
    name: 'Craft',
    slug: 'craft',
    description: 'Material choices, construction details and making notes.',
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'JCAT-02',
    name: 'Slow Living',
    slug: 'slow-living',
    description: 'Rituals, quiet dressing and intentional wardrobes.',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'JCAT-03',
    name: 'Sustainability',
    slug: 'sustainability',
    description: 'Materials, on-demand production and honest lifecycle.',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'JCAT-04',
    name: 'Design',
    slug: 'design',
    description: 'Form, proportion and architectural garment thinking.',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'JCAT-05',
    name: 'Culture',
    slug: 'culture',
    description: 'People, places and the cultural side of dressing well.',
    sortOrder: 4,
    isActive: true,
  },
];

export const JOURNAL_AUTHORS: JournalAuthor[] = [
  {
    id: 'JAUTH-01',
    name: 'Kavita Menon',
    slug: 'kavita-menon',
    roleTitle: 'Textile Design Lead',
    bio: 'Leads fabric development and the studio’s material archive.',
    avatarUrl: 'https://i.pravatar.cc/120?img=47',
    isActive: true,
  },
  {
    id: 'JAUTH-02',
    name: 'Dev Sharma',
    slug: 'dev-sharma',
    roleTitle: 'Co-Founder',
    bio: 'Writes about on-demand production and the business of permanence.',
    avatarUrl: 'https://i.pravatar.cc/120?img=13',
    isActive: true,
  },
  {
    id: 'JAUTH-03',
    name: 'Ananya Varma',
    slug: 'ananya-varma',
    roleTitle: 'Editorial',
    bio: 'Explores quiet dressing, ritual and the texture of daily life.',
    avatarUrl: 'https://i.pravatar.cc/120?img=24',
    isActive: true,
  },
];

export const JOURNAL_TAGS: JournalTag[] = [
  { id: 'JTAG-01', name: 'Organic Cotton', slug: 'organic-cotton' },
  { id: 'JTAG-02', name: 'Print On Demand', slug: 'print-on-demand' },
  { id: 'JTAG-03', name: 'Slow Fashion', slug: 'slow-fashion' },
  { id: 'JTAG-04', name: 'Behind The Scenes', slug: 'behind-the-scenes' },
  { id: 'JTAG-05', name: 'Lookbook', slug: 'lookbook' },
];

export const JOURNAL_MEDIA: JournalMediaAsset[] = [
  {
    id: 'JMED-01',
    url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&auto=format&fit=crop&q=80',
    alt: 'Close-up of heavyweight loopback cotton',
    caption: '500 GSM French terry at the loopback stage.',
    credit: 'Studio archive',
    usage: 'blog',
  },
  {
    id: 'JMED-02',
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&auto=format&fit=crop&q=80',
    alt: 'Tailoring tools on a neutral workbench',
    caption: 'Pattern work before the first sample.',
    usage: 'blog',
  },
  {
    id: 'JMED-03',
    url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&auto=format&fit=crop&q=80',
    alt: 'Minimal folded garments in warm daylight',
    usage: 'blog',
  },
  {
    id: 'JMED-04',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&auto=format&fit=crop&q=80',
    alt: 'Natural dye baths and clean textile tools',
    caption: 'Water-based pigment curing before the final press.',
    credit: 'Tiruppur atelier',
    usage: 'blog',
  },
  {
    id: 'JMED-05',
    url: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=1200&auto=format&fit=crop&q=80',
    alt: 'Quiet morning light over folded garments',
    usage: 'blog',
  },
];

const anatomyContent: JournalContent = [
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Fabric weight is not merely a number on a spec sheet — it is the physics of how a garment behaves around the human body.' },
    ],
  },
  {
    type: 'heading',
    attrs: { level: 2 },
    content: [{ type: 'text', text: 'What 500 GSM actually means' }],
  },
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Most commercial sweatshirts rely on 260 to 320 GSM fleece, heavily brushed on the inside with polyester fluff to simulate warmth. Within six washes, that synthetic fluff pills, mats and washes down the drain as microplastics.' },
    ],
  },
  {
    type: 'bulletList',
    content: [
      { type: 'listItem', content: [{ type: 'text', text: 'Long-staple organic cotton', marks: [{ type: 'bold' }] }] },
      { type: 'listItem', content: [{ type: 'text', text: 'Low-speed circular knitting' }] },
      { type: 'listItem', content: [{ type: 'text', text: 'Unbrushed interior loops' }] },
    ],
  },
  {
    type: 'image',
    attrs: {
      mediaId: 'JMED-01',
      alt: 'Close-up of heavyweight loopback cotton',
      caption: '500 GSM French terry at the loopback stage.',
      credit: 'Studio archive',
    },
  },
  {
    type: 'blockquote',
    content: [
      { type: 'text', text: 'The result is apparel that feels like protective architecture — grounded, quiet and getting softer with every monsoon season.', marks: [{ type: 'italic' }] },
    ],
  },
];

const deadstockContent: JournalContent = [
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Every single second, the equivalent of one garbage truck full of clothes is burned or buried in landfills. The root cause is simple: traditional fashion brands guess how many items you will buy six months in advance.' },
    ],
  },
  {
    type: 'heading',
    attrs: { level: 2 },
    content: [{ type: 'text', text: 'Printing only after a real order' }],
  },
  {
    type: 'orderedList',
    content: [
      { type: 'listItem', content: [{ type: 'text', text: 'The customer places an order' }] },
      { type: 'listItem', content: [{ type: 'text', text: 'The atelier selects an organic blank' }] },
      { type: 'listItem', content: [{ type: 'text', text: 'Water-based pigment ink is cured into the fabric' }] },
    ],
  },
  {
    type: 'image',
    attrs: {
      mediaId: 'JMED-04',
      alt: 'Natural dye baths and clean textile tools',
      caption: 'Water-based pigment curing before the final press.',
      credit: 'Tiruppur atelier',
    },
  },
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: 'You wait a few days longer, but your garment leaves zero waste in its wake.' },
    ],
  },
];

const unavailableContent: JournalContent = [
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Our phones vibrate with notifications from people we have never met about emergencies that do not exist. In response, slow living is not an aesthetic — it is a deliberate survival strategy.' },
    ],
  },
  {
    type: 'heading',
    attrs: { level: 3 },
    content: [{ type: 'text', text: 'Restraint as kindness' }],
  },
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: 'When we created the Monolith hoodie, we omitted drawstrings deliberately. Why? Because unnecessary cords dangle, tangle and demand adjustment.' },
    ],
  },
  {
    type: 'image',
    attrs: {
      mediaId: 'JMED-05',
      alt: 'Quiet morning light over folded garments',
    },
  },
];

const tailoringContent: JournalContent = [
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: 'A garment can be perfectly cut and still feel wrong if the weight disagrees with the shape. Our pattern work begins with the fabric, not the drawing.' },
    ],
  },
  {
    type: 'heading',
    attrs: { level: 2 },
    content: [{ type: 'text', text: 'Three fitting decisions' }],
  },
  {
    type: 'bulletList',
    content: [
      { type: 'listItem', content: [{ type: 'text', text: 'Dropped shoulders for calm structure', marks: [{ type: 'bold' }] }] },
      { type: 'listItem', content: [{ type: 'text', text: 'A straighter body seam to reduce visual noise' }] },
      { type: 'listItem', content: [{ type: 'text', text: 'Hems weighted enough to fall, not float' }] },
    ],
  },
  {
    type: 'image',
    attrs: {
      mediaId: 'JMED-02',
      alt: 'Tailoring tools on a neutral workbench',
      caption: 'Pattern work before the first sample.',
    },
  },
  {
    type: 'blockquote',
    content: [
      { type: 'text', text: 'If a garment asks for constant adjustment, it has not finished being designed.', marks: [{ type: 'italic' }] },
    ],
  },
];

export const JOURNAL_POSTS: JournalPost[] = [
  {
    id: 'JPOST-001',
    slug: 'the-anatomy-of-500-gsm-cotton',
    title: 'The Weight of Stillness: Why We Chose 500 GSM French Terry',
    subtitle: 'An uncompromising look at yarn tension, loopback architecture and garment longevity.',
    excerpt:
      'In a market obsessed with ephemeral trends and paper-thin fabrics, we turned toward structural weight. Here is how dense organic cotton redefines everyday ease.',
    categoryId: 'JCAT-01',
    authorId: 'JAUTH-01',
    coverMediaId: 'JMED-01',
    ogMediaId: 'JMED-01',
    content: anatomyContent,
    contentSchemaVersion: 1,
    contentText:
      'Fabric weight is not merely a number on a spec sheet — it is the physics of how a garment behaves around the human body. What 500 GSM actually means Most commercial sweatshirts rely on 260 to 320 GSM fleece, heavily brushed on the inside with polyester fluff to simulate warmth. Within six washes, that synthetic fluff pills, mats and washes down the drain as microplastics. Long-staple organic cotton Low-speed circular knitting Unbrushed interior loops Close-up of heavyweight loopback cotton 500 GSM French terry at the loopback stage. Studio archive The result is apparel that feels like protective architecture — grounded, quiet and getting softer with every monsoon season.',
    readingTimeMinutes: 4,
    status: 'published',
    isFeatured: true,
    publishedAt: '2026-09-24T08:00:00.000Z',
    tagIds: ['JTAG-01', 'JTAG-03'],
    seoTitle: 'The Anatomy of 500 GSM Cotton',
    seoDescription:
      'How long-staple organic cotton, low-speed knitting and unbrushed loops create a 500 GSM garment built to endure.',
    noindex: false,
    version: 2,
    createdAt: '2026-09-16T10:00:00.000Z',
    updatedAt: '2026-09-24T08:00:00.000Z',
  },
  {
    id: 'JPOST-002',
    slug: 'zero-deadstock-print-on-demand',
    title: 'Printing on Demand: Eliminating the 92-Million-Ton Graveyard',
    subtitle: 'How intentional, just-in-time manufacturing creates better garments with zero surplus inventory.',
    excerpt:
      'Overproduction is the fundamental flaw of the apparel industry. We refuse to manufacture garments that have no designated wearer.',
    categoryId: 'JCAT-03',
    authorId: 'JAUTH-02',
    coverMediaId: 'JMED-04',
    ogMediaId: 'JMED-04',
    content: deadstockContent,
    contentSchemaVersion: 1,
    contentText:
      'Every single second, the equivalent of one garbage truck full of clothes is burned or buried in landfills. The root cause is simple: traditional fashion brands guess how many items you will buy six months in advance. Printing only after a real order The customer places an order The atelier selects an organic blank Water-based pigment ink is cured into the fabric Natural dye baths and clean textile tools Water-based pigment curing before the final press. Tiruppur atelier You wait a few days longer, but your garment leaves zero waste in its wake.',
    readingTimeMinutes: 6,
    status: 'published',
    isFeatured: false,
    publishedAt: '2026-09-12T08:00:00.000Z',
    tagIds: ['JTAG-02', 'JTAG-03'],
    seoTitle: 'Zero Deadstock Print on Demand',
    seoDescription:
      'Why The Unplugged Wear prints only after a real order exists and how just-in-time production removes surplus inventory.',
    noindex: false,
    version: 1,
    createdAt: '2026-09-05T10:00:00.000Z',
    updatedAt: '2026-09-12T08:00:00.000Z',
  },
  {
    id: 'JPOST-003',
    slug: 'unplugging-the-digital-noise',
    title: 'The Art of Being Unavailable',
    subtitle: 'Reclaiming personal sanctuary in an era of continuous digital pinging.',
    excerpt:
      'We designed The Unplugged Wear as an invitation to close your tabs, step outside and immerse yourself in the tactile present.',
    categoryId: 'JCAT-02',
    authorId: 'JAUTH-03',
    coverMediaId: 'JMED-05',
    ogMediaId: 'JMED-05',
    content: unavailableContent,
    contentSchemaVersion: 1,
    contentText:
      'Our phones vibrate with notifications from people we have never met about emergencies that do not exist. In response, slow living is not an aesthetic — it is a deliberate survival strategy. Restraint as kindness When we created the Monolith hoodie, we omitted drawstrings deliberately. Why? Because unnecessary cords dangle, tangle and demand adjustment. Quiet morning light over folded garments',
    readingTimeMinutes: 3,
    status: 'published',
    isFeatured: false,
    publishedAt: '2026-08-28T08:00:00.000Z',
    tagIds: ['JTAG-03'],
    seoTitle: 'The Art of Being Unavailable',
    seoDescription:
      'Slow living as a deliberate survival strategy and the design decisions that make quiet dressing easier.',
    noindex: false,
    version: 1,
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-28T08:00:00.000Z',
  },
  {
    id: 'JPOST-004',
    slug: 'tailoring-in-heavyweight-cotton',
    title: 'Tailoring in Heavyweight Cotton',
    subtitle: 'Pattern, proportion and the discipline of a calm silhouette.',
    excerpt:
      'Dense fabric changes every pattern decision. This is how we shape 500 GSM cotton without fighting the material.',
    categoryId: 'JCAT-04',
    authorId: 'JAUTH-01',
    coverMediaId: 'JMED-02',
    ogMediaId: 'JMED-02',
    content: tailoringContent,
    contentSchemaVersion: 1,
    contentText:
      'A garment can be perfectly cut and still feel wrong if the weight disagrees with the shape. Our pattern work begins with the fabric, not the drawing. Three fitting decisions Dropped shoulders for calm structure A straighter body seam to reduce visual noise Hems weighted enough to fall, not float Tailoring tools on a neutral workbench Pattern work before the first sample. If a garment asks for constant adjustment, it has not finished being designed.',
    readingTimeMinutes: 5,
    status: 'published',
    isFeatured: false,
    publishedAt: '2026-08-10T08:00:00.000Z',
    tagIds: ['JTAG-01', 'JTAG-04'],
    seoTitle: 'Tailoring in Heavyweight Cotton',
    seoDescription:
      'How pattern work, shoulder construction and weighted hems create calm structure in heavyweight organic cotton.',
    noindex: false,
    version: 1,
    createdAt: '2026-08-02T10:00:00.000Z',
    updatedAt: '2026-08-10T08:00:00.000Z',
  },
];
