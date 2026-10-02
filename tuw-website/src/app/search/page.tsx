'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductGrid from '@/components/commerce/ProductGrid';
import { useStore } from '@/mocks/store';
import { Search as SearchIcon, X, Tag } from 'lucide-react';
import Link from 'next/link';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { products } = useStore();

  const [query, setQuery] = useState(initialQuery);

  const suggestedTerms = ['Hoodies', '500 GSM', 'French Terry', 'Organic Cotton', 'Tees', 'Pants'];

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return products.filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchSub = p.subtitle.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchDetails = p.details.some((d) => d.toLowerCase().includes(q));
      return matchTitle || matchSub || matchCat || matchDesc || matchDetails;
    });
  }, [products, query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Catalog Search' },
        ]}
      />

      <div className="max-w-2xl my-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A1A]">
          Search Catalog
        </h1>
        <p className="text-sm text-[#666] mt-1">
          Find garments by fabric specification, garment silhouette, or dye tone.
        </p>

        {/* Search Input Bar */}
        <div className="relative mt-6">
          <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            placeholder="Search by keywords (e.g. 500 GSM, French Terry, Slate, Cargo)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-12 rounded-2xl border border-[#E2DDCF] bg-white text-base outline-none shadow-xs focus:border-[#1A1A1A] transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search query"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#1A1A1A]"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Suggested Quick Terms */}
        <div className="flex items-center gap-2 flex-wrap mt-4">
          <span className="text-xs text-[#8A8A8A] font-medium flex items-center gap-1">
            <Tag size={12} /> Popular:
          </span>
          {suggestedTerms.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="px-3 py-1 rounded-full bg-[#F4F1EA] text-xs font-medium text-[#1A1A1A] hover:bg-[#EAE5D9] transition-colors cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="pt-8 border-t border-[#E2DDCF]">
        {query.trim() === '' ? (
          <div>
            <h3 className="text-base font-bold text-[#1A1A1A] mb-6">Explore Active Essentials</h3>
            <ProductGrid products={products.slice(0, 4)} />
          </div>
        ) : searchResults.length > 0 ? (
          <div>
            <div className="text-xs text-[#8A8A8A] uppercase font-bold tracking-wider mb-6">
              Found {searchResults.length} matching piece{searchResults.length === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
            </div>
            <ProductGrid products={searchResults} />
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E2DDCF] p-8 max-w-xl mx-auto shadow-xs">
            <h3 className="text-lg font-bold text-[#1A1A1A]">No matches for &ldquo;{query}&rdquo;</h3>
            <p className="text-xs text-[#666] mt-2 leading-relaxed">
              We couldn&apos;t find any garments matching this term. Check your spelling or browse our curated categories:
            </p>
            <div className="flex justify-center gap-3 mt-6 flex-wrap">
              <Link
                href="/shop?category=hoodies"
                className="px-4 py-2 rounded-full bg-[#F4F1EA] text-xs font-semibold hover:bg-[#1A1A1A] hover:text-white transition-colors"
              >
                Heavy Hoodies
              </Link>
              <Link
                href="/shop?category=tees"
                className="px-4 py-2 rounded-full bg-[#F4F1EA] text-xs font-semibold hover:bg-[#1A1A1A] hover:text-white transition-colors"
              >
                Organic Tees
              </Link>
              <Link
                href="/shop?category=pants"
                className="px-4 py-2 rounded-full bg-[#F4F1EA] text-xs font-semibold hover:bg-[#1A1A1A] hover:text-white transition-colors"
              >
                Pleated Pants
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="p-12 text-center text-sm">Loading search...</div>}>
          <SearchPageContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
