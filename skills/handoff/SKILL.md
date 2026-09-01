---
name: handoff
description: Curate a loss-minimizing handoff to another task or person. Use when the user asks for a handoff, an authorized workflow needs a portable side branch, or an orchestra still has substantial work near 350K context tokens and should transfer before roughly 400K.
argument-hint: "What will the next session be used for?"
---

A handoff is deliberate **semantic compression**: preserve the state that can change the next agent's decisions and remove transcript noise. Do not use automatic compaction or a full-history fork as the handoff artifact.

## Automatic orchestra trigger

At each orchestra synchronization point, check any available context-usage signal.

- From roughly 350K tokens onward, compare the remaining work with the cost of transfer.
- If all workers are done and only final verification, tracker closure, or the completion report remains, finish in the current orchestra even near 400K.
- If unresolved ticket frontiers, worker coordination, integration, or likely fix cycles remain, hand off at the next safe synchronization boundary and before roughly 400K.
- When no exact meter is available, do not invent a count. Use a natural milestone once the task is clearly long and still has multiple material phases left.

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

When the target is another Codex task and task creation is authorized by the user or the outer workflow, create a fresh task in the same approved project and checkout. Seed its initial prompt with the curated capsule and its recovery path. Do not seed it with the full conversation history.

- For **succession**, transfer all live-work identifiers, wait until the successor task is ready, then stop dispatching or coordinating from the predecessor so there is one owner.
- For a **side branch**, give the new task one bounded question and the parent task ID. Keep the parent as owner; return only the artifact pointers, evidence, and verdict needed to resolve that branch.

For a colleague, another harness, or an environment where task creation is unavailable, return the capsule path for manual transfer. A succession handoff is complete when the new owner has the sources, live work identifiers, current frontier, and next action needed to continue without rediscovery. A side-branch handoff is complete when the worker has the single question, evidence sources, return target, and verdict format.
