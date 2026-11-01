'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, Link2, Share2 } from 'lucide-react';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Breadcrumb from '@storefront/components/ui/Breadcrumb';
import ProductCard from '@storefront/components/commerce/ProductCard';
import { JOURNAL_ARTICLES } from '@storefront/mocks/fixtures';
import { useStore } from '@storefront/mocks/store';
import { formatShortDate } from '@storefront/lib/format';
import type { JournalArticle, Product } from '@storefront/lib/types';

// Products to show under each kind of story ("Shop the story").
const STORY_CATEGORIES: Record<JournalArticle['category'], Product['category'][]> = {
  Craft: ['hoodies', 'tees'],
  Sustainability: ['tees', 'hoodies', 'pants'],
  'Slow Living': ['tees', 'pants', 'hoodies'],
  Design: ['hoodies', 'jackets', 'tees'],
};

const SHARE_TARGETS = [
  { id: 'whatsapp', label: 'WhatsApp', href: (url: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  { id: 'x', label: 'X', href: (url: string, title: string) => `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
  { id: 'pinterest', label: 'Pinterest', href: (url: string, title: string) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}` },
];

function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <div className="fixed top-0 inset-x-0 h-0.5 z-50 pointer-events-none" aria-hidden="true">
      <div className="h-full bg-store-gold origin-left" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

function ShareBar({ title }: { title: string }) {
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setUrl(window.location.href);
    setCanShare('share' in navigator);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Link copied');
    } catch {
      setMessage('Couldn’t copy — select the address bar to copy the link');
    }
    window.setTimeout(() => setMessage(''), 2500);
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      // Cancelled by the reader; nothing to do.
    }
  };

  const linkClass =
    'inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-store-border text-xs font-medium text-store-charcoal hover:border-store-charcoal transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-store-text-secondary mr-1">Share</span>
      {canShare && (
        <button type="button" onClick={nativeShare} className={linkClass}>
          <Share2 size={14} aria-hidden="true" /> Share…
        </button>
      )}
      {SHARE_TARGETS.map((target) => (
        <a key={target.id} href={url ? target.href(url, title) : '#'} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {target.label}
        </a>
      ))}
      <button type="button" onClick={copyLink} className={linkClass}>
        <Link2 size={14} aria-hidden="true" /> Copy link
      </button>
      <span className="text-sm text-store-text-secondary" role="status" aria-live="polite">
        {message}
      </span>
    </div>
  );
}

function ArticleCard({ article }: { article: JournalArticle }) {
  return (
    <Link href={`/journal/${article.slug}`} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold">
      <span className="block aspect-16/10 overflow-hidden bg-store-cream">
        <img
          src={article.coverImage}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ objectPosition: article.coverPosition }}
        />
      </span>
      <span className="mt-3 block text-xs uppercase tracking-wider text-store-text-secondary">{article.category}</span>
      <span className="mt-1 block font-heading text-lg font-medium text-store-charcoal underline-offset-4 decoration-store-gold group-hover:underline">
        {article.title}
      </span>
    </Link>
  );
}

export default function JournalArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { products } = useStore();
  const index = JOURNAL_ARTICLES.findIndex((a) => a.slug === slug);
  const article = JOURNAL_ARTICLES[index];

  const storyProducts = useMemo(() => {
    if (!article) return [];
    const categories = STORY_CATEGORIES[article.category];
    return products
      .filter((p) => p.images.length > 0 && categories.includes(p.category))
      .slice(0, 3);
  }, [article, products]);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-store-canvas">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-20 w-full">
          <h1 className="font-heading text-3xl font-medium text-store-charcoal">We couldn’t find that story</h1>
          <p className="mt-2 text-store-text-secondary">It may have moved. Here’s what’s in the Journal now:</p>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {JOURNAL_ARTICLES.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const previous = JOURNAL_ARTICLES[index - 1];
  const next = JOURNAL_ARTICLES[index + 1];
  const more = JOURNAL_ARTICLES.filter((a) => a.id !== article.id).slice(0, 3);
  const [lead, ...body] = article.content;

  return (
    <div className="min-h-screen flex flex-col bg-store-canvas text-store-charcoal">
      <ReadingProgress />
      <Header />

      <main className="flex-1 w-full">
        <article>
          <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16">
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Journal', href: '/journal' },
                { label: article.category },
              ]}
            />
            <p className="mt-8 text-xs uppercase tracking-wider text-store-text-secondary">{article.category}</p>
            <h1 className="mt-3 font-heading text-[clamp(2rem,3.5vw+1rem,3.5rem)] font-medium tracking-tight text-store-charcoal leading-[1.1]">
              {article.title}
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-store-text-secondary leading-relaxed">{article.subtitle}</p>
            <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-store-text-secondary">
              <span>By {article.author}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={new Date(article.publishedAt).toISOString().slice(0, 10)}>
                {formatShortDate(article.publishedAt)}
              </time>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={14} aria-hidden="true" /> {article.readTime}
              </span>
            </p>
          </header>

          <figure className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
            <div className="aspect-16/9 overflow-hidden bg-store-cream">
              <img
                src={article.coverImage}
                alt=""
                className="w-full h-full object-cover"
                style={{ objectPosition: article.coverPosition }}
              />
            </div>
          </figure>

          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            {lead && (
              <p className="font-heading text-xl sm:text-2xl leading-relaxed text-store-charcoal">{lead}</p>
            )}
            <div className="mt-8 space-y-6 text-lg leading-[1.8] text-store-text-secondary">
              {body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-store-card-border">
              <ShareBar title={article.title} />
            </div>
          </div>
        </article>

        {storyProducts.length > 0 && (
          <section aria-labelledby="shop-story" className="bg-store-cream border-y border-store-card-border">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="shop-story" className="font-heading text-2xl sm:text-3xl font-medium text-store-charcoal">
                  Shop the story
                </h2>
                <Link href="/shop" className="text-sm font-medium text-store-charcoal underline underline-offset-4 decoration-store-gold hover:decoration-store-charcoal">
                  See everything
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {storyProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        <nav aria-label="More stories" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid grid-cols-2 gap-4 pb-10 border-b border-store-card-border">
            <div>
              {previous && (
                <Link href={`/journal/${previous.slug}`} className="group inline-flex flex-col gap-1">
                  <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-store-text-secondary">
                    <ArrowLeft size={14} aria-hidden="true" /> Previous
                  </span>
                  <span className="font-medium text-store-charcoal underline-offset-4 decoration-store-gold group-hover:underline">{previous.title}</span>
                </Link>
              )}
            </div>
            <div className="text-right">
              {next && (
                <Link href={`/journal/${next.slug}`} className="group inline-flex flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-store-text-secondary">
                    Next <ArrowRight size={14} aria-hidden="true" />
                  </span>
                  <span className="font-medium text-store-charcoal underline-offset-4 decoration-store-gold group-hover:underline">{next.title}</span>
                </Link>
              )}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-heading text-2xl sm:text-3xl font-medium text-store-charcoal">More from the Journal</h2>
            <Link href="/journal" className="text-sm font-medium text-store-charcoal underline underline-offset-4 decoration-store-gold hover:decoration-store-charcoal">
              All stories
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {more.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </nav>
      </main>

      <Footer />
    </div>
  );
}
