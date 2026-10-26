// Pure blog model helpers — no React, no UI, no storage.
//
// The admin demo mirrors the final PostgreSQL shape (006-cms.sql): one
// primary category, one primary author, many tags, a versioned Tiptap/
// ProseMirror JSON document, immutable revision snapshots, retired slugs
// and an inline-media usage ledger. No HTML string is ever stored.

export type BlogStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface BlogAuthor {
  id: string;
  /** Optional staff link; guest authors have none. */
  userId?: string;
  name: string;
  slug: string;
  roleTitle?: string;
  bio?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogMediaAsset {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  credit?: string;
  usage: 'blog';
  uploadedBy?: string;
  uploadedAt: string;
}

export type BlogInlineMarkType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'link';

export interface BlogInlineMark {
  type: BlogInlineMarkType;
  attrs?: { href?: string };
}

export interface BlogInlineNode {
  type: 'text';
  text: string;
  marks?: BlogInlineMark[];
}

export interface BlogListItem {
  type: 'listItem';
  content: BlogInlineNode[];
}

export type BlogBlockNode =
  | { type: 'paragraph'; content?: BlogInlineNode[] }
  | { type: 'heading'; attrs: { level: 2 | 3 }; content?: BlogInlineNode[] }
  | { type: 'bulletList'; content?: BlogListItem[] }
  | { type: 'orderedList'; content?: BlogListItem[] }
  | { type: 'blockquote'; content?: BlogInlineNode[] }
  | {
      type: 'image';
      attrs: {
        mediaId: string;
        alt: string;
        caption?: string;
        credit?: string;
      };
    }
  | { type: 'horizontalRule' };

/** Ordered, versioned rich-text document. This is the only editable body. */
export type BlogContent = BlogBlockNode[];

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  categoryId?: string;
  authorId: string;
  coverMediaId?: string;
  ogMediaId?: string;
  content: BlogContent;
  contentSchemaVersion: 1;
  /** Derived on save from the validated document. */
  contentText: string;
  /** Derived on save from `contentText`. */
  readingTimeMinutes: number;
  status: BlogStatus;
  isFeatured: boolean;
  publishedAt?: string;
  tagIds: string[];
  inlineMediaIds: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  noindex: boolean;
  version: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogRevision {
  id: string;
  blogId: string;
  revisionNo: number;
  title: string;
  snapshot: Omit<
    BlogPost,
    'id' | 'createdAt' | 'updatedAt' | 'version' | 'inlineMediaIds'
  >;
  createdBy?: string;
  createdAt: string;
}

export interface BlogSlugHistoryEntry {
  slug: string;
  blogId: string;
  retiredAt: string;
}

export type BlogDraft = Omit<
  BlogPost,
  'contentText' | 'readingTimeMinutes' | 'inlineMediaIds' | 'version'
>;

export interface BlogValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof BlogDraft | 'content', string>>;
  draft: BlogDraft;
  contentText: string;
  readingTimeMinutes: number;
  inlineMediaIds: string[];
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ALLOWED_STATUS = new Set<BlogStatus>([
  'draft',
  'scheduled',
  'published',
  'archived',
]);

/** URL slug from a display title: lowercase, diacritics stripped, dashes. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug.trim());
}

export function uniqueBlogSlug(
  base: string,
  posts: Array<Pick<BlogPost, 'id' | 'slug'>>,
  excludeId?: string,
): string {
  const root = slugify(base) || 'journal-post';
  const taken = new Set(
    posts.filter((p) => p.id !== excludeId).map((p) => p.slug.toLowerCase())
  );
  if (!taken.has(root)) return root;
  let suffix = 2;
  while (taken.has(`${root}-${suffix}`)) suffix += 1;
  return `${root}-${suffix}`;
}

function inlineText(nodes: BlogInlineNode[] | undefined): string {
  if (!Array.isArray(nodes)) return '';
  return nodes
    .map((node) =>
      node.type === 'text' && typeof node.text === 'string' ? node.text : ''
    )
    .join('');
}

function listItemText(items: BlogListItem[] | undefined): string {
  if (!Array.isArray(items)) return '';
  return items.map((item) => inlineText(item.content)).join(' ');
}

/** Plain text for search/reading time. Image alt/caption are searchable too. */
export function extractBlogText(content: BlogContent): string {
  if (!Array.isArray(content)) return '';
  return content
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
        case 'blockquote':
          return inlineText(block.content);
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
}

export function blogWordCount(contentText: string): number {
  const text = contentText.trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

/** 200 words/minute; 0 for an empty document, 1 for any readable draft. */
export function readingTimeMinutes(contentText: string): number {
  const words = blogWordCount(contentText);
  if (words === 0) return 0;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatReadingTime(minutes: number): string {
  if (minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} min read`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr read` : `${hours} hr ${rest} min read`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeInlineNodes(value: unknown): BlogInlineNode[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const nodes: BlogInlineNode[] = [];
  for (const raw of value) {
    if (!isRecord(raw) || raw.type !== 'text' || typeof raw.text !== 'string') {
      continue;
    }
    const marks: BlogInlineMark[] = Array.isArray(raw.marks)
      ? raw.marks
          .filter(isRecord)
          .filter(
            (mark): mark is BlogInlineMark =>
              typeof mark.type === 'string' &&
              [
                'bold',
                'italic',
                'underline',
                'strikethrough',
                'link',
              ].includes(mark.type)
          )
          .map((mark) => ({
            type: mark.type as BlogInlineMarkType,
            ...(isRecord(mark.attrs) && typeof mark.attrs.href === 'string'
              ? { attrs: { href: mark.attrs.href } }
              : {}),
          }))
      : [];
    nodes.push({ type: 'text', text: raw.text, ...(marks.length ? { marks } : {}) });
  }
  return nodes.length > 0 ? nodes : undefined;
}

function normalizeListItems(value: unknown): BlogListItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items: BlogListItem[] = [];
  for (const raw of value) {
    if (!isRecord(raw) || raw.type !== 'listItem') continue;
    const content = normalizeInlineNodes(raw.content);
    if (content && content.length > 0) items.push({ type: 'listItem', content });
  }
  return items.length > 0 ? items : undefined;
}

/**
 * Tiptap JSON can carry unknown node shapes from extensions; the demo writer
 * accepts only the allowlisted document contract, so malformed/foreign nodes
 * are dropped rather than persisted.
 */
export function normalizeBlogContent(value: unknown): BlogContent {
  if (!Array.isArray(value)) return [];
  const content: BlogContent = [];
  for (const raw of value) {
    if (!isRecord(raw) || typeof raw.type !== 'string') continue;
    switch (raw.type) {
      case 'paragraph':
      case 'blockquote': {
        const nodes = normalizeInlineNodes(raw.content);
        content.push(
          (raw.type === 'paragraph'
            ? { type: 'paragraph', ...(nodes ? { content: nodes } : {}) }
            : { type: 'blockquote', ...(nodes ? { content: nodes } : {}) }) as BlogBlockNode
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
          (raw.type === 'bulletList'
            ? { type: 'bulletList', ...(items ? { content: items } : {}) }
            : { type: 'orderedList', ...(items ? { content: items } : {}) }) as BlogBlockNode
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
            ...(typeof attrs.caption === 'string' && attrs.caption.trim()
              ? { caption: attrs.caption.trim() }
              : {}),
            ...(typeof attrs.credit === 'string' && attrs.credit.trim()
              ? { credit: attrs.credit.trim() }
              : {}),
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
}

export function extractInlineMediaIds(content: BlogContent): string[] {
  const ids = content
    .filter((block): block is Extract<BlogBlockNode, { type: 'image' }> => block.type === 'image')
    .map((block) => block.attrs.mediaId);
  return [...new Set(ids)];
}

function trimOrNull(value: string | undefined, max: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

/**
 * Single validation/dernormalization seam for the demo writer. The state
 * manager and the editor both call this, so form validation and persistence
 * can never drift.
 */
export function validateBlogDraft(
  input: BlogDraft,
  context: {
    mode: 'draft' | 'publish';
    posts: Array<Pick<BlogPost, 'id' | 'slug'>>;
    categories: BlogCategory[];
    authors: BlogAuthor[];
    tags: BlogTag[];
    media: BlogMediaAsset[];
  },
): BlogValidationResult {
  const errors: BlogValidationResult['errors'] = {};
  const title = input.title.trim();
  const slug = input.slug.trim();
  const content = normalizeBlogContent(input.content);
  const contentText = extractBlogText(content);
  const readingTime = readingTimeMinutes(contentText);
  const inlineMediaIds = extractInlineMediaIds(content);

  if (!title) errors.title = 'Title is required.';
  else if (title.length > 255) errors.title = 'Title must be 255 characters or fewer.';

  if (!slug) errors.slug = 'URL slug is required.';
  else if (!isValidSlug(slug)) errors.slug = 'Use lowercase letters, numbers and dashes.';
  else if (context.posts.some((p) => p.id !== input.id && p.slug.toLowerCase() === slug.toLowerCase()))
    errors.slug = 'This slug is already used by another post.';

  if (!input.categoryId) errors.categoryId = 'Category is required.';
  else if (!context.categories.some((c) => c.id === input.categoryId))
    errors.categoryId = 'Choose a category from the list.';

  if (!input.authorId) errors.authorId = 'Author is required.';
  else if (!context.authors.some((a) => a.id === input.authorId))
    errors.authorId = 'Choose an author from the list.';

  if (input.excerpt && input.excerpt.trim().length > 500)
    errors.excerpt = 'Excerpt must be 500 characters or fewer.';

  if (input.coverMediaId && !context.media.some((m) => m.id === input.coverMediaId))
    errors.coverMediaId = 'Choose a cover image from the media library.';
  if (input.ogMediaId && !context.media.some((m) => m.id === input.ogMediaId))
    errors.ogMediaId = 'Choose an Open Graph image from the media library.';

  const unknownTagIds = input.tagIds.filter((id) => !context.tags.some((t) => t.id === id));
  if (unknownTagIds.length > 0) errors.tagIds = 'One or more tags no longer exist.';

  if (input.coverMediaId && input.ogMediaId && input.coverMediaId === input.ogMediaId)
    errors.ogMediaId = 'Open Graph image should differ from the cover.';

  if (input.contentSchemaVersion !== 1) errors.contentSchemaVersion = 'Unsupported content schema.';

  if (!ALLOWED_STATUS.has(input.status))
    errors.status = 'Choose draft, scheduled, published or archived.';
  if ((input.status === 'scheduled' || input.status === 'published') && !input.publishedAt)
    errors.publishedAt =
      input.status === 'scheduled'
        ? 'Choose a future publish date and time.'
        : 'Published posts require a publish date.';
  if (input.status === 'scheduled' && input.publishedAt) {
    const date = new Date(input.publishedAt);
    if (Number.isNaN(date.getTime())) errors.publishedAt = 'Enter a valid date and time.';
    else if (date.getTime() <= Date.now())
      errors.publishedAt = 'Scheduled posts must be in the future.';
  }

  if (input.seoDescription && input.seoDescription.trim().length > 320)
    errors.seoDescription = 'Meta description must be 320 characters or fewer.';

  if (input.canonicalUrl) {
    try {
      const url = new URL(input.canonicalUrl, 'https://theunpluggedwear.com');
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('bad protocol');
    } catch {
      errors.canonicalUrl = 'Enter an absolute https URL or leave this blank.';
    }
  }

  if (context.mode === 'publish') {
    if (content.length === 0) errors.content = 'Publishing requires article content.';
    if (contentText.trim().length < 80)
      errors.content = 'Article content is too short to publish.';
    if (inlineMediaIds.some((id) => !context.media.some((m) => m.id === id)))
      errors.content = 'One or more images are missing from the media library.';
    if (input.coverMediaId === undefined)
      errors.coverMediaId = 'A cover image is required to publish.';
  }

  const draft: BlogDraft = {
    ...input,
    title,
    slug,
    subtitle: trimOrNull(input.subtitle, 255),
    excerpt: trimOrNull(input.excerpt, 500),
    seoTitle: trimOrNull(input.seoTitle, 255),
    seoDescription: trimOrNull(input.seoDescription, 320),
    canonicalUrl: trimOrNull(input.canonicalUrl, 2048),
    content,
    tagIds: [...new Set(input.tagIds)],
  };

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    draft,
    contentText,
    readingTimeMinutes: readingTime,
    inlineMediaIds,
  };
}

export function nextBlogId(posts: Array<Pick<BlogPost, 'id'>>): string {
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
}

export function nextRevisionNo(revisions: BlogRevision[], blogId: string): number {
  return (
    revisions.reduce((max, revision) => {
      if (revision.blogId !== blogId) return max;
      return Math.max(max, revision.revisionNo);
    }, 0) + 1
  );
}

export function blogStatusBadgeVariant(
  status: BlogStatus,
): 'success' | 'info' | 'warning' | 'neutral' {
  switch (status) {
    case 'published':
      return 'success';
    case 'scheduled':
      return 'info';
    case 'archived':
      return 'neutral';
    case 'draft':
    default:
      return 'warning';
  }
}
