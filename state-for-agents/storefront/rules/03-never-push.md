# Rule 03 — Never Push (inviolable, no exceptions)

Agents NEVER push to any remote, ever — not code, not docs, not trackers.
The human pushes after browser-testing. There is no docs-only exception.

Allowed: `git log`, `git status`, `git diff`. Per Rule 10, agents must NEVER run `git commit`.

## Good / bad

- ✅ Edit code, pass all gates, and report unstaged files for the human to commit and push.
- ❌ `git commit -m "..."` (agents must NEVER run git commit per Rule 10).
- ❌ `git push origin ...` (agents must NEVER push per Rule 03).

## Enforcement

Every work report must state: "commits: none (agent commit strictly prohibited per Rule 10)" and "push: none". All commits and pushes are reserved exclusively for the human developer.
