import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCollectionPage, getCollections } from '@/server/collections';

// Cache Components: prerender every published collection (database).
export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.length ? collections.map((c) => ({ slug: c.slug })) : [{ slug: 'everyday-tees' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCollectionPage(slug);
  if (!page) return { title: 'Collection Not Found | The Unplugged Wear' };
  return { title: `${page.collection.title} | The Unplugged Wear`, description: page.collection.description };
}

export default async function CollectionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!(await getCollectionPage(slug))) notFound();
  return children;
}
