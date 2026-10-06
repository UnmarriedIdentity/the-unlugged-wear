# Rule 05 — Branch hygiene (topic branches)

Permissions for where code may be committed. Supplements (never overrides)
rules 01 (git hygiene), 03 (never push), and 04 (task discipline).

## The rule

- `v2` accepts only reviewed, green, human-approved work. Experimental or
  in-progress tracks live on topic branches named `feat/<topic>` (e.g.
  `feat/search-modal`), created from a clean `v2` tip.
- **Spotlight search overhaul lives exclusively on `feat/search-modal`.**
  No search-modal change — however small — may be committed to `v2` or any
  other branch. `v2` receives only: reverts, tracker syncs, and this rule
  itself until the overhaul is explicitly approved for merge.
- Topic-branch commits follow the same gates (rule 02) and exact-path
  discipline (rule 01) as `v2`. A green topic branch is necessary but not
  sufficient for merge — the human merges after browser-testing.
- Merge direction is one-way: `feat/*` merges into `v2` on explicit human
  approval. Never merge `v2` into a topic branch to "catch up" without
  stating why; prefer rebasing the topic branch and re-running gates.
- Pushing any branch (including topic branches) is exclusively human
  (rule 03). Local-only branches are normal.

## Good / bad

- ✅ Committing spotlight input-row work on `feat/search-modal`.
- ❌ Committing a spotlight fix on `v2` "because it is small".
- ✅ `git checkout v2` before any non-spotlight task.
- ❌ Leaving the tree on `feat/search-modal` and committing dashboard work there.
