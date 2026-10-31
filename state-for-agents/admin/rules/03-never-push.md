# Rule 03 — Never Push (inviolable, no exceptions)

Agents NEVER push to any remote, ever — not code, not docs, not trackers.
The human pushes after browser-testing. There is no docs-only exception.

Allowed: `git log`, `git status`, `git diff`, local `commit` (exact paths only,
per Rule 01, after Rule 02 gates pass).

## Good / bad

- ✅ `git commit -m "refactor(...)"` then report "ready for your push".
- ❌ `git push origin v2` ("just docs", "just one file", "CI needs it" — never).

## Enforcement

Every work report must state: "push: none (local commits: <hashes>)". Any push
by an agent is a critical violation regardless of content.
