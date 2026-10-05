# Rule 01 — Git Hygiene (inviolable)

## Exact paths only

- Stage explicit file paths only: `git add <path> [<path>...]`.
- NEVER `git add .`, `git commit -a`, wildcard adds, or scope-widening refactors.
- One fix = one commit. Never bulk unrelated changes into a final commit.
- Work on `v2` only. Never touch `main`. Never touch `tuw-website/`.
- Quarantine, never commit: CRLF-only noise (~110 files, `core.autocrlf=true` with
  no `.gitattributes`), Bucket-B leftovers (unrelated `tuw-website` edits and
  binary deletions from a prior incident), Editor/IDE artifacts.

## Good / bad

- ✅ `git add tuw-admin/src/app/globals.css tuw-admin/src/components/forms/LoginPage.tsx`
- ❌ `git add .` (sweeps noise + unrelated leftovers into the commit)
- ❌ One "misc fixes" commit covering buttons, sidebar, and docs.

## Enforcement

Every work report must state: "git paths: <exact files staged>" plus "untouched:
<areas deliberately left dirty>". A report without it is incomplete.
