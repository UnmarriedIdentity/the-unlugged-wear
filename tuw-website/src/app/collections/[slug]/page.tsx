'use client';

import React, { use } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductGrid from '@/components/commerce/ProductGrid';
import { useStore } from '@/mocks/store';
import { STORE_COLLECTIONS } from '@/mocks/fixtures';

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const { products } = useStore();

  const collection = STORE_COLLECTIONS.find((c) => c.slug === resolvedParams.slug);

  if (!collection) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold">Capsule Not Found</h1>
          <div className="mt-6">
            <Link
              href="/collections"
              className="inline-flex px-6 py-3 rounded-full bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-black"
            >
              Back to Collections
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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Capsules', href: '/collections' },
            { label: collection.title },
          ]}
        />

        {/* Hero banner for capsule */}
        <div className="relative aspect-[21/9] w-full rounded-3xl overflow-hidden my-6 border border-[#E2DDCF] bg-[#1A1A1A]">
          <img
            src={collection.coverImage}
            alt={collection.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-12 text-white">
            <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#C8A96A] mb-1">
              Capsule Series • {collection.productCount} Garments
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{collection.title}</h1>
            <p className="text-sm text-[#D1D5DB] mt-2 max-w-xl">{collection.description}</p>
          </div>
        </div>

        {/* Garment Grid for Capsule */}
        <div className="pt-6">
          <ProductGrid products={products} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
