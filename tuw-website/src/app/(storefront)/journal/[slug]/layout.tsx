import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JOURNAL_ARTICLES } from '@/mocks/fixtures';

// The article page is a client component, so per-article metadata lives here.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = JOURNAL_ARTICLES.find((a) => a.slug === slug);
  if (!article) return { title: 'Article Not Found | The Unplugged Wear' };

  return {
    title: `${article.title} | The Unplugged Wear Journal`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [{ url: article.coverImage }],
    },
  };
}

export default async function JournalArticleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!JOURNAL_ARTICLES.some((a) => a.slug === slug)) notFound();
  return children;
}
