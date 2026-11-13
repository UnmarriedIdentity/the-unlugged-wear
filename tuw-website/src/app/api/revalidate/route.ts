import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { guards } from '@/server/session';

// Admin → storefront cache refresh (route-handlers skill). Secret-protected;
// only known tags. Settings and products change prices shown to shoppers,
// so they expire at once ({ expire: 0 }: the next request re-reads instead of
// being served one stale page); content tags use 'max'.
const TAGS = ['settings', 'products', 'nav', 'faqs', 'reviews'] as const;
const IMMEDIATE: ReadonlySet<string> = new Set(['settings', 'products']);

export const POST = guards.route(
  {
    secret: { header: 'x-revalidate-secret', env: 'REVALIDATE_SECRET' },
    input: z.object({ tags: z.array(z.enum(TAGS)).min(1).max(TAGS.length) }),
  },
  async ({ input }) => {
    const tags = [...new Set(input.tags)];
    for (const tag of tags) revalidateTag(tag, IMMEDIATE.has(tag) ? { expire: 0 } : 'max');
    return { revalidated: tags };
  },
);
