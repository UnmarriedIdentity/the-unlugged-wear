# Rule 01 — Git Hygiene (inviolable)

## Exact paths only

- Stage explicit file paths only: `git add <path> [<path>...]`.
- NEVER `git add .`, `git commit -a`, wildcard adds, or scope-widening refactors.
- One fix = one commit. Never bulk unrelated changes into a final commit.
- Work on the session branch only (typically `feat/storefront-*`). Never touch
  `main` directly except to fork. Never touch `tuw-admin/`.
- Quarantine, never commit: CRLF-only noise (`core.autocrlf=true` with no
  `.gitattributes`), root screenshot PNGs, stray session markdown, Figma asset
  dumps outside `public/`, Editor/IDE artifacts.

## Good / bad

- ✅ `git add tuw-website/src/app/globals.css tuw-website/src/components/ui/Button.tsx`
- ❌ `git add .` (sweeps noise + unrelated leftovers into the commit)
- ❌ One "misc fixes" commit covering buttons, cart, and docs.

## Enforcement

Every work report must state: "git paths: <exact files staged>" plus "untouched:
<areas deliberately left dirty>". A report without it is incomplete.
