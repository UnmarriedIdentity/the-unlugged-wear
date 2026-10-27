// Pure storefront blog model — no React, no UI, no storage.
//
// This mirrors the normalized editorial schema: one primary category, one
// primary author, many tags, a versioned ProseMirror/Tiptap-compatible JSON
// document and derived reading time. No HTML string is ever stored or
// rendered with dangerouslySetInnerHTML.

export type JournalStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface JournalCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface JournalAuthor {
  id: string;
  name: string;
  slug: string;
  roleTitle?: string;
  bio?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface JournalTag {
  id: string;
  name: string;
  slug: string;
}

export interface JournalMediaAsset {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  credit?: string;
  usage: 'blog';
}

export type JournalInlineMarkType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'link';

export interface JournalInlineMark {
  type: JournalInlineMarkType;
  attrs?: { href?: string };
}

export interface JournalInlineNode {
  type: 'text';
  text: string;
  marks?: JournalInlineMark[];
}

export interface JournalListItem {
  type: 'listItem';
  content: JournalInlineNode[];
}

export type JournalBlockNode =
  | { type: 'paragraph'; content?: JournalInlineNode[] }
  | { type: 'heading'; attrs: { level: 2 | 3 }; content?: JournalInlineNode[] }
  | { type: 'bulletList'; content?: JournalListItem[] }
  | { type: 'orderedList'; content?: JournalListItem[] }
  | { type: 'blockquote'; content?: JournalInlineNode[] }
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

/** Ordered, versioned rich-text document. This is the only body source. */
export type JournalContent = JournalBlockNode[];

export interface JournalPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  categoryId?: string;
  authorId: string;
  coverMediaId?: string;
  ogMediaId?: string;
  content: JournalContent;
  contentSchemaVersion: 1;
  /** Derived on save from the validated document. */
  contentText: string;
  /** Derived on save from `contentText`. */
  readingTimeMinutes: number;
  status: JournalStatus;
  isFeatured: boolean;
  publishedAt?: string;
  tagIds: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  noindex: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export function formatReadingTime(minutes: number): string {
  if (minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} min read`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr read` : `${hours} hr ${rest} min read`;
}

export function formatJournalDate(iso: string | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Only published, live posts are visible on the storefront. */
export function isPublishedJournalPost(post: JournalPost): boolean {
  if (post.status !== 'published' || !post.publishedAt) return false;
  const date = new Date(post.publishedAt);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
}

/** Same category first, then shared tags; never includes the current post. */
export function relatedJournalPosts(
  current: JournalPost,
  posts: JournalPost[],
  limit = 3,
): JournalPost[] {
  const candidates = posts
    .filter((post) => post.id !== current.id && isPublishedJournalPost(post))
    .map((post) => {
      const sharedTags = post.tagIds.filter((tagId) => current.tagIds.includes(tagId));
      return { post, sharedTags };
    })
    .sort((a, b) => {
      if (a.post.categoryId === current.categoryId && b.post.categoryId !== current.categoryId) return -1;
      if (b.post.categoryId === current.categoryId && a.post.categoryId !== current.categoryId) return 1;
      return b.sharedTags.length - a.sharedTags.length;
    });
  return candidates.slice(0, limit).map((entry) => entry.post);
}
