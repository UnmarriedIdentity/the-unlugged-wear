# Rule 07 — Page Metadata & Heading Rules (admin, inviolable)

The admin is a private workspace: it must never appear in search, and every
page still needs clean structure for accessibility.

1. **Never indexed** — the root layout sets `robots: { index: false,
   follow: false }`; `app/robots.ts` disallows `/`; no sitemap.
2. **Exactly one `<h1>`** per rendered page (the page title in the header);
   cards and drawers use `h2`/`h3` in order, never skipping a level.
3. **Title** — every page has a unique title from the template
   `'%s | TUW Admin'` (e.g. "Orders | TUW Admin"), so staff can tell tabs apart.
4. **No secrets in metadata or HTML** — no API keys, emails of other staff,
   or internal ids in titles, descriptions or `data-*` attributes.
5. **Links and images** — real `<Link>` navigation; icon buttons have
   accessible names; images have `alt` (decorative `alt=""`).
6. **Scores** — Lighthouse Accessibility ≥ 95 on the production build for
   every changed route.

## Good / bad

- ✅ "Refunds | TUW Admin", one `h1` "Refunds", `noindex, nofollow`.
- ❌ Two `h1`s (sidebar brand + page title).
- ❌ An admin URL showing up in Google because a page overrode `robots`.

## Enforcement

Work reports list h1 count, title and robots for each changed route; the
automated check (`tuw-admin/tests/page-rules.test.mjs`, TL-BE-17.09)
covers the mechanical items.
