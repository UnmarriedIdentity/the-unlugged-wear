'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Badge from '@/components/ui/Badge';
import { ArrowRight, Clock } from 'lucide-react';
import { JOURNAL_ARTICLES } from '@/mocks/fixtures';

export default function JournalPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Craft', 'Slow Living', 'Sustainability', 'Design'];

  const filteredArticles =
    selectedCategory === 'All'
      ? JOURNAL_ARTICLES
      : JOURNAL_ARTICLES.filter((a) => a.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Editorial Journal' },
          ]}
        />

        <div className="my-6">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1A1A1A]">
            The TUW Journal
          </h1>
          <p className="text-sm text-[#666] mt-2 max-w-xl leading-relaxed">
            Essays on architectural textiles, intentional slow living, and the deliberate omission of modern noise.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 pb-6 border-b border-[#E2DDCF] overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'bg-[#F4F1EA] text-[#5A5A5A] hover:bg-[#EAE5D9]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
          {filteredArticles.map((article) => (
            <Link
              key={article.id}
              href={`/journal/${article.slug}`}
              className="group flex flex-col rounded-3xl bg-white border border-[#E2DDCF] overflow-hidden shadow-xs hover:shadow-md transition-all"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[#F4F1EA]">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <Badge variant="dark">{article.category}</Badge>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-2">
                    <span>{article.publishedAt}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {article.readTime}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#1A1A1A] group-hover:underline leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs text-[#666] mt-2 line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E2DDCF] flex items-center justify-between text-xs font-semibold text-[#1A1A1A]">
                  <span>By {article.author}</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-[#7539FF]">
                    Read <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
