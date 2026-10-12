# Skill: Routes (route definition conventions)

Global authority for defining routes in `tuw-website/src/app`.

## Rules

1. One folder per route, `page.tsx` inside; dynamic segments as `[slug]`
   (`products/[slug]`, `collections/[slug]`, `journal/[slug]`); shared
   route UI colocates in `_components/` (underscore folders are never routes).
2. `layout.tsx` composes chrome (Header/Footer/providers) at the closest
   level that needs it; `error.tsx` + `not-found.tsx` sit beside the routes
   they cover with storefront-toned fallback UI.
3. Every route declares its metadata (title/description); slugs stay
   `kebab-case` and stable (they feed variant keys and tracking lookups).
4. `api/` folders hold stubs only until the backend track — route handlers
   land there, never inline fetch logic in pages.

## Good / bad

- ✅ `app/journal/[slug]/page.tsx` reading the slug for the article adapter.
- ❌ Query-string-driven "pages" inside one route folder.
- ✅ `not-found.tsx` with a quiet back-to-shop path.
- ❌ Throwing raw errors with no `error.tsx` boundary.
