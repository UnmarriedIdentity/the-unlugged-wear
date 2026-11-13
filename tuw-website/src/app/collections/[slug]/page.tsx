import React from 'react';
import { notFound } from 'next/navigation';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Breadcrumb from '@storefront/components/ui/Breadcrumb';
import ProductGrid from '@storefront/components/commerce/ProductGrid';
import { getCollectionPage } from '@/server/collections';

// Membership and order come from collection_products (database); the route
// layout already 404s unknown slugs, this is the page's own guard.
export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getCollectionPage(slug);
  if (!page) notFound();
  const { collection, products } = page;

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
            <h1 className="text-[clamp(1.75rem,4vw+0.5rem,3rem)] font-extrabold tracking-tight">{collection.title}</h1>
            <p className="text-sm text-[#D1D5DB] mt-2 max-w-xl">{collection.description}</p>
          </div>
        </div>

        {/* Garment Grid for Capsule */}
        <div className="pt-6">
          <h2 className="sr-only">Products</h2>
          <ProductGrid
            products={products}
            emptyTitle="This capsule is being restocked"
            emptyDescription="Its pieces are between print runs right now. Explore the full shop in the meantime."
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
