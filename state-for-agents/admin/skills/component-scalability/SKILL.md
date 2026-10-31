# Skill: Component Scalability (loops over repetition)

Global authority for keeping components data-driven as the admin panel (and
later the storefront + backend) grows.

## Rules

1. Three or more near-identical JSX blocks → a config array + `.map()`.
   Extract shared row/card/cell renderers; vary by data (href, predicate,
   icon, label, badge), never by copy-paste.
2. New instances must require data-only changes (append one config entry),
   never new branches or duplicated markup.
3. Keys stable (`key={stableId}`, never index where order can change);
   `aria` attributes travel with the extracted component.
4. Repetition in `className` strings (e.g. 15 identical link bases) converts
   via one verified bulk edit + count assertion, not 15 hand edits.

## Good / bad

- ✅ `GROUPS.map(g => <NavGroup key={g.key} {...g} />)` for 4 sidebar groups.
- ❌ Four hand-written group blocks drifting apart over time.
- ✅ 15 branch links sharing one base string + per-item predicates.
- ❌ Copy-pasting a new page's filter chips instead of extending the chip config.
