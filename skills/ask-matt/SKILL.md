---
name: ask-matt
description: Choose the smallest useful skill or workflow for the current situation.
disable-model-invocation: true
---

# Choose a workflow

Start from the user's outcome and existing decisions. Skills are tools to resolve a specific need; there is no required idea-to-ship sequence. Repository instructions and explicit user choices take precedence.

## Default: one task owns delivery

When the request is clear, implement it in the current task: inspect affected code, make the change, verify the relevant behavior, update changed facts, and commit under repository policy. `/implement` describes this delivery loop; `/code-review` owns review depth. Neither multiple tickets nor a long session automatically creates an orchestra. Continue in the current task while it can finish coherently; consult [PHASE-BOUNDARIES.md](PHASE-BOUNDARIES.md) only when deciding whether ownership or context should move.

## Add a tool for an actual gap

| Need | Tool |
| --- | --- |
| A material product decision is unresolved | `/grill-with-docs` in a repository, `/grill-me` without one; ordinary implementation details stay with the executor. |
| A broad effort has unknown dependencies or decisions | `/wayfinder`; reuse its decisions rather than reopening them. |
| An existing discussion needs a durable implementation contract | `/to-spec`; update the existing spec when sufficient. |
| Work has independently deliverable outcomes or different owners | `/to-tickets`; avoid splitting just to create a pipeline. |
| A runnable experiment would settle a design question | `/prototype`; keep the question and return evidence in the current task unless a separate task is needed and authorized. |
| Incoming reports need readiness assessment | `/triage`; approved tickets need reassessment only when their facts change. |
| A stubborn or intermittent defect needs diagnosis | `/diagnosing-bugs`; straightforward defects use a focused reproduction and fix. |
| A concrete behavior benefits from test-first development | `/tdd`. |
| A fixed diff needs review | `/code-review`; combine requirements and standards in one review by default. |
| Existing code has a specific complexity problem | `/simplify-code`; use `/reduce-complexity` for plans before implementation. |
| Module boundaries or domain language need work | `/codebase-design` or `/domain-modeling`; `/improve-codebase-architecture` for an explicitly requested broader survey. |
| A factual unknown needs primary-source investigation | `/research`. |
| Progress requires another person's knowledge or action | `/to-questionnaire` or `/wizard`, respectively. |
| Ownership genuinely needs to move | `/handoff`; provide decisions, pointers, exact state, and next action. |

`/grilling` is the interview primitive, `/wait-what` clarifies an explanation, `/teach` supports learning, `/resolving-merge-conflicts` handles an active conflict, and `/writing-for-agents` guides agent-facing documents. Use them for those needs rather than as delivery gates.

If an explicitly selected workflow needs missing tracker or document setup, use `/setup-matt-pocock-skills`. Existing usable repository conventions satisfy that prerequisite; ordinary implementation does not require setup.
