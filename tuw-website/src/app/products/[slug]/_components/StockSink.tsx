'use client';

import { useEffect } from 'react';
import { publishStock } from '@storefront/lib/live-stock';
import type { ProductSize } from '@storefront/lib/types';

// Invisible: hands the streamed live sizes to the buy box that is already on
// screen. No markup, so it cannot shift the layout.
export default function StockSink({ slug, sizes }: { slug: string; sizes: ProductSize[] }) {
  useEffect(() => {
    publishStock(slug, sizes);
  }, [slug, sizes]);
  return null;
}
