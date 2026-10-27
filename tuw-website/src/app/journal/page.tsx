import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import JournalFilters, { type JournalSort } from '@/components/blog/JournalFilters';
import JournalPostCard from '@/components/blog/JournalPostCard';
import {
  isPublishedJournalPost,
  type JournalPost,
} from '@/lib/blog';
import {
  JOURNAL_AUTHORS,
  JOURNAL_CATEGORIES,
  JOURNAL_MEDIA,
  JOURNAL_POSTS,
  JOURNAL_TAGS,
} from '@/mocks/blog';

export const metadata: Metadata = {
  title: 'Journal | The Unplugged Wear',
  description:
    'Essays on heavyweight organic cotton, slow living, on-demand production and the quiet architecture of everyday garments.',
};

interface JournalPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const PAGE_SIZE = 6;

function firstValue(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function buildJournalHref(
  overrides: Partial<Record<'category' | 'author' | 'tag' | 'q' | 'sort' | 'page', string>>
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(overrides)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/journal?${query}` : '/journal';
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const params = await searchParams;
  const activeCategory = firstValue(params.category);
  const activeAuthor = firstValue(params.author);
  const activeTag = firstValue(params.tag);
  const activeQuery = firstValue(params.q);
  const rawSort = firstValue(params.sort);
  const activeSort: JournalSort =
    rawSort === 'oldest' || rawSort === 'featured' ? rawSort : 'newest';
  const requestedPage = Number.parseInt(firstValue(params.page) ?? '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const categoryBySlug = new Map(JOURNAL_CATEGORIES.map((category) => [category.slug, category]));
  const categoryById = new Map(JOURNAL_CATEGORIES.map((category) => [category.id, category]));
  const authorBySlug = new Map(JOURNAL_AUTHORS.map((author) => [author.slug, author]));
  const authorById = new Map(JOURNAL_AUTHORS.map((author) => [author.id, author]));
  const tagBySlug = new Map(JOURNAL_TAGS.map((tag) => [tag.slug, tag]));
  const tagById = new Map(JOURNAL_TAGS.map((tag) => [tag.id, tag]));
  const mediaById = new Map(JOURNAL_MEDIA.map((asset) => [asset.id, asset]));

  const category = activeCategory ? categoryBySlug.get(activeCategory) : undefined;
  const author = activeAuthor ? authorBySlug.get(activeAuthor) : undefined;
  const tag = activeTag ? tagBySlug.get(activeTag) : undefined;
  const normalizedQuery = activeQuery?.toLowerCase();

  const filteredPosts = JOURNAL_POSTS.filter(isPublishedJournalPost).filter((post) => {
    if (category && post.categoryId !== category.id) return false;
    if (author && post.authorId !== author.id) return false;
    if (tag && !post.tagIds.includes(tag.id)) return false;
    if (!normalizedQuery) return true;

    const categoryName = post.categoryId ? categoryById.get(post.categoryId)?.name ?? '' : '';
    const authorName = authorById.get(post.authorId)?.name ?? '';
    const tagNames = post.tagIds.map((tagId) => tagById.get(tagId)?.name ?? '').join(' ');
    const haystack = [
      post.title,
      post.subtitle,
      post.excerpt,
      post.contentText,
      categoryName,
      authorName,
      tagNames,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  const sortedPosts: JournalPost[] = [...filteredPosts].sort((a, b) => {
    if (activeSort === 'featured') {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    }
    const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return activeSort === 'oldest' ? aDate - bDate : bDate - aDate;
  });

  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visiblePosts = sortedPosts.slice(startIndex, startIndex + PAGE_SIZE);
  const hasFilters = Boolean(activeCategory || activeAuthor || activeTag || activeQuery);
  const activeFilterLabel = [category?.name, author?.name, tag ? `#${tag.name}` : undefined]
    .filter(Boolean)
    .join(' · ');

  const pageHref = (nextPage: number) =>
    buildJournalHref({
      category: activeCategory,
      author: activeAuthor,
      tag: activeTag,
      q: activeQuery,
      sort: activeSort !== 'newest' ? activeSort : undefined,
      page: nextPage > 1 ? String(nextPage) : undefined,
    });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#1A1A1A]">
      <Header />

      <main id="main-content" tabIndex={-1} className="flex-1">
        <section className="border-b border-[#E2DDCF] bg-[#F4F1EA]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Journal' }]} />
            <div className="mt-5 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6D32]">
                Notes on making &amp; living
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                The Journal
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#5D6772] sm:text-base">
                Essays on cotton, craft, on-demand production and the quiet rituals that make
                a wardrobe feel considered rather than consumed.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <JournalFilters
            categories={JOURNAL_CATEGORIES.filter((entry) => entry.isActive)}
            authors={JOURNAL_AUTHORS.filter((entry) => entry.isActive)}
            tags={JOURNAL_TAGS}
            activeCategory={activeCategory}
            activeAuthor={activeAuthor}
            activeTag={activeTag}
            activeQuery={activeQuery}
            activeSort={activeSort}
          />

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5A5A5A]">
                {sortedPosts.length} {sortedPosts.length === 1 ? 'essay' : 'essays'}
              </h2>
              {hasFilters && (
                <p className="mt-1 text-sm text-[#5D6772]">
                  Filtered by {activeFilterLabel || 'search'}
                  {activeQuery ? ` for “${activeQuery}”` : ''}.
                </p>
              )}
            </div>
            {hasFilters && (
              <Link
                href="/journal"
                className="text-sm font-medium text-[#8A6D32] underline decoration-[#C8A96A] underline-offset-4 hover:text-[#1A1A1A]"
              >
                Clear all filters
              </Link>
            )}
          </div>

          {visiblePosts.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visiblePosts.map((post, index) => {
                const postCategory = post.categoryId ? categoryById.get(post.categoryId) : undefined;
                const postAuthor = authorById.get(post.authorId);
                const postTags = post.tagIds
                  .map((tagId) => tagById.get(tagId))
                  .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
                const cover = post.coverMediaId ? mediaById.get(post.coverMediaId) : undefined;

                return (
                  <JournalPostCard
                    key={post.id}
                    post={post}
                    category={postCategory}
                    author={postAuthor}
                    tags={postTags}
                    mediaUrl={cover?.url}
                    priority={index < 2}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-[#E2DDCF] bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F1EA] text-[#8A6D32]">
                <SearchX size={24} />
              </div>
              <h2 className="mt-4 text-lg font-semibold">No essays match those filters</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#5D6772]">
                Try a broader search, another category, or clear the filters to browse the
                full journal.
              </p>
              <Link
                href="/journal"
                className="mt-6 inline-flex h-11 items-center rounded-lg bg-[#111111] px-5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-black"
              >
                Clear filters
              </Link>
            </div>
          )}

          {totalPages > 1 && (
            <nav
              className="mt-10 flex items-center justify-center gap-2"
              aria-label="Journal pagination"
            >
              {currentPage > 1 ? (
                <Link
                  href={pageHref(currentPage - 1)}
                  aria-label="Previous page"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2DDCF] bg-white text-[#1A1A1A] transition-colors hover:bg-[#F4F1EA]"
                >
                  <ChevronLeft size={16} />
                </Link>
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2DDCF] bg-white text-[#1A1A1A] opacity-40"
                >
                  <ChevronLeft size={16} />
                </span>
              )}

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
                const isCurrent = pageNumber === currentPage;
                return (
                  <Link
                    key={pageNumber}
                    href={pageHref(pageNumber)}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-[#1A1A1A] text-white'
                        : 'border border-[#E2DDCF] bg-white text-[#1A1A1A] hover:bg-[#F4F1EA]'
                    }`}
                  >
                    {pageNumber}
                  </Link>
                );
              })}

              {currentPage < totalPages ? (
                <Link
                  href={pageHref(currentPage + 1)}
                  aria-label="Next page"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2DDCF] bg-white text-[#1A1A1A] transition-colors hover:bg-[#F4F1EA]"
                >
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2DDCF] bg-white text-[#1A1A1A] opacity-40"
                >
                  <ChevronRight size={16} />
                </span>
              )}
            </nav>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
