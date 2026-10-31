# Skill: Component Scalability (loops over repetition)

Global authority for keeping components data-driven as the storefront (and
later the backend) grows.

## Rules

1. Three or more near-identical JSX blocks → a config array + `.map()`.
   Extract shared row/card/cell renderers; vary by data (href, predicate,
   icon, label, badge), never by copy-paste.
2. New instances must require data-only changes (append one config entry),
   never new branches or duplicated markup.
3. Keys stable (`key={stableId}`, never index where order can change —
   cart lines key by variant key, journal cards by slug); `aria` attributes
   travel with the extracted component.
4. Repetition in `className` strings converts via one verified bulk edit +
   count assertion, not hand edits.

## Good / bad

- ✅ `PRODUCT_GROUPS.map(g => <ProductCard key={g.slug} {...g} />)` for catalog grids.
- ❌ Four hand-written product cards drifting apart over time.
- ✅ One `CartLine` renderer for cart page, cart drawer, and checkout summary.
- ❌ Copy-pasting a new policy page instead of extending the policy config.
