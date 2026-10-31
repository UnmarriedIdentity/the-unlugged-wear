# Agent State — `tuw-admin` UI rebuild (Tailwind v4)

This folder lets any agent, session, or IDE resume this project exactly where
work stopped. Start here, in this order:

1. `tasks.json` → read `session` (branch, tip, unpushed, `next_up`,
   `pending_verifications`), then the task list. Verify `HEAD` matches
   `session.tip`; if not, reconcile before touching code.
2. `TRACKER_GUIDE.md` → how to read and update the tracker.
3. `rules/` (in numeric order) → **inviolable constraints**. Rules are
   permissions, not techniques: pixel-perfect tolerance, git hygiene, gates,
   and never-push. Every report quotes rule compliance.
4. `skills/` → capabilities, loaded per task: `theme-tokens`,
   `utility-first-jsx`, `cascade-layers`, `stylesheet-anatomy`,
   `design-system`, `motion`, `decorative-graphics`, `debug-frontend`,
   `responsive-system`, `code-standards`, `component-scalability`,
   `backend-readiness`, `performance-budgets`, `skill-maintenance`.

## Rules vs skills (the split — never confuse them)

- **Rules** say what agents must/must-not do (no pushes ever — the human pushes
  after browser-testing; exact-path commits; gates before every commit).
- **Skills** say how to build pixel-perfect UI (tokens, utilities, layers,
  motion, debugging playbooks). Skills never grant permissions.

## Session continuity contract

- `tasks.json#session` is refreshed in the same commit as every code block.
- `pushed` flips only on explicit human confirmation ("pushed till X").
- Unpushed local work is normal; pushing is exclusively human.
- `archive/` holds superseded docs (history, not authority).
