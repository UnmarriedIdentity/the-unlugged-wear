# Skill: SEO (search-ready storefront pages)

Global authority for how storefront pages are found and shown in search and
social previews. The must-follow checklist is Rule 08 (`rules/08-seo-page-rules.md`);
this skill is how to meet it with the Next.js 16 Metadata API
(`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`).

## How to build it

1. **Root layout** sets `metadataBase` (the live storefront URL), a title
   template `'%s | The Unplugged Wear'`, default description, default Open
   Graph image, and `<html lang="en-IN">`.
2. **Static pages** export `metadata`; **dynamic pages** export
   `generateMetadata` that reads the same cached module function as the page
   (`'use cache'` + the entity's `cacheTag`), so it never adds a second
   database trip.
3. **Canonical** on every indexable page (`alternates.canonical`). Filtered or
   sorted `/shop?…` and `/search?q=…` point to the clean URL; search results
   are `noindex, follow`.
4. **Structured data** as JSON-LD in a Server Component
   (`<script type="application/ld+json">`): `Organization` + `WebSite` (home),
   `Product` + `Offer` (PDP, price in INR, real availability),
   `BreadcrumbList` (PDP, collections, journal), `Article` (journal), `FAQPage`
   (FAQ). Ratings only from approved real reviews — never invented.
5. **`app/sitemap.ts`** lists products, collections, journal articles and
   static pages from the database (`lastModified` from `updated_at`);
   **`app/robots.ts`** allows public pages, disallows `/account`, `/cart`,
   `/checkout`, `/api`, and links the sitemap.
6. **Retired slugs** redirect 301 (`blog_slug_history`, product aliases), so
   links and rankings survive renames.
7. **Content** is server-rendered and in the static shell (bots get the full
   page): product text, prices, headings and breadcrumbs are never
   client-only.

## Good / bad

- ✅ PDP: one `<h1>` with the product name, title "Onyx Heavyweight Tee | The Unplugged Wear", `Product` JSON-LD with `priceCurrency: 'INR'`.
- ❌ Logo wrapped in `<h1>` on every page plus a product `<h1>`.
- ✅ `/shop?colour=black&sort=price` → canonical `/shop`.
- ❌ Every page titled "The Unplugged Wear".
- ✅ `aggregateRating` omitted until real reviews exist.
- ❌ Fake 4.9★ ratings in structured data (AGENTS.md §3).

Related: `nextjs-rendering`, `cache-components`, `performance-budgets`.
