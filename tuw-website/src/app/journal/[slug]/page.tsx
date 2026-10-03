'use client';

import React, { use } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { JOURNAL_ARTICLES } from '@/mocks/fixtures';
import { Clock, ArrowLeft, Share2 } from 'lucide-react';

export default function JournalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);

  const article = JOURNAL_ARTICLES.find((a) => a.slug === resolvedParams.slug);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold">Article Not Found</h1>
          <div className="mt-6">
            <Link
              href="/journal"
              className="inline-flex px-6 py-3 rounded-full bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-black"
            >
              Back to Journal
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <article className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Journal', href: '/journal' },
            { label: article.category },
          ]}
        />

        <header className="my-8 space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="dark">{article.category}</Badge>
            <span className="text-xs text-[#8A8A8A] flex items-center gap-1">
              <Clock size={12} /> {article.readTime}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1A1A1A] leading-[1.15]">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-[#666] leading-relaxed font-normal">
            {article.subtitle}
          </p>

          <div className="pt-4 border-t border-[#E2DDCF] flex items-center justify-between text-xs text-[#8A8A8A]">
            <span>Published on {article.publishedAt} • By {article.author}</span>
          </div>
        </header>

        {/* Hero image */}
        <div className="aspect-[16/10] w-full rounded-3xl overflow-hidden my-8 border border-[#E2DDCF] bg-[#1A1A1A]">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Editorial Body */}
        <div className="prose prose-neutral max-w-none text-base text-[#3A3A3A] leading-[1.8] space-y-6">
          {article.content.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {/* Post Footer */}
        <footer className="mt-16 pt-8 border-t border-[#E2DDCF] flex items-center justify-between">
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:text-[#7539FF]"
          >
            <ArrowLeft size={16} /> All Journal Articles
          </Link>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert('Article URL copied to clipboard');
              }
            }}
            icon={<Share2 size={14} />}
          >
            Share Article
          </Button>
        </footer>
      </article>

      <Footer />
    </div>
  );
}
