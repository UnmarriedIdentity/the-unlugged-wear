import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Breadcrumb from '@storefront/components/ui/Breadcrumb';
import DynamicDataTable from '@storefront/components/commerce/DynamicDataTable';
import DynamicAccordionFaq from '@storefront/components/commerce/DynamicAccordionFaq';
import RelatedProductsSection from '@storefront/components/commerce/RelatedProductsSection';
import ProductReviews from '@storefront/components/commerce/ProductReviews';
import { EditorialFeatureSplit } from '@storefront/components/editorial';
import { getCatalog } from '@/server/catalog';
import type { Product, ProductSpecTable, ProductType } from '@storefront/lib/types';
import {
  categoryLabel,
  isWearable,
  productTypeOf,
  relatedProductsFor,
  variantLabelOf,
} from '@storefront/lib/product';
import LiveStock from './_components/LiveStock';
import ProductShowcase from './_components/ProductShowcase';

// Server-rendered from the cached catalogue (see lib/live-stock for the one
// dynamic part). The only interactive island on the page is ProductShowcase.

// Spec table for products that don't carry a hand-written one.
function specTableFor(product: Product, type: ProductType): ProductSpecTable {
  const rows: Record<string, string>[] = [
    { spec: 'Product', value: categoryLabel(product.category) },
    {
      spec: `${variantLabelOf(product)}s`,
      value: product.sizes.map((s) => s.size).join(', ') || 'One size',
    },
    { spec: 'Colours', value: product.colors.map((c) => c.name).join(', ') || '—' },
  ];
  if (product.weightGrams) rows.push({ spec: 'Approximate weight', value: `${product.weightGrams} g` });
  if (product.printAreas?.length) rows.push({ spec: 'Print areas', value: product.printAreas.join(', ') });
  rows.push({ spec: 'Made', value: 'Printed after you order by our print partner in India' });
  rows.push({ spec: isWearable(type) ? 'Fabric composition' : 'Material', value: 'To be confirmed (draft)' });
  if (product.taxRatePercent) rows.push({ spec: 'GST', value: `${product.taxRatePercent}% (included in price)` });
  if (product.hsnCode) rows.push({ spec: 'HSN code', value: product.hsnCode });
  return {
    title: 'Specifications',
    description: 'From our print partner’s base-product sheet.',
    columns: [
      { key: 'spec', label: 'Specification', align: 'left' },
      { key: 'value', label: 'Detail', align: 'left' },
    ],
    rows,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const key = slug.toLowerCase();
  const { products } = await getCatalog();
  // Old slugs keep resolving after a rename (see the layout).
  const product =
    products.find((p) => p.slug.toLowerCase() === key) ??
    products.find((p) => p.aliases?.some((alias) => alias.toLowerCase() === key)) ??
    null;
  if (!product) notFound();

  const type = productTypeOf(product);
  const categoryName = categoryLabel(product.category);
  const specTable = product.specTable ?? specTableFor(product, type);
  const related = relatedProductsFor(product, products);

  return (
    <div className="min-h-screen flex flex-col bg-store-canvas">
      <Header />

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 pb-28 lg:pb-10">
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Shop', href: '/shop' },
              { label: categoryName, href: `/shop?category=${product.category}` },
              { label: product.title },
            ]}
          />
        </div>

        <ProductShowcase product={product} />

        {/* Stock, read fresh per request and handed to the buy box above. */}
        <Suspense fallback={null}>
          <LiveStock slug={product.slug} productId={product.productId} />
        </Suspense>

        <section className="my-16 pt-8 border-t border-store-card-border">
          <DynamicDataTable table={specTable} />
        </section>

        {/* Real reviews only: delivered orders, approved by staff. */}
        {product.productId && <ProductReviews productId={product.productId} productTitle={product.title} />}

        {related.length > 0 && (
          <RelatedProductsSection
            products={related}
            title="Pairs well with"
            catalogLink={`/shop?category=${product.category}`}
            catalogLabel={`More ${categoryName}`}
          />
        )}

        <EditorialFeatureSplit
          title="Printed when you order."
          eyebrow="How it’s made"
          description="Nothing is printed ahead of time. Your piece is made after you order by our print partner in India, so there’s no unsold stock waiting in a warehouse."
          imageSrc="/images/editorial/products-made-with-love.png"
        />

        {product.faqs && product.faqs.length > 0 && (
          <DynamicAccordionFaq
            faqs={product.faqs}
            eyebrow="Questions"
            title="Frequently asked questions"
            description="How this piece is printed, sized and delivered."
          />
        )}

        <section className="relative my-16 overflow-hidden bg-store-deep-teal text-white min-h-64 flex items-center justify-center text-center p-8 sm:p-14">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-3xl sm:text-4xl font-heading font-medium text-white">Explore the collection</h2>
            <p className="text-sm text-white/80 leading-relaxed max-w-lg mx-auto">
              Hoodies, tees and everyday objects, each printed with the leaping deer after you order.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-store-charcoal font-medium text-xs uppercase tracking-wider hover:bg-store-cream transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
              >
                Shop all
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
