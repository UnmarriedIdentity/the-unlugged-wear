import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { STORE_COLLECTIONS } from '@/mocks/fixtures';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = STORE_COLLECTIONS.find((c) => c.slug === slug);
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
  if (!STORE_COLLECTIONS.some((c) => c.slug === slug)) notFound();
  return children;
}
