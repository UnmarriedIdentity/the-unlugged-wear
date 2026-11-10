import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { guards } from '@/server/session';

// Admin → storefront cache refresh (route-handlers skill). Secret-protected;
// only known tags. Settings change prices shown to shoppers, so they expire
// at once ({ expire: 0 }: next request re-reads); content tags use 'max'.
const TAGS = ['settings', 'products', 'nav', 'faqs'] as const;
const IMMEDIATE: ReadonlySet<string> = new Set(['settings']);

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
