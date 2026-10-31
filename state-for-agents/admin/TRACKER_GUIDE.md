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
- `session{branch, tip, unpushed[], next_up, pending_verifications[],
  last_updated, updated_by}` — live resume state, refreshed every commit.
- `workflow{how_to_close_a_task, validation}` — the rules restated for machines.

## Status flow

`backlog → in_progress → done`. `done` requires: `log` commit + `verified:true`
(all gates green) + `finished` date. Never mark `done` on intent. Keep exactly
one `in_progress` while work remains.

## Push accounting (no screenshots anywhere)

- Agents NEVER push (rule 03). Every finished task ships with `pushed:false`.
- The human reports "pushed till <commit>"; the agent then sets `pushed:true`
  on every task whose `log` is an ancestor-or-equal of that commit, refreshes
  `session.unpushed[]`, and commits the tracker update.
- Example: human says "pushed till 19eb915" → all tasks logged at-or-before
  that commit flip to `pushed:true`; later local commits stay `false`.

## Update protocol

Update `tasks.json` in the SAME commit as the code block it records (exact
paths include the tracker). Validate after every edit: JSON parses; ids
unique; `parent` ids exist; summary counts match; `done` implies `log` +
`verified`.

## Worked example

Closing "login buttons": convert → gates green → set task `001`
`status:done, log:"v2:ef392b0", design_match:"yes", verified:true,
finished:<date>, pushed:false` → recompute summary → commit code + tracker
together → report "ready for your push".
