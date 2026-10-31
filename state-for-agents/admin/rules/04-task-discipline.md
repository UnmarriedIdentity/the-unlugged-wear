# Rule 04 — Task Discipline (inviolable)

Every user prompt that assigns work opens a task first; every finished task is
closed with details before moving on.

## Protocol

1. On each new prompt: create or reuse a todo entry (`in_progress`) and mirror
   it in `tasks.json` (new task or child with `started`, `owner`, `status`).
2. On completion: fill `finished`, `log` (commit hash), `design_match`,
   `key_decisions[]`, `verified`, recompute `summary`, refresh `session`
   (tip, next_up, pending verifications) — in the same commit as the work
   where the skill requires it, otherwise its own exact-path commit.
3. Never carry silent context: pending verifications and open questions live
   in `session.pending_verifications` / task `follow_ups`, not in chat memory.
4. Like the no-push and one-commit rules, this discipline is load-bearing for
   resume-from-anywhere continuity — skipping it breaks future sessions.

## Good / bad

- ✅ Prompt arrives → todo + tracker entry → work → gates → close + commit.
- ❌ Finishing work with "I'll update the tracker later."
- ❌ Closing a task as done while verifications are still pending with the human.

## Enforcement

Every work report must state: "tasks: opened X / closed Y (tracker commit <hash>)".
A report without it is incomplete.
