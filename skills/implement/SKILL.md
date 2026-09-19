---
name: implement
description: "Deliver scoped work from a request, spec, or tickets, with one owner and risk-based review."
disable-model-invocation: true
---

Implement the authorized outcome in the current task. Follow repository instructions and existing decisions; use the smallest complete delivery that can be accepted independently.

## Own the delivery

Capture the starting commit, initial worktree changes, intended behavior, and completion condition. Read the current contract and affected code; fetch older discussion only to resolve a concrete gap. Preserve unrelated work, isolating task hunks where a file overlaps.

One owner implements, verifies, updates the affected source of truth, and commits. Continue across related tickets when that avoids repeated setup. Multiple tickets or sessions alone do not require an orchestra, a new task, or a worktree.

Delegate only when authorized and a bounded independent result can progress alongside useful local work. Give the worker the fixed base, owned paths, relevant source pointers, and acceptance condition. Use a new user-visible task only when the user requests one. A coordinator owns dependencies and integration seams; workers own their implementation and fixes.

## Verify and review

Use focused tests, typechecking, or builds for the changed behavior. For a defect, prefer a regression case that fails before the fix. Use TDD when requested or when it provides a useful feedback loop. Expand validation for demonstrated risk, required repository checks, or release scope; a full suite is not an automatic final step.

Use [code-review](../code-review/SKILL.md) to choose the review depth. Ordinary code normally receives one independent review combining requirements and consequential standards. Low-impact documentation, labels, and inventories use owner checks. Risk can justify an additional, distinct review; it does not automatically require two reviewers.

Give a reviewer one reviewable delivery, its fixed revision or exact patch, contract pointers, and existing evidence. After fixes, review the changed behavior and original counterexamples; reuse evidence whose code, contract, inputs, and relevant environment remain valid. A changed integration seam warrants a targeted check, not a replay of every worker check.

Remove obvious unnecessary machinery during implementation. A separate simplification workflow is optional and needs a concrete target; it is not a mandatory post-review stage.

## Finish once

Resolve in-scope findings, update only facts changed by this delivery, and make a scoped commit according to repository policy. Publish, close issues, or clean worktrees only within existing authorization and completion rules. Reuse the issue, spec, or existing evidence artifact rather than creating parallel ledgers.

Report the result, revision, meaningful checks, and remaining limits. For coordination, return compact evidence and pointers. The coordinator verifies integration and outstanding risks without becoming a second implementation team. Keep the user's model and reasoning settings; reducing duplicate work is not permission to lower them.
