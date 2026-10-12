# Rule 05 — Branch Hygiene (slim, inviolable)

One shared line (`main`), one track per feature branch. With two humans plus
agents collaborating, undisciplined branches are how work collides and history
rots. There is deliberately no second rule: the website has a single
integration line (no modal/split workflow to govern).

## Protocol

1. One track = one branch: `feat/storefront-<track>` forked from `main`.
   Never commit two tracks on one branch; never commit directly to `main`.
2. Rebase over merge for keeping a branch current (`git rebase main`); never
   merge `main` into the branch. Resolve conflicts immediately, never commit
   conflict markers.
3. Before touching code, verify `HEAD` matches `tasks.json#session.tip`; if
   not, reconcile first (stale bases produce phantom diffs).
4. Pushes and merges are human-only (Rule 03). Report "ready for your push"
   with the exact commit range; never push to "keep things tidy".
5. Never import from, merge, or cherry-pick the admin app (`tuw-admin/`) into
   website branches — the apps stay independent per root AGENTS.md §4.

## Good / bad

- ✅ `feat/storefront-auth` carries only login/signup commits, rebased on current `main`.
- ❌ Cart fixes + auth work + doc edits sharing one branch.
- ✅ "HEAD matches tip; starting auth track."
- ❌ Building on a stale checkout and discovering it at PR time.

## Enforcement

Every work report must state: "branch: <name>, HEAD==tip verified". A report
without it is incomplete.
