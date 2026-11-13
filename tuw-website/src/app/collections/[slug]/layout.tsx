import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCatalog } from '@/server/catalog';

// Cache Components: prerender every published collection (database).
export async function generateStaticParams() {
  const { collections } = await getCatalog();
  return collections.length ? collections.map((c) => ({ slug: c.slug })) : [{ slug: 'everyday-tees' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = (await getCatalog()).collections.find((c) => c.slug === slug);
  if (!collection) return { title: 'Collection Not Found | The Unplugged Wear' };
  return { title: `${collection.title} | The Unplugged Wear`, description: collection.description };
}

export default async function CollectionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!(await getCatalog()).collections.some((c) => c.slug === slug)) notFound();
  return children;
}
