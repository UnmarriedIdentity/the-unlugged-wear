# Skill: Next.js Rendering Map (which part of each page is shell or hole)

Global authority for how each storefront route splits into a prerendered
shell and streamed holes. Detail lives in `server-components`,
`client-components` and `cache-components`; this skill is the map.
Next.js 16.3.8 differs from older versions — read
`node_modules/next/dist/docs/` before using an unfamiliar API.

## Rules

1. Decide per component, not per page: static or `'use cache'` → shell;
   needs the request → `<Suspense>` hole; needs input → small client leaf.
2. Suspense goes as low as possible, around the one part that needs the
   request, with a fallback the same size as the content (no layout shift).
3. The LCP element (hero / product image) is always in the shell, via
   `next/image` with `priority` and real `sizes`.
4. `generateStaticParams` returns at least one slug (top products,
   collections, articles); unknown slugs call `notFound()`.
5. `<Link prefetch={true}>` only for above-the-fold PDP links (it costs a
   server call per link).

## Route map

| Route | Shell | Holes |
|---|---|---|
| `/` | hero, CMS sections, featured products | bag count, account icon |
| `/shop`, `/collections/[slug]` | chrome, collection header | grid driven by `searchParams` |
| `/products/[slug]` | gallery, details, size chart, FAQs | live stock badge, "in your bag" |
| `/cart`, `/checkout`, `/account/*` | chrome only | all content (per shopper) |
| `/journal/*`, `/faq`, `/policies/*`, `/about`, `/size-guide` | whole page | none |
| `/search`, `/track-order` | chrome, form | results |

## Good / bad

- ✅ PDP: cached `<ProductBody>` + `<Suspense><LiveStock/></Suspense>`.
- ❌ One `<Suspense>` around the whole PDP — nothing paints until stock loads.
- ✅ Dev overlay clean of `blocking-prerender-*` insights before commit.
- ❌ `export const dynamic = 'force-dynamic'` (errors under Cache Components).
