# Rule 06 — Branch & search-modal strategy

Supplements rule 05 (branch hygiene). This file is the single source of
truth for: which branches exist and why, which search modal lives where,
and how work flows between branches without losing anything.

## 1. Branch inventory

| Branch | Role | Search modal it carries | Remote |
|---|---|---|---|
| `v2` | Integration line. All common features, fixes, reverts, trackers, and rules land here. | **Legacy modal** (command palette, `commandPalette*` classes in `Header.tsx`) | `origin/v2` (human pushes only, rule 03) |
| `feat/search-modal` | Topic branch: spotlight search overhaul ONLY (S0–S8 + F1–F3). | **Spotlight modal** (`src/components/search/*`, island dialog) | `origin/feat/search-modal` after first human push (human pushes only) |
| `origin/main` | Separate release line. NOT part of this strategy; merges from `v2` happen explicitly (last: PR #6). | Whatever `v2` carried at last sync | — |

## 2. Modal inventory (why two exist)

- **Legacy modal** (`v2`, `Header.tsx` ~290 lines of `commandPalette*` JSX):
  find-only dialog, hand-written result groups (orders/products/customers/
  nav), query + filter memos living in `Header`, ESC badge + footer,
  14px-radius box. Frozen in place: no fixes or features land on it
  except the shared overlay/shortcut it already uses.
- **Spotlight modal** (`feat/search-modal`, `src/components/search/`):
  island dialog (24px radius, glow shadow), prefix parser
  (`#orders @customer !ship !ret !pay !inv`), adapter-driven sections,
  tinted tiles + Jump pills, whole-row jump, keyboard nav. Query state
  lives in the modal; `Header` keeps trigger + overlay + signals only.
- **Shared, never duplicated:** overlay CSS (purplish blur — frozen),
  Ctrl+K/Escape handling, `SearchAdapter` contract shape, token washes.
- **Planned convergence (F1–F3):** after merge, BOTH modals coexist behind
  `settings.searchVariant: 'spotlight' | 'legacy'` (default spotlight)
  with a Settings → General toggle, so the team can switch back instantly
  with zero resets and zero code loss. The loser is deleted in one final
  commit only after explicit approval.

## 3. Workflows

### Common features (notifications, pages, fixes)
1. Commit on `v2` (gates per rule 02, exact paths per rule 01).
2. Human pushes `origin/v2`.
3. Merge `v2` downward into `feat/search-modal`, re-run gates.
4. Human pushes `origin/feat/search-modal`.
5. Verify `git diff v2...feat/search-modal --stat` shows ONLY spotlight
   files — this is the single-difference invariant. If anything else
   appears, stop and reconcile before pushing.

### Spotlight work
- Commits ONLY on `feat/search-modal`. Never on `v2` (rule 05).
- Merge into `v2` with `--no-ff`, once, on explicit human approval
  after browser review on the branch.

### If the team rejects spotlight AFTER merge
- Preferred: flip `settings.searchVariant` back to `'legacy'`.
  No reset, no loss, later features untouched — only the dialog shell
  swaps, because post-merge work sits around the modals, not in them.
- Fallback (pre-flag merges only): `git revert -m 1 <merge-commit>`
  on `v2`, then human push. The branch preserves the work for retry.
- Never `git reset`, never force-push, never rewrite published history.

### Region ownership (prevents merge conflicts)
- Search track owns: `src/components/search/*`, the Header search-dialog
  region, spotlight CSS regions.
- Common tracks own: everything else, including the Header bell/popover
  region and `src/components/notifications/*`.
- Shared files are edited in non-adjacent blocks only. A shared helper
  needed twice is extracted to `ui/` or `lib/` BEFORE either track
  duplicates it.

## 4. Safeguards checklist (every sync and every merge)

1. `git status` clean (tracked files) before switching branches.
2. `git diff v2...feat/search-modal --stat` shows spotlight files only.
3. `pnpm --dir tuw-admin typecheck`, `test` (4/4), `build` (37/37) green.
4. Tracker `session` block reflects the checkout (`branch`, `tip`).
5. All pushes by the human (rule 03). No exceptions for "small" commits.

## Good / bad

- ✅ Building notifications on `v2`, then merging downward.
- ❌ Committing common work on `feat/search-modal` ("I'll cherry-pick later").
- ✅ Flipping a setting to restore the legacy modal.
- ❌ Resetting the line to "remove" spotlight after merge.
- ✅ One topic per branch; merge with `--no-ff` for a revert target.
- ❌ Fast-forwarding the spotlight in (no revert handle) or letting the
  branch drift more than one feature from `v2`.
