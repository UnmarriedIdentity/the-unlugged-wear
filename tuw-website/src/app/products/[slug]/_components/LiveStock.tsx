import { getProductStock } from '@/server/catalog';
import StockSink from './StockSink';

// The one dynamic part of the product page: stock, read fresh per request.
// It is a sibling of the cached body rather than a wrapper around it, so the
// gallery and buy box stay in the static shell and only this hole streams.
export default async function LiveStock({ slug, productId }: { slug: string; productId?: string }) {
  const sizes = await getProductStock(productId);
  if (!sizes) return null;
  return <StockSink slug={slug} sizes={sizes} />;
}
