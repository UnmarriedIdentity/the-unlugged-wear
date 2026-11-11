import { Suspense } from 'react';
import Link from 'next/link';
import { after } from 'next/server';
import { logSearch, normalizeTerm } from '@tuw/heart/modules/catalog';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Breadcrumb from '@storefront/components/ui/Breadcrumb';
import ProductGrid from '@storefront/components/commerce/ProductGrid';
import { cachedSearch, getCatalog } from '@/server/catalog';
import SearchBox from './_components/SearchBox';

type Params = Promise<{ q?: string | string[] }>;

const SHOP_LINKS = [
  { href: '/shop?category=hoodies', label: 'Hoodies' },
  { href: '/shop?category=tees', label: 'Tees' },
  { href: '/shop?category=pants', label: 'Joggers' },
];

// Results are the dynamic hole; the page around them is static.
async function Results({ searchParams }: { searchParams: Params }) {
  const { q } = await searchParams;
  const term = normalizeTerm(typeof q === 'string' ? q : '');
  const { products } = await getCatalog();

  if (!term) {
    return (
      <div>
        <h2 className="text-base font-bold text-[#1A1A1A] mb-6">Explore Active Essentials</h2>
        <ProductGrid products={products.slice(0, 3)} />
      </div>
    );
  }

  const { ids, total } = await cachedSearch(term);
  // Logged after the response, so analytics never slows a search down.
  after(() => logSearch(term, total).catch((error) => console.warn('[search] log failed', (error as Error).message)));
  const byId = new Map(products.map((p) => [p.id, p]));
  const results = ids.flatMap((id) => byId.get(id) ?? []);

  if (!results.length) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-[#E2DDCF] p-8 max-w-xl mx-auto shadow-xs">
        <h2 className="text-lg font-bold text-[#1A1A1A]">No matches for &ldquo;{term}&rdquo;</h2>
        <p className="text-xs text-[#666] mt-2 leading-relaxed">Check your spelling or browse a category:</p>
        <div className="flex justify-center gap-3 mt-6 flex-wrap">
          {SHOP_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="px-4 py-2 rounded-full bg-[#F4F1EA] text-xs font-semibold hover:bg-[#1A1A1A] hover:text-white transition-colors">{l.label}</Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs text-[#8A8A8A] uppercase font-bold tracking-wider mb-6" role="status">
        Found {total} matching piece{total === 1 ? '' : 's'} for &ldquo;{term}&rdquo;
      </div>
      <ProductGrid products={results} />
    </div>
  );
}

export default function SearchPage({ searchParams }: { searchParams: Params }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Catalog Search' }]} />
          <div className="max-w-2xl my-6">
            <h1 className="text-[clamp(1.75rem,3vw+0.5rem,2.25rem)] font-extrabold tracking-tight text-[#1A1A1A]">Search Catalog</h1>
            <p className="text-sm text-[#666] mt-1">Find pieces by name, type or style.</p>
            <Suspense fallback={<div className="mt-6 h-14 rounded-2xl border border-[#E2DDCF] bg-white" />}>
              <SearchBox />
            </Suspense>
          </div>
          <div className="pt-8 border-t border-[#E2DDCF]">
            <Suspense fallback={<p className="py-12 text-center text-sm text-[#666]" role="status">Searching…</p>}>
              <Results searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
