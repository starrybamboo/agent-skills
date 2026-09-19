---
name: code-review
description: Review a branch, PR, or work-in-progress diff against a fixed base for correctness, requirements, and consequential coding standards. Use one combined reviewer by default and add reviewers only for distinct material risks.
---

Review the requested surface. User and repository rules determine scope and required checks. A standalone review is read-only: return findings without editing code, publishing comments, changing issues, or invoking a modifying workflow.

## Choose the depth

- Low-impact documentation, labels, or inventories: owner fact/link/script checks suffice during implementation. An explicitly requested review still happens in the current task.
- Ordinary code: one independent reviewer checks behavior, requirements, and consequential standards together. In a standalone review, the current reviewer fills this role; there is no default delegation.
- Privacy, authorization, deletion, irreversible data changes, or critical transaction/concurrency behavior: start with one reviewer focused on the concrete failure modes. Add a second only when a distinct material risk needs separate expertise or independent challenge. State the risk and divide the scope before delegating.

When implementation needs independence and delegation is authorized, use one bounded subagent with source pointers and an exact surface, not the full conversation. A coordinator who did not author the change may fill the reviewer role. Review of one's own implementation is self-review; if an independent reviewer is unavailable, report that limit rather than relabeling it or spawning a mandatory review tree. Honor explicit requests for multiple reviewers.

## Pin scope and sources

Resolve the supplied base and its merge-base with the candidate. For implementation, use the starting commit and initial worktree status captured by the owner. For a PR, use its base and head. Ask for a base only when it cannot be inferred reliably from the requested scope.

Capture candidate commit and worktree status, relevant committed/staged/unstaged diff, and in-scope untracked files. Read untracked files as added content. Keep unrelated dirty work outside the review; flag overlapping hunks whose provenance is unclear. A bad ref is an error. An empty surface means no changes to review, not evidence of correctness.

Use the explicit task or current issue/spec as the requirement source. Read project instructions for the affected paths. Consult linked history only for a specific unresolved decision. If a requirement source is missing, review what can be established and identify the uncertainty. Read tracker rules before tracker access when the repository provides them; do not run setup as part of a review.

## Review the actual risks

Follow changed behavior through affected callers and consumers. Check the requested outcome, regressions, scope creep, and applicable security/data invariants. Inspect tests as evidence; add or run a targeted probe when it resolves a concrete uncertainty. Reuse valid existing checks, and distinguish reported evidence from checks personally executed.

Apply documented standards where they affect correctness or maintenance. Look for unnecessary mechanisms, duplication with a real divergence risk, and misleading contracts. Name the practical consequence; a generic smell or preference alone is not a required refactor. Tool-enforced formatting and exhaustive smell catalogues do not need another model pass.

## Report and stop

Return one deduplicated list ordered by consequence. Each actionable finding includes severity, file/line or precise surface, trigger, impact, and contract or reproducible evidence. Separate required fixes from optional suggestions. State the reviewed base/candidate, validation used, and meaningful evidence gaps. Report no findings when that is the result; tests passing alone do not prove the entire contract.

After a fix, inspect the delta, original failure case, and affected neighbors. Broaden only for new evidence of risk. A second full review is not the default.

A review ends when actionable findings and limits are reported; it does not automatically launch simplification or another review. Persist results only in an existing delivery artifact when the task needs one, or when the user requests a handoff. Issue acceptance and closure remain with the delivery owner under repository rules.
