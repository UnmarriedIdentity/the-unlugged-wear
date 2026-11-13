# Rule 08 — SEO Page Rules (every storefront page, inviolable)

Every page in `tuw-website/src/app` must meet all of these before its task
closes. How-to: `skills/seo`.

1. **Headings**
   - Exactly **one `<h1>`** per rendered page (at most one in any state;
     error/empty states replace it, never add a second).
   - Headings go in order (`h1` → `h2` → `h3`), never skipping a level, and
     are never used only for styling.
2. **Title** — unique per page, ≤ 60 characters, from the root template
   `'%s | The Unplugged Wear'`.
3. **Meta description** — unique per page, 70–160 characters, describes the
   page (no keyword lists, no discount or urgency copy).
4. **Canonical** — every indexable page sets `alternates.canonical`; query
   variants (filters, sort, tracking params) point to the clean URL.
5. **Open Graph / Twitter** — `og:title`, `og:description`, `og:image`
   (1200 × 630, real product or editorial photo), `og:type`; `twitter:card`
   `summary_large_image`.
6. **Indexing** — private and transactional pages (`/account/*`, `/cart`,
   `/checkout/*`, `/track-order`, `/reset-password`, `/search`, dev pages
   `/design-system`, `/checklist`) are `noindex`; public pages are never
   accidentally `noindex`.
7. **Images** — every meaningful `<img>` / `next/image` has descriptive `alt`;
   decorative images have `alt=""`.
8. **Links** — internal navigation uses `<Link>` (real `<a href>`), with
   descriptive text (no "click here"); no `href="#"` placeholders.
9. **Structured data** — required types per page (see skill) and valid in
   Google's Rich Results test; no invented ratings, prices or stock.
10. **Language and URLs** — `<html lang="en-IN">`; lowercase kebab-case slugs;
    renamed slugs 301 to the new URL.
11. **Scores** — Lighthouse SEO ≥ 95 and Accessibility ≥ 95 on the production
    build for every changed route.

## Good / bad

- ✅ `/products/onyx-tee`: one `h1`, unique title + description, canonical, Product JSON-LD.
- ❌ An `h1` in the header logo and another in the hero.
- ❌ `/cart` indexable; `/shop` accidentally `noindex`.

## Enforcement

Every work report lists, per changed route: h1 count, title length,
description length, canonical, robots, Lighthouse SEO score. An automated
check (`tests/seo-rules.test.mjs`, TL-BE-17.09) fails the build on the
mechanical items (h1 count, title/description present and within length,
noindex list).
