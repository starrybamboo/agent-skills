---
name: implement
description: "Implement agreed work with timely verification and review."
disable-model-invocation: true
---

Implement the agreed outcome from the user's request, spec, or tickets. Read the affected code and current requirements, and follow existing decisions and repository instructions.

Choose how to execute, collaborate, isolate changes, and organize commits based on the work, dependencies, concurrent activity, and available tools. Preserve existing work and coordinate operations on shared state.

Get feedback early and throughout implementation with focused tests, typechecking, or builds. Use [tdd](../tdd/SKILL.md) when requested or useful; for defects, prefer a regression case that fails before the fix. Match validation to the affected behavior, demonstrated risk, and required repository or release checks.

Use [code-review](../code-review/SKILL.md) for appropriate review and resolve in-scope findings. Reuse evidence that remains valid; after fixes, check the changed behavior, original failure cases, and affected neighbors.

Update the facts affected by the change and complete the authorized delivery, including commits under the user's and repository's rules. Report the result, meaningful checks, and remaining limits.
