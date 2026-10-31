---
description: "Never commit rule: agents must NEVER create git commits. Committing and pushing are reserved exclusively for the human developer."
---

# Rule 10 — Never Commit (Inviolable, No Exceptions)

Agents must **NEVER run `git commit`** under any circumstance from this point forward.

1. **Strictly Forbidden**:
   - `git commit`
   - `git commit -m "..."`
   - `git commit --amend`
   - `git commit -a`

2. **Allowed Git Operations**:
   - `git status`
   - `git diff`
   - `git log`
   - `git branch`
   - Inspecting git state and files

3. **Workflow for Code Changes**:
   - Agent edits and creates necessary code, tests, and verifies all gates (`pnpm typecheck`, `pnpm test`, `pnpm build`).
   - Agent reports the modified files, test proofs, and explicit files ready for staging.
   - The **human developer** performs the git commit and git push.

4. **Reporting Requirement**:
   - Every agent completion report must include: `commits: none (agent commit strictly prohibited per Rule 10)`.
