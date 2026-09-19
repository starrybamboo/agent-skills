---
name: handoff
description: Curate a compact handoff when the user requests one, ownership moves, or substantial remaining work needs a fresh context. Preserve decisions, source pointers, exact state, and valid evidence.
argument-hint: "What will the next session be used for?"
---

A handoff is deliberate **semantic compression**: preserve the state that can change the next agent's decisions and remove transcript noise. Do not use automatic compaction or a full-history fork as the handoff artifact.

## Decide whether transfer helps

Continue locally when the remaining work is short or benefits from the existing context. A token count or synchronization point alone does not require handoff. For substantial remaining work, compare actual context problems and transfer cost; use a natural checkpoint when a new owner or fresh context would help. Automatic compaction does not invalidate completed work or require a restart.

## Curate the capsule

Write a standalone Markdown capsule containing:

- the objective, confirmed design root, success criteria, scope, non-goals, and authorization boundaries;
- decisions that still affect implementation, with their reasons, plus unresolved decisions;
- pointers to specs, issues, ADRs, plans, commits, diffs, and other primary artifacts;
- repository, branch, fixed point, current `HEAD`, dirty-path provenance, and any shared-worktree rules;
- for an orchestra, the ticket graph and frontier plus every active worker task ID, host ID, wait cursor, assignment, status, commit, and blocker;
- verification already run, results, reproducible baseline failures, and remaining acceptance gates;
- the exact next action and a `Suggested skills` section.

Reference existing artifacts by path or URL instead of copying them. Remove repeated discussion, superseded options, dead ends, raw tool output, and implementation detail recoverable from the referenced sources. Redact secrets and unnecessary personal information. If the user passed arguments, use them to prioritize what the successor needs.

Save the capsule in the operating system's temporary directory, outside the workspace.

## Deliver the capsule

When the target is another Codex task and the user explicitly requested creation of that task, create a fresh task in the same approved project and checkout. Seed its initial prompt with the curated capsule and its recovery path. Do not seed it with the full conversation history.

- For **succession**, transfer all live-work identifiers, wait until the successor task is ready, then stop dispatching or coordinating from the predecessor so there is one owner.
- For a **side branch**, give the new task one bounded question and the parent task ID. Keep the parent as owner; return only the artifact pointers, evidence, and verdict needed to resolve that branch.

For a colleague, another harness, or an environment where task creation is unavailable, return the capsule path for manual transfer. A succession handoff is complete when the new owner has the sources, live work identifiers, current frontier, and next action needed to continue without rediscovery. A side-branch handoff is complete when the worker has the single question, evidence sources, return target, and verdict format.
