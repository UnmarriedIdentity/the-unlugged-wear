# Skill: Skill Maintenance (self-improvement loop)

Global authority for how this skill set itself evolves from agent experience.

## Loop (proposal → human approval → versioned edit)

1. During any task, when a reusable lesson emerges (a failure mode, a proof
   technique, a naming decision), draft a skill patch as a `proposals[]`
   entry: situation → input/output evidence → exact patch text → affected
   skill file.
2. NEVER apply it directly. The human approves (or edits) the proposal.
3. On approval: apply the patch, bump the skill's `## Changelog` section with
   date + one line, and record it in `tasks.json` (skill task entry).
4. If rejected: record the rejection reason in the proposal (prevents loops).

## Good / bad

- ✅ "Proposal: add selector-level CSS proof to gates — evidence: bg-primary
  substring counts hid missing utilities for three passes."
- ❌ Silently rewriting a skill mid-task because "it's obviously better".
- ✅ Changelog entry per accepted patch; skills stay reviewable history.
- ❌ Deleting a rule that blocked you instead of proposing its change.

## Seeded precedent

This loop's first entries: the tree-graphics case log (decorative-graphics),
the substring-proof fiasco (gates + debug-frontend), the bg-conflict ternary
rule (utility-first-jsx + cascade-layers).
