import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCatalog } from '@/server/catalog';

// Resolve the slug (or a legacy alias) on the server before the client page
// streams, so unknown products return a real 404 and each piece gets its own title.
async function findProduct(slug: string) {
  const key = slug.toLowerCase();
  const { products } = await getCatalog();
  return products.find(
    (p) => p.slug.toLowerCase() === key || p.aliases?.some((a) => a.toLowerCase() === key)
  );
}

// Cache Components: prerender every published product (database, cached
// with the 'products' tag); new products render on demand.
export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: 'everyday-pullover-hoodie' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return { title: 'Piece Not Found | The Unplugged Wear' };
  return {
    title: `${product.title} | The Unplugged Wear`,
    description: product.description,
    openGraph: product.images[0] ? { images: [{ url: product.images[0].url }] } : undefined,
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!(await findProduct(slug))) notFound();
  return children;
}
