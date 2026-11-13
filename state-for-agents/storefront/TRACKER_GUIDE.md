# Tracker Guide (`tasks.json`)

Read this before touching `tasks.json`. It is the only live task record;
`session` makes any agent/session resume exactly where work stopped.

## Fields

- `project`, `tracker_version`, `source_of_truth{code, tokens, skill-index, reference}` — what/where.
- `summary{total, done, in_progress, backlog}` — must always equal the task
  array counts. Recompute on every update.
- Task: `id` (unique, stable), `title`, `status` (`backlog`|`in_progress`|`done`),
  `owner`, `parent` (child tasks point at their main task id; mains omit it),
  `started`/`finished` (dates or null), `log` (commit hash(es)), `design_match`
  (`yes`|`partial`|null), `key_decisions[]`, `verified` (bool),
  `pushed` (**true/false only** — see push accounting), `follow_ups[]`.
- Backend tasks (`TL-WEB-BE-NN`, main `TL-WEB-BE`) also carry `admin_ref`
  (the admin-tracker step that builds the module they need),
  `depends_on[]` (admin mains in `state-for-agents/admin/tasks.json` that
  must be done first) and `files[]`. The admin tracker is the master
  sequence; do a `TL-WEB-BE` task once its `depends_on` are done.
- `session{branch, tip, unpushed[], next_up, pending_verifications[],
  last_updated, updated_by}` — live resume state, refreshed every commit.
- `workflow{how_to_close_a_task, validation}` — the rules restated for machines.

## Status flow

`backlog → in_progress → done`. `done` requires: `log` commit + `verified:true`
(all gates green) + `finished` date. Never mark `done` on intent. Keep exactly
one `in_progress` while work remains.

## Push accounting (no screenshots anywhere)

- Agents commit and push every finished change to `urvil-ui` (rule 03),
  then set `pushed:true` on its tasks. The older flow below applies only if
  a push fails or the owner pushes manually.
- The human reports "pushed till <commit>"; the agent then sets `pushed:true`
  on every task whose `log` is an ancestor-or-equal of that commit, refreshes
  `session.unpushed[]`, and commits the tracker update.
- Example: human says "pushed till 19eb915" → all tasks logged at-or-before
  that commit flip to `pushed:true`; later local commits stay `false`.

## Update protocol

Update `tasks.json` in the SAME commit as the code block it records (exact
paths include the tracker). Validate after every edit: JSON parses; ids
unique; `parent` ids exist; summary counts match; `done` implies `log` +
verified.

## Worked example

Closing "login buttons": convert → gates green → set task `TL-WEB-001`
`status:done, log:"feat/storefront-meet:ef392b0", design_match:"yes", verified:true,
finished:<date>, pushed:false` → recompute summary → commit code + tracker
together → report "ready for your push".
