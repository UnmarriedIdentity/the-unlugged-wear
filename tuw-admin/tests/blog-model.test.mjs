import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------
// Mirrors of lib/blog.ts (self-contained per this project's test
// convention): JSON content is the single editable source; plain
// text, reading time and inline media ids are derived, never stored
// as independently editable fields.
// ---------------------------------------------------------------

const slugify = (input) =>
  input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isValidSlug = (slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim());

const uniqueBlogSlug = (base, posts, excludeId) => {
  const root = slugify(base) || 'journal-post';
  const taken = new Set(posts.filter((p) => p.id !== excludeId).map((p) => p.slug.toLowerCase()));
  if (!taken.has(root)) return root;
  let suffix = 2;
  while (taken.has(`${root}-${suffix}`)) suffix += 1;
  return `${root}-${suffix}`;
};

const inlineText = (nodes) => {
  if (!Array.isArray(nodes)) return '';
  return nodes
    .map((node) => (node.type === 'text' && typeof node.text === 'string' ? node.text : ''))
    .join('');
};

const listItemText = (items) => {
  if (!Array.isArray(items)) return '';
  return items.map((item) => inlineText(item.content)).join(' ');
};

const extractBlogText = (content) => {
  if (!Array.isArray(content)) return '';
  return content
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
        case 'blockquote':
        case 'heading':
          return inlineText(block.content);
        case 'bulletList':
        case 'orderedList':
          return listItemText(block.content);
        case 'image':
          return [block.attrs.alt, block.attrs.caption, block.attrs.credit]
            .filter(Boolean)
            .join(' ');
        case 'horizontalRule':
          return '';
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const blogWordCount = (contentText) => {
  const text = contentText.trim();
  return text ? text.split(/\s+/).length : 0;
};

const readingTimeMinutes = (contentText) => {
  const words = blogWordCount(contentText);
  return words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));
};

const isRecord = (value) => typeof value === 'object' && value !== null;

const normalizeInlineNodes = (value) => {
  if (!Array.isArray(value)) return undefined;
  const nodes = [];
  for (const raw of value) {
    if (!isRecord(raw) || raw.type !== 'text' || typeof raw.text !== 'string') continue;
    const marks = Array.isArray(raw.marks)
      ? raw.marks
          .filter(isRecord)
          .filter((mark) => typeof mark.type === 'string')
          .map((mark) => ({ type: mark.type }))
      : [];
    nodes.push({ type: 'text', text: raw.text, ...(marks.length ? { marks } : {}) });
  }
  return nodes.length > 0 ? nodes : undefined;
};

const normalizeListItems = (value) => {
  if (!Array.isArray(value)) return undefined;
  const items = [];
  for (const raw of value) {
    if (!isRecord(raw) || raw.type !== 'listItem') continue;
    const content = normalizeInlineNodes(raw.content);
    if (content && content.length > 0) items.push({ type: 'listItem', content });
  }
  return items.length > 0 ? items : undefined;
};

const normalizeBlogContent = (value) => {
  if (!Array.isArray(value)) return [];
  const content = [];
  for (const raw of value) {
    if (!isRecord(raw) || typeof raw.type !== 'string') continue;
    switch (raw.type) {
      case 'paragraph':
      case 'blockquote': {
        const nodes = normalizeInlineNodes(raw.content);
        content.push(
          raw.type === 'paragraph'
            ? { type: 'paragraph', ...(nodes ? { content: nodes } : {}) }
            : { type: 'blockquote', ...(nodes ? { content: nodes } : {}) }
        );
        break;
      }
      case 'heading': {
        const attrs = isRecord(raw.attrs) ? raw.attrs : {};
        const level = attrs.level === 2 || attrs.level === 3 ? attrs.level : 2;
        const nodes = normalizeInlineNodes(raw.content);
        content.push({ type: 'heading', attrs: { level }, ...(nodes ? { content: nodes } : {}) });
        break;
      }
      case 'bulletList':
      case 'orderedList': {
        const items = normalizeListItems(raw.content);
        content.push(
          raw.type === 'bulletList'
            ? { type: 'bulletList', ...(items ? { content: items } : {}) }
            : { type: 'orderedList', ...(items ? { content: items } : {}) }
        );
        break;
      }
      case 'image': {
        const attrs = isRecord(raw.attrs) ? raw.attrs : {};
        const mediaId = typeof attrs.mediaId === 'string' ? attrs.mediaId : '';
        const alt = typeof attrs.alt === 'string' ? attrs.alt.trim() : '';
        if (!mediaId || !alt) continue;
        content.push({
          type: 'image',
          attrs: {
            mediaId,
            alt,
            ...(typeof attrs.caption === 'string' && attrs.caption.trim() ? { caption: attrs.caption.trim() } : {}),
          },
        });
        break;
      }
      case 'horizontalRule':
        content.push({ type: 'horizontalRule' });
        break;
      default:
        break;
    }
  }
  return content;
};

const extractInlineMediaIds = (content) => [
  ...new Set(
    content
      .filter((block) => block.type === 'image')
      .map((block) => block.attrs.mediaId)
  ),
];

const nextBlogId = (posts) => {
  let next =
    posts.reduce((max, post) => {
      const match = /^BLOG-(\d+)$/.exec(post.id);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0) + 1;
  let id = `BLOG-${String(next).padStart(3, '0')}`;
  while (posts.some((post) => post.id === id)) {
    next += 1;
    id = `BLOG-${String(next).padStart(3, '0')}`;
  }
  return id;
};

describe('Blog Model', () => {
  describe('slugs', () => {
    test('turns editorial titles into URL slugs', () => {
      assert.equal(slugify('The Weight of Fabric'), 'the-weight-of-fabric');
      assert.equal(slugify('Autumn/Winter 26 — Echoes'), 'autumn-winter-26-echoes');
    });

    test('rejects malformed slugs', () => {
      for (const slug of ['', '-lead', 'lead-', 'A B', 'under_score']) {
        assert.equal(isValidSlug(slug), false, `expected "${slug}" to be invalid`);
      }
    });

    test('uniquifies a slug against posts and ignores the edited post', () => {
      const posts = [
        { id: 'BLOG-001', slug: 'the-weight-of-fabric' },
        { id: 'BLOG-002', slug: 'the-weight-of-fabric-2' },
      ];
      assert.equal(uniqueBlogSlug('The Weight of Fabric', posts), 'the-weight-of-fabric-3');
      assert.equal(uniqueBlogSlug('The Weight of Fabric', posts, 'BLOG-001'), 'the-weight-of-fabric');
    });
  });

  describe('derived content text + reading time', () => {
    const document = [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'A garment’s weight is ' },
          { type: 'text', text: 'not decoration', marks: [{ type: 'italic' }] },
          { type: 'text', text: '.' },
        ],
      },
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [{ type: 'text', text: 'Drape changes first', marks: [{ type: 'bold' }] }] },
          { type: 'listItem', content: [{ type: 'text', text: 'Recovery follows' }] },
        ],
      },
      {
        type: 'image',
        attrs: {
          mediaId: 'BMED-01',
          alt: 'Close-up of loopback cotton',
          caption: '500 GSM',
        },
      },
      { type: 'horizontalRule' },
    ];

    test('extracts searchable text from every supported block', () => {
      assert.equal(
        extractBlogText(document),
        'A garment’s weight is not decoration. Drape changes first Recovery follows Close-up of loopback cotton 500 GSM'
      );
    });

    test('word count is derived, not stored twice', () => {
      assert.equal(blogWordCount('one two three'), 3);
      assert.equal(blogWordCount('   '), 0);
    });

    test('reading time is 0 only for empty documents', () => {
      assert.equal(readingTimeMinutes(''), 0);
      assert.equal(readingTimeMinutes('one two three'), 1);
    });
  });

  describe('normalization', () => {
    test('drops foreign nodes and malformed images without failing', () => {
      const raw = [
        { type: 'paragraph', content: [{ type: 'text', text: 'Keep this' }] },
        { type: 'unknownNode', content: [] },
        { type: 'image', attrs: { mediaId: '', alt: 'No id' } },
        {
          type: 'image',
          attrs: { mediaId: 'BMED-01', alt: '  Kept  ', caption: '  Kept caption  ' },
        },
      ];
      const normalized = normalizeBlogContent(raw);
      assert.deepEqual(
        normalized.map((block) => block.type),
        ['paragraph', 'image']
      );
      assert.equal(normalized[1].attrs.alt, 'Kept');
      assert.equal(normalized[1].attrs.caption, 'Kept caption');
    });

    test('returns an array for non-array input', () => {
      assert.deepEqual(normalizeBlogContent(undefined), []);
      assert.deepEqual(normalizeBlogContent({ type: 'paragraph' }), []);
    });

    test('extracts deduped inline media ids', () => {
      const content = normalizeBlogContent([
        { type: 'image', attrs: { mediaId: 'BMED-01', alt: 'A' } },
        { type: 'image', attrs: { mediaId: 'BMED-01', alt: 'A again' } },
        { type: 'image', attrs: { mediaId: 'BMED-02', alt: 'B' } },
      ]);
      assert.deepEqual(extractInlineMediaIds(content), ['BMED-01', 'BMED-02']);
    });
  });

  describe('ids', () => {
    test('starts at BLOG-001', () => {
      assert.equal(nextBlogId([]), 'BLOG-001');
    });

    test('increments past the highest numeric id', () => {
      assert.equal(nextBlogId([{ id: 'BLOG-004' }, { id: 'BLOG-002' }]), 'BLOG-005');
    });

    test('avoids collision with non-numeric or duplicate ids', () => {
      assert.equal(nextBlogId([{ id: 'LEGACY' }, { id: 'BLOG-006' }]), 'BLOG-007');
    });
  });
});
