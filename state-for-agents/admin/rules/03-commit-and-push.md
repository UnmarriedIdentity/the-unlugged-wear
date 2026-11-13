# Rule 03 — Commit and Push Every Change (owner decision 2026-11-10)

Agents commit after each finished change and push it to the working
branch (`urvil-ui`) right away, so the remote always holds the latest work.
This replaces the old never-push / never-commit rules and wins over any
older line elsewhere that says pushes are human-only.

1. One logical change = one commit, exact paths only (Rule 01), after the
   Rule 02 gates pass. Commit the tracker update in the same commit.
2. Push to `origin urvil-ui` immediately after each commit. Never force-push
   without the owner asking; never push to `main`.
3. Never commit secrets, `.env*.local` files or real customer data.
4. Set `pushed: true` on tracker tasks once their commit is on the remote.

## Good / bad

- ✅ `git commit -m "feat(cart): …"` then `git push origin urvil-ui`.
- ❌ Leaving finished work uncommitted or unpushed at the end of a task.
- ❌ `git add .` (picks up env files and noise — exact paths only).
- ❌ `git push --force` because a push was rejected — pull/rebase and ask.

## Reporting

Every work report states the commit hash(es) and "pushed to urvil-ui".
