import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import JournalRichText from '@/components/blog/JournalRichText';
import JournalPostCard from '@/components/blog/JournalPostCard';
import {
  formatJournalDate,
  formatReadingTime,
  isPublishedJournalPost,
  relatedJournalPosts,
  type JournalPost,
} from '@/lib/blog';
import {
  JOURNAL_AUTHORS,
  JOURNAL_CATEGORIES,
  JOURNAL_MEDIA,
  JOURNAL_POSTS,
  JOURNAL_TAGS,
} from '@/mocks/blog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theunpluggedwear.com';

interface JournalArticlePageProps {
  params: Promise<{ slug: string }>;
}

function findPublishedPost(slug: string): JournalPost | undefined {
  return JOURNAL_POSTS.find((post) => post.slug === slug && isPublishedJournalPost(post));
}

function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function generateStaticParams() {
  return JOURNAL_POSTS.filter(isPublishedJournalPost).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: JournalArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = findPublishedPost(slug);

  if (!post) {
    return {
      title: 'Article Not Found | The Unplugged Wear',
      description: 'The requested journal article could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const author = JOURNAL_AUTHORS.find((entry) => entry.id === post.authorId);
  const cover = post.ogMediaId
    ? JOURNAL_MEDIA.find((asset) => asset.id === post.ogMediaId)
    : post.coverMediaId
      ? JOURNAL_MEDIA.find((asset) => asset.id === post.coverMediaId)
      : undefined;
  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt ?? post.subtitle;
  const canonical = post.canonicalUrl
    ? absoluteUrl(post.canonicalUrl)
    : absoluteUrl(`/journal/${post.slug}`);
  const image = cover ? absoluteUrl(cover.url) : undefined;

  return {
    title: `${title} | The Unplugged Wear`,
    description,
    alternates: { canonical },
    robots: post.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: author ? [author.name] : undefined,
      images: image
        ? [{ url: image, alt: cover?.alt ?? post.title }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function JournalArticlePage({ params }: JournalArticlePageProps) {
  const { slug } = await params;
  const post = findPublishedPost(slug);

  if (!post) notFound();

  const category = post.categoryId
    ? JOURNAL_CATEGORIES.find((entry) => entry.id === post.categoryId)
    : undefined;
  const author = JOURNAL_AUTHORS.find((entry) => entry.id === post.authorId);
  const cover = post.coverMediaId
    ? JOURNAL_MEDIA.find((asset) => asset.id === post.coverMediaId)
    : undefined;
  const tags = post.tagIds
    .map((tagId) => JOURNAL_TAGS.find((tag) => tag.id === tagId))
    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));
  const related = relatedJournalPosts(post, JOURNAL_POSTS, 3);
  const articleUrl = absoluteUrl(`/journal/${post.slug}`);
  const authorName = author?.name ?? 'The Unplugged Wear';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription ?? post.excerpt ?? post.subtitle,
    image: cover ? [absoluteUrl(cover.url)] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    articleSection: category?.name,
    keywords: tags.map((tag) => tag.name).join(', ') || undefined,
    wordCount: post.contentText.trim() ? post.contentText.trim().split(/\s+/).length : 0,
    timeRequired: `PT${post.readingTimeMinutes}M`,
    author: author
      ? {
          '@type': 'Person',
          name: author.name,
          jobTitle: author.roleTitle,
          url: absoluteUrl(`/journal?author=${author.slug}`),
        }
      : { '@type': 'Organization', name: 'The Unplugged Wear' },
    publisher: {
      '@type': 'Organization',
      name: 'The Unplugged Wear',
      url: SITE_URL,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#1A1A1A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Header />

      <main id="main-content" tabIndex={-1} className="flex-1">
        <article>
          <header className="border-b border-[#E2DDCF] bg-[#F4F1EA]">
            <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
              <Breadcrumb
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Journal', href: '/journal' },
                  ...(category ? [{ label: category.name, href: `/journal?category=${category.slug}` }] : []),
                ]}
              />

              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[#8A6D32]">
                {category && (
                  <Link
                    href={`/journal?category=${category.slug}`}
                    className="rounded-full border border-[#C8A96A]/50 px-3 py-1 transition-colors hover:border-[#C8A96A] hover:text-[#1A1A1A]"
                  >
                    {category.name}
                  </Link>
                )}
                {post.isFeatured && (
                  <span className="rounded-full bg-[#1A1A1A] px-3 py-1 text-white">
                    Featured Essay
                  </span>
                )}
              </div>

              <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {post.title}
              </h1>

              {post.subtitle && (
                <p className="mt-5 max-w-3xl text-base leading-7 text-[#5D6772] sm:text-lg">
                  {post.subtitle}
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#5D6772]">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  {formatJournalDate(post.publishedAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} />
                  {formatReadingTime(post.readingTimeMinutes)}
                </span>
                <span>
                  By{' '}
                  {author ? (
                    <Link
                      href={`/journal?author=${author.slug}`}
                      className="font-semibold text-[#1A1A1A] underline decoration-[#C8A96A] underline-offset-4 hover:text-[#8A6D32]"
                    >
                      {author.name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-[#1A1A1A]">{authorName}</span>
                  )}
                  {author?.roleTitle ? `, ${author.roleTitle}` : ''}
                </span>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {cover && (
              <figure className="-mt-8 overflow-hidden rounded-3xl border border-[#E2DDCF] bg-white shadow-[0_20px_60px_rgba(26,26,26,0.08)] sm:-mt-10">
                <img
                  src={cover.url}
                  alt={cover.alt}
                  loading="eager"
                  decoding="async"
                  className="aspect-[16/9] w-full object-cover"
                />
                {cover.caption && (
                  <figcaption className="px-5 py-3 text-xs text-[#5D6772]">
                    {cover.caption}
                    {cover.credit ? ` · ${cover.credit}` : ''}
                  </figcaption>
                )}
              </figure>
            )}

            <div className="grid grid-cols-1 gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_220px] lg:py-14">
              <div>
                {post.excerpt && (
                  <p className="mb-8 border-l-2 border-[#C8A96A] pl-5 text-lg font-medium leading-8 text-[#3F3F3F]">
                    {post.excerpt}
                  </p>
                )}

                <JournalRichText content={post.content} media={JOURNAL_MEDIA} />

                <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-[#E2DDCF] pt-6">
                  <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-[#5A5A5A]">
                    Filed under
                  </span>
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/journal?tag=${tag.slug}`}
                      className="rounded-full bg-[#F4F1EA] px-3 py-1.5 text-xs font-medium text-[#5A5A5A] transition-colors hover:bg-[#EAE5D9] hover:text-[#1A1A1A]"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>

              <aside className="space-y-6">
                {author && (
                  <div className="rounded-2xl border border-[#E2DDCF] bg-white p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A6D32]">
                      Written by
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      {author.avatarUrl && (
                        <img
                          src={author.avatarUrl}
                          alt={`${author.name} portrait`}
                          loading="lazy"
                          decoding="async"
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <Link
                          href={`/journal?author=${author.slug}`}
                          className="text-sm font-semibold text-[#1A1A1A] hover:text-[#8A6D32]"
                        >
                          {author.name}
                        </Link>
                        {author.roleTitle && (
                          <p className="text-xs text-[#5D6772]">{author.roleTitle}</p>
                        )}
                      </div>
                    </div>
                    {author.bio && (
                      <p className="mt-3 text-xs leading-5 text-[#5D6772]">{author.bio}</p>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-[#E2DDCF] bg-[#F4F1EA] p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A6D32]">
                    Journal note
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#5D6772]">
                    Written slowly, in the same spirit as the garments. No sponsored links,
                    no urgency, no noise.
                  </p>
                </div>

                <Link
                  href="/journal"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A] hover:text-[#8A6D32]"
                >
                  <ArrowLeft size={14} />
                  All journal essays
                </Link>
              </aside>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="border-t border-[#E2DDCF] bg-white">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6D32]">
                    Continue reading
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Related essays
                  </h2>
                </div>
                <Link
                  href="/journal"
                  className="hidden text-sm font-medium text-[#8A6D32] underline decoration-[#C8A96A] underline-offset-4 hover:text-[#1A1A1A] sm:inline"
                >
                  View all
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {related.map((relatedPost) => {
                  const relatedCategory = relatedPost.categoryId
                    ? JOURNAL_CATEGORIES.find((entry) => entry.id === relatedPost.categoryId)
                    : undefined;
                  const relatedAuthor = JOURNAL_AUTHORS.find(
                    (entry) => entry.id === relatedPost.authorId
                  );
                  const relatedTags = relatedPost.tagIds
                    .map((tagId) => JOURNAL_TAGS.find((tag) => tag.id === tagId))
                    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));
                  const relatedCover = relatedPost.coverMediaId
                    ? JOURNAL_MEDIA.find((asset) => asset.id === relatedPost.coverMediaId)
                    : undefined;

                  return (
                    <JournalPostCard
                      key={relatedPost.id}
                      post={relatedPost}
                      category={relatedCategory}
                      author={relatedAuthor}
                      tags={relatedTags}
                      mediaUrl={relatedCover?.url}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
