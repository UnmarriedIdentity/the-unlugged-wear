import { Suspense } from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from './providers';
import { getSessionSummary } from '@/server/session';
import { getStorefrontSettings } from '@/server/settings';
import { getCatalog } from '@/server/catalog';
import { getNavigation } from '@/server/nav';
import BrandIntro from '@storefront/components/layout/BrandIntro';
import { INTRO_SEEN_SCRIPT } from '@storefront/lib/intro';

// Self-hosted Outfit for headings and body (vendored from @fontsource, OFL licensed).
// next/font/local keeps Turbopack production builds deterministic with zero
// fonts.googleapis.com fetch at build/runtime (Vercel-safe).
const outfit = localFont({
  variable: '--font-outfit',
  display: 'swap',
  preload: true,
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
  src: [
    { path: './fonts/outfit-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './fonts/outfit-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/outfit-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/outfit-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/outfit-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: './fonts/outfit-latin-800-normal.woff2', weight: '800', style: 'normal' },
    { path: './fonts/outfit-latin-900-normal.woff2', weight: '900', style: 'normal' },
  ],
});

export const metadata: Metadata = {
  title: 'The Unplugged Wear | Everyday Wear, Printed to Order',
  description:
    'Everyday hoodies, tees and objects printed with the leaping deer, made to order in Tiruppur. Nothing is printed until you order it.',
  keywords: [
    'The Unplugged Wear',
    'minimalist streetwear',
    'pullover hoodie',
    'oversized tee',
    'slow fashion India',
    'print-on-demand',
  ],
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // All cached ('settings' / 'products' / 'nav' tags) — part of the static
  // shell, not dynamic holes. Shop and PDP now read the catalog on the server;
  // the provider keeps it for Header (mega-menu counts, suggestions) and the
  // per-browser bag/wishlist. Narrowing it to a nav-sized read is the next win.
  const [settings, catalog, nav] = await Promise.all([getStorefrontSettings(), getCatalog(), getNavigation()]);
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <head>
        {/* Before first paint: skip the brand intro for visitors who saw it this session. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SEEN_SCRIPT }} />
      </head>
      <body className="font-sans antialiased bg-store-canvas text-store-text-primary min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-dark focus:text-white focus:font-semibold focus:text-xs focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary-mint"
        >
          Skip to main content
        </a>
        {/* Un-awaited: read with use() inside Suspense boundaries. */}
        <Providers session={getSessionSummary()} settings={settings} catalog={catalog} nav={nav}>
          {/* Reads the URL; streamed so dynamic routes keep a static shell. */}
          <Suspense fallback={null}>
            <BrandIntro />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
