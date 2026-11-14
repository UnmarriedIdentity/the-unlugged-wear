import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Truck } from 'lucide-react';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import type { ShopSearchParams } from '@storefront/lib/shop-query';
import ShopResults from './_components/ShopResults';

export const metadata: Metadata = {
  title: 'Shop All | The Unplugged Wear',
  description: 'Hoodies, tees, joggers and everyday objects from The Unplugged Wear, each printed to order in Tiruppur.',
};

// Only the chrome is static. The grid, its heading and the filter toolbar all
// read the URL, so they stream as one hole instead of blocking the shell.
function ResultsFallback() {
  return (
    <div aria-hidden="true">
      <div className="mb-5 sm:mb-6 space-y-3">
        <div className="h-4 w-40 rounded bg-store-cream animate-pulse" />
        <div className="h-8 w-56 rounded bg-store-cream animate-pulse" />
      </div>
      <div className="h-14 rounded-full bg-store-cream animate-pulse" />
      <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-4/5 w-full rounded-lg bg-store-cream animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-store-cream animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-store-cream animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShopPage({ searchParams }: { searchParams: Promise<ShopSearchParams> }) {
  return (
    <div className="min-h-screen flex flex-col bg-store-canvas">
      <Header />
      <main className="flex-1">
        <div className="w-full bg-store-cream/70 border-b border-store-card-border/60 py-2.5 px-4 text-center">
          <div className="flex items-center justify-center text-xs tracking-wider text-store-charcoal font-medium">
            <Link
              href="/search?q=acid%20wash"
              className="inline-flex items-center min-h-6 hover:underline transition-all"
            >
              Discover the Acid Wash Collection
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 sm:pt-8 sm:pb-12">
          <Suspense fallback={<ResultsFallback />}>
            <ShopResults searchParams={searchParams} />
          </Suspense>

          {/* Figma trust pillars ribbon */}
          <div className="mt-16 sm:mt-24 pt-12 border-t border-store-card-border/80 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-store-cream flex items-center justify-center text-store-charcoal shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-store-charcoal">
                  01. Zero Deadstock POD
                </h3>
                <p className="text-xs text-store-text-secondary mt-1 leading-relaxed">
                  Every piece is printed only after you order it.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-store-cream flex items-center justify-center text-store-charcoal shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-store-charcoal">
                  02. Made in Tiruppur
                </h3>
                <p className="text-xs text-store-text-secondary mt-1 leading-relaxed">
                  Printed and dispatched by our print partner in Tiruppur, India.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-store-cream flex items-center justify-center text-store-charcoal shrink-0">
                <Truck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-store-charcoal">
                  03. Doorstep Delivery
                </h3>
                <p className="text-xs text-store-text-secondary mt-1 leading-relaxed">
                  Transparent chronological transit tracking powered by Delhivery Surface Express.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
