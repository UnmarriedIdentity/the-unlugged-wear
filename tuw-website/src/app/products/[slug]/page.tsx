'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Disclosure from '@/components/ui/Disclosure';
import Badge from '@/components/ui/Badge';
import ProductGallery from '@/components/commerce/ProductGallery';
import VariantSelector from '@/components/commerce/VariantSelector';
import ProductCard from '@/components/commerce/ProductCard';
import { useStore } from '@/mocks/store';
import { Feather, ShieldCheck, RefreshCw, Scissors } from 'lucide-react';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const { getProductBySlug, products } = useStore();

  const product = getProductBySlug(resolvedParams.slug);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold">Garment Not Found</h1>
          <p className="text-sm text-[#666] mt-2">
            The requested piece could not be located in our active catalog.
          </p>
          <div className="mt-6">
            <Link
              href="/shop"
              className="inline-flex px-6 py-3 rounded-full bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-black"
            >
              Browse All Apparel
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Related products from same category or general
  const relatedProducts = products
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb Trail */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Catalog', href: '/shop' },
              { label: product.category, href: `/shop?category=${product.category}` },
              { label: product.title },
            ]}
          />
        </div>

        {/* 2-Column Product Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          {/* Left Column: Interactive Product Gallery (7 cols) */}
          <div className="lg:col-span-7">
            <ProductGallery images={product.images} title={product.title} />
          </div>

          {/* Right Column: Pricing, Variant Selector, Details (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.isNew && <Badge variant="dark">New Drop</Badge>}
                {product.sustainabilityBadge && (
                  <Badge variant="outline">{product.sustainabilityBadge}</Badge>
                )}
                <span className="text-[11px] uppercase tracking-wider text-[#8A8A8A] font-semibold">
                  SKU: {product.id.toUpperCase()}-POD
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1A1A1A]">
                {product.title}
              </h1>
              <p className="text-sm font-medium text-[#666] mt-1">{product.subtitle}</p>

              {/* Price display */}
              <div className="flex items-baseline gap-3 mt-3">
                <span className="text-2xl font-black text-[#1A1A1A]">
                  ₹{product.priceINR.toLocaleString()}
                </span>
                {product.compareAtPriceINR && (
                  <span className="text-sm text-[#8A8A8A] line-through">
                    ₹{product.compareAtPriceINR.toLocaleString()}
                  </span>
                )}
                <span className="text-xs text-[#10B981] font-semibold">
                  Inclusive of all taxes & doorstep delivery eligibility
                </span>
              </div>
            </div>

            {/* Description text */}
            <p className="text-sm text-[#5A5A5A] leading-relaxed">
              {product.description}
            </p>

            {/* Interactive Variant Selector (Color, Size, Qty, Add to Bag) */}
            <div className="pt-2 border-t border-[#E2DDCF]">
              <VariantSelector product={product} />
            </div>

            {/* Information Disclosures (Details, Care, Sustainable POD) */}
            <div className="divide-y divide-[#E2DDCF] pt-4">
              <Disclosure
                title="Garment Specifications & Tailoring"
                icon={<Scissors size={16} />}
                defaultOpen={true}
              >
                <ul className="space-y-1.5 list-disc list-inside text-xs text-[#666]">
                  {product.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                  <li>Fabric Composition: {product.composition}</li>
                </ul>
              </Disclosure>

              <Disclosure
                title="Laundering & Fiber Care"
                icon={<Feather size={16} />}
              >
                <ul className="space-y-1.5 list-disc list-inside text-xs text-[#666]">
                  {product.careInstructions.map((instruction, idx) => (
                    <li key={idx}>{instruction}</li>
                  ))}
                </ul>
              </Disclosure>

              <Disclosure
                title="Zero-Deadstock POD Fulfillment"
                icon={<RefreshCw size={16} />}
              >
                <div className="text-xs text-[#666] space-y-2">
                  <p>
                    Every TUW garment is custom-printed upon receipt of your order using certified
                    non-toxic water-based pigment inks.
                  </p>
                  <p>
                    <strong>Curing & Inspection:</strong> 24-48 hours.
                    <br />
                    <strong>Domestic Surface Transit:</strong> 3-5 business days via Delhivery / BlueDart.
                  </p>
                </div>
              </Disclosure>
            </div>
          </div>
        </div>

        {/* Related Products Recommendation Carousel/Grid */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 pt-16 border-t border-[#E2DDCF]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A8A8A] block mb-1">
                  Complete the Look
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A1A1A]">
                  Pair With Complementary Essentials
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] hover:underline"
              >
                View Catalog
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
