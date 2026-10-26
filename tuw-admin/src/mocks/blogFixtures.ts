// Deterministic blog fixtures — demo-state seed only.
//
// These mirror the normalized schema: one category per post, one author,
// many tags, JSON content, immutable revisions and slug history. The data
// is intentionally small and editorial, with @example.com identities and
// Indiranagar addresses per the project demo rules.

import type {
  BlogAuthor,
  BlogCategory,
  BlogMediaAsset,
  BlogPost,
  BlogRevision,
  BlogSlugHistoryEntry,
  BlogTag,
} from '@/lib/blog';

export const initialBlogCategories: BlogCategory[] = [
  {
    id: 'BCAT-01',
    name: 'Craft',
    slug: 'craft',
    description: 'Material choices, construction details and making notes.',
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'BCAT-02',
    name: 'Slow Living',
    slug: 'slow-living',
    description: 'Rituals, quiet dressing and intentional wardrobes.',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'BCAT-03',
    name: 'Sustainability',
    slug: 'sustainability',
    description: 'Materials, on-demand production and honest lifecycle.',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'BCAT-04',
    name: 'Design',
    slug: 'design',
    description: 'Form, proportion and architectural garment thinking.',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'BCAT-05',
    name: 'Culture',
    slug: 'culture',
    description: 'People, places and the cultural side of dressing well.',
    sortOrder: 4,
    isActive: true,
  },
];

export const initialBlogAuthors: BlogAuthor[] = [
  {
    id: 'BAUT-01',
    userId: 'MEM-01',
    name: 'Kavita Menon',
    slug: 'kavita-menon',
    roleTitle: 'Textile Design Lead',
    bio: 'Leads fabric development and the studio’s material archive.',
    avatarUrl: 'https://i.pravatar.cc/120?img=47',
    isActive: true,
  },
  {
    id: 'BAUT-02',
    name: 'Elena Rostova',
    slug: 'elena-rostova',
    roleTitle: 'Editorial Director',
    bio: 'Writes about quiet tailoring and the architecture of garments.',
    avatarUrl: 'https://i.pravatar.cc/120?img=32',
    isActive: true,
  },
  {
    id: 'BAUT-03',
    name: 'Ronan Vance',
    slug: 'ronan-vance',
    roleTitle: 'Sustainability Writer',
    bio: 'Investigates on-demand production, water use and textile waste.',
    avatarUrl: 'https://i.pravatar.cc/120?img=15',
    isActive: true,
  },
];

export const initialBlogTags: BlogTag[] = [
  { id: 'BTAG-01', name: 'Lookbook', slug: 'lookbook' },
  { id: 'BTAG-02', name: 'Organic Cotton', slug: 'organic-cotton' },
  { id: 'BTAG-03', name: 'Print On Demand', slug: 'print-on-demand' },
  { id: 'BTAG-04', name: 'Behind The Scenes', slug: 'behind-the-scenes' },
  { id: 'BTAG-05', name: 'Slow Fashion', slug: 'slow-fashion' },
];

export const initialBlogMedia: BlogMediaAsset[] = [
  {
    id: 'BMED-01',
    url: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=1200&auto=format&fit=crop&q=80',
    alt: 'Close-up of heavyweight loopback cotton',
    caption: '500 GSM French terry at the loopback stage.',
    credit: 'Studio archive',
    usage: 'blog',
    uploadedBy: 'MEM-01',
    uploadedAt: '12 Apr 2026',
  },
  {
    id: 'BMED-02',
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&auto=format&fit=crop&q=80',
    alt: 'Tailoring tools on a neutral workbench',
    caption: 'Pattern work before the first sample.',
    usage: 'blog',
    uploadedBy: 'MEM-02',
    uploadedAt: '08 Apr 2026',
  },
  {
    id: 'BMED-03',
    url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&auto=format&fit=crop&q=80',
    alt: 'Minimal folded garments in warm daylight',
    usage: 'blog',
    uploadedBy: 'MEM-01',
    uploadedAt: '01 Apr 2026',
  },
];

export const initialBlogPosts: BlogPost[] = [
  {
    id: 'BLOG-001',
    slug: 'the-weight-of-fabric-why-280-gsm-changes-streetwear',
    title: 'The Weight of Fabric: Why 280 GSM Changes Streetwear',
    subtitle: 'An investigation into organic combed cotton density and structured drapery.',
    excerpt:
      'Fabric weight is not decoration. It changes how a garment holds line, absorbs wear and settles into daily life.',
    categoryId: 'BCAT-04',
    authorId: 'BAUT-02',
    coverMediaId: 'BMED-01',
    ogMediaId: 'BMED-01',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'A garment’s weight is the first thing you notice before you notice design. It determines drape, recovery, and how the body reads through the cloth.' },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Why density matters' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Dense combed cotton resists translucency and creates a calm, ' },
          { type: 'text', text: 'architectural', marks: [{ type: 'italic' }] },
          { type: 'text', text: ' silhouette. It also ages more slowly than a paper-thin jersey.' },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'text', text: 'Structured shoulders keep their line', marks: [{ type: 'bold' }] }],
          },
          { type: 'listItem', content: [{ type: 'text', text: 'Heavier loops resist pilling' }] },
          { type: 'listItem', content: [{ type: 'text', text: 'The garment feels present without stiffness' }] },
        ],
      },
      {
        type: 'image',
        attrs: {
          mediaId: 'BMED-01',
          alt: 'Close-up of heavyweight loopback cotton',
          caption: '500 GSM French terry at the loopback stage.',
          credit: 'Studio archive',
        },
      },
    ],
    contentSchemaVersion: 1,
    contentText:
      'A garment’s weight is the first thing you notice before you notice design. It determines drape, recovery, and how the body reads through the cloth. Why density matters Dense combed cotton resists translucency and creates a calm, architectural silhouette. It also ages more slowly than a paper-thin jersey. Structured shoulders keep their line Heavier loops resist pilling The garment feels present without stiffness Close-up of heavyweight loopback cotton 500 GSM French terry at the loopback stage. Studio archive',
    readingTimeMinutes: 1,
    status: 'published',
    isFeatured: true,
    publishedAt: '2026-04-12T09:30:00.000Z',
    tagIds: ['BTAG-02', 'BTAG-05'],
    inlineMediaIds: ['BMED-01'],
    seoTitle: 'Why 280 GSM Cotton Changes Streetwear',
    seoDescription:
      'How dense organic combed cotton changes drape, durability and the way heavyweight garments settle into daily wear.',
    noindex: false,
    version: 3,
    createdBy: 'MEM-02',
    updatedBy: 'MEM-02',
    createdAt: '2026-04-05T10:00:00.000Z',
    updatedAt: '2026-04-12T09:30:00.000Z',
  },
  {
    id: 'BLOG-002',
    slug: 'aw26-editorial-lookbook-echoes-in-silence',
    title: 'Autumn/Winter 26 Editorial Lookbook: Echoes in Silence',
    subtitle: 'Captured across brutalist concrete landscapes in Berlin.',
    excerpt:
      'Industrial minimalism, tonal textures and garments that sit quietly against concrete and cold air.',
    categoryId: 'BCAT-04',
    authorId: 'BAUT-01',
    coverMediaId: 'BMED-03',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'We shot this series without a single call to action. The clothes were asked to hold space rather than shout.' },
        ],
      },
      {
        type: 'orderedList',
        content: [
          { type: 'listItem', content: [{ type: 'text', text: 'Choose one material note and repeat it' }] },
          { type: 'listItem', content: [{ type: 'text', text: 'Let negative space do the styling' }] },
          { type: 'listItem', content: [{ type: 'text', text: 'Cut away anything that performs' }] },
        ],
      },
      { type: 'horizontalRule' },
      {
        type: 'blockquote',
        content: [
          { type: 'text', text: 'Quiet dressing is not minimalism for its own sake — it is attention made wearable.', marks: [{ type: 'italic' }] },
        ],
      },
    ],
    contentSchemaVersion: 1,
    contentText:
      'We shot this series without a single call to action. The clothes were asked to hold space rather than shout. Choose one material note and repeat it Let negative space do the styling Cut away anything that performs Quiet dressing is not minimalism for its own sake — it is attention made wearable.',
    readingTimeMinutes: 1,
    status: 'published',
    isFeatured: false,
    publishedAt: '2026-04-08T14:00:00.000Z',
    tagIds: ['BTAG-01'],
    inlineMediaIds: [],
    noindex: false,
    version: 2,
    createdBy: 'MEM-01',
    updatedBy: 'MEM-01',
    createdAt: '2026-04-02T11:20:00.000Z',
    updatedAt: '2026-04-08T14:00:00.000Z',
  },
  {
    id: 'BLOG-003',
    slug: 'zero-waste-waterless-dyeing',
    title: 'Zero-Waste Waterless Dyeing: Our Sustainable Transition',
    subtitle: 'How on-demand production reduces runoff and dead inventory.',
    excerpt:
      'Print-on-demand is not a trend at TUW — it is the mechanism that keeps unsold garments out of landfill.',
    categoryId: 'BCAT-03',
    authorId: 'BAUT-03',
    coverMediaId: 'BMED-02',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'We produce only after an order exists. That single constraint changes everything upstream: fabric buying, dyeing runs, warehouse space and end-of-season waste.' },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'What we are not claiming' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'We are not claiming zero impact. We are claiming a lower-waste path that is measurable and improvable.' },
        ],
      },
    ],
    contentSchemaVersion: 1,
    contentText:
      'We produce only after an order exists. That single constraint changes everything upstream: fabric buying, dyeing runs, warehouse space and end-of-season waste. What we are not claiming We are not claiming zero impact. We are claiming a lower-waste path that is measurable and improvable.',
    readingTimeMinutes: 1,
    status: 'scheduled',
    isFeatured: false,
    publishedAt: '2026-11-04T08:00:00.000Z',
    tagIds: ['BTAG-03', 'BTAG-05'],
    inlineMediaIds: [],
    noindex: false,
    version: 1,
    createdBy: 'MEM-03',
    updatedBy: 'MEM-03',
    createdAt: '2026-04-01T09:15:00.000Z',
    updatedAt: '2026-04-01T09:15:00.000Z',
  },
  {
    id: 'BLOG-004',
    slug: 'soundwave-resonance-typography',
    title: 'Soundwave Resonance: The Typography of Acoustics',
    subtitle: 'Visualizing analog vinyl waveforms as functional vector artwork.',
    excerpt:
      'A studio note on translating analog sound into a printable graphic language for limited-run pieces.',
    categoryId: 'BCAT-05',
    authorId: 'BAUT-02',
    coverMediaId: 'BMED-02',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'This piece started as a wavelength printed from a worn jazz recording, then reduced until it read as typography instead of noise.' },
        ],
      },
    ],
    contentSchemaVersion: 1,
    contentText:
      'This piece started as a wavelength printed from a worn jazz recording, then reduced until it read as typography instead of noise.',
    readingTimeMinutes: 1,
    status: 'draft',
    isFeatured: false,
    tagIds: ['BTAG-04'],
    inlineMediaIds: [],
    noindex: false,
    version: 1,
    createdBy: 'MEM-02',
    updatedBy: 'MEM-02',
    createdAt: '2026-03-28T16:40:00.000Z',
    updatedAt: '2026-03-28T16:40:00.000Z',
  },
];

export const initialBlogRevisions: BlogRevision[] = [
  {
    id: 'BREV-001',
    blogId: 'BLOG-001',
    revisionNo: 1,
    title: 'The Weight of Fabric: Why 280 GSM Changes Streetwear',
    snapshot: {
      slug: 'the-weight-of-fabric-why-280-gsm-changes-streetwear',
      title: 'The Weight of Fabric: Why 280 GSM Changes Streetwear',
      subtitle: 'An investigation into organic combed cotton density and structured drapery.',
      excerpt:
        'Fabric weight is not decoration. It changes how a garment holds line, absorbs wear and settles into daily life.',
      categoryId: 'BCAT-04',
      authorId: 'BAUT-02',
      coverMediaId: 'BMED-01',
      ogMediaId: 'BMED-01',
      content: initialBlogPosts[0].content,
      contentSchemaVersion: 1,
      contentText: initialBlogPosts[0].contentText,
      readingTimeMinutes: 1,
      status: 'draft',
      isFeatured: false,
      publishedAt: undefined,
      tagIds: ['BTAG-02'],
      seoTitle: undefined,
      seoDescription: undefined,
      canonicalUrl: undefined,
      noindex: false,
      createdBy: 'MEM-02',
      updatedBy: 'MEM-02',
    },
    createdBy: 'MEM-02',
    createdAt: '2026-04-05T10:00:00.000Z',
  },
  {
    id: 'BREV-002',
    blogId: 'BLOG-001',
    revisionNo: 2,
    title: 'The Weight of Fabric: Why 280 GSM Changes Streetwear',
    snapshot: {
      slug: 'the-weight-of-fabric-why-280-gsm-changes-streetwear',
      title: 'The Weight of Fabric: Why 280 GSM Changes Streetwear',
      subtitle: 'An investigation into organic combed cotton density and structured drapery.',
      excerpt:
        'Fabric weight is not decoration. It changes how a garment holds line, absorbs wear and settles into daily life.',
      categoryId: 'BCAT-04',
      authorId: 'BAUT-02',
      coverMediaId: 'BMED-01',
      ogMediaId: 'BMED-01',
      content: initialBlogPosts[0].content,
      contentSchemaVersion: 1,
      contentText: initialBlogPosts[0].contentText,
      readingTimeMinutes: 1,
      status: 'published',
      isFeatured: true,
      publishedAt: '2026-04-12T09:30:00.000Z',
      tagIds: ['BTAG-02', 'BTAG-05'],
      seoTitle: 'Why 280 GSM Cotton Changes Streetwear',
      seoDescription:
        'How dense organic combed cotton changes drape, durability and the way heavyweight garments settle into daily wear.',
      canonicalUrl: undefined,
      noindex: false,
      createdBy: 'MEM-02',
      updatedBy: 'MEM-02',
    },
    createdBy: 'MEM-02',
    createdAt: '2026-04-12T09:30:00.000Z',
  },
];

export const initialBlogSlugHistory: BlogSlugHistoryEntry[] = [
  {
    slug: 'why-280-gsm-changes-streetwear',
    blogId: 'BLOG-001',
    retiredAt: '2026-04-12T09:30:00.000Z',
  },
];
