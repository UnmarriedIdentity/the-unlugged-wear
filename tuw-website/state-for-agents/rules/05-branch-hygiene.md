# Rule 05 — Branch Hygiene, single shared branch (inviolable)

One branch for all website agent work: `feat/storefront-meet`, shared by both
collaborators. No per-track, per-screen, or per-author branches — history
stays one readable line. With two humans plus agents on one branch,
discipline is load-bearing.

## Protocol

1. All website work commits here. Never commit directly to `main`; never
   touch `tuw-admin/` from this branch.
2. Pull before starting work; rebase local commits onto the pulled tip.
   Never force-push a shared branch — a force-push strands your partner.
3. Before touching code, verify `HEAD` matches `tasks.json#session.tip`; if
   not, reconcile first (stale bases produce phantom diffs).
4. Never commit conflict markers. Resolve conflicts immediately, re-gate,
   then commit the resolution with the work (exact paths only, Rule 01).
5. Pushes and merges are human-only (Rule 03). Report "ready for your push"
   with the exact commit range.

## Good / bad

- ✅ Pull, verify HEAD==tip, build auth seam, gate, commit, report.
- ❌ Force-pushing to "clean up" shared history.
- ✅ Conflict resolved + re-gated in the same exact-path commit.
- ❌ Committing `<<<<<<<` markers "to fix later".

## Enforcement

Every work report must state: "branch: feat/storefront-meet, HEAD==tip
verified, no force-push". A report without it is incomplete.
