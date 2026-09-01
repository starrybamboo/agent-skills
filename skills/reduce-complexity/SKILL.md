---
name: reduce-complexity
description: Reduce accidental complexity in ideas, plans, ADRs, and specifications before implementation. Use for a spec audit, subtraction audit, complexity budget, simpler architecture, or over-engineering review at the product and architecture surface; use simplify-code for implementation changes.
---

# Reduce Complexity

Audit only the product and architecture surface. Read [references/spec-audit.md](references/spec-audit.md), then judge which concepts, guarantees, and failure policies should exist before they become code.

Choose the mutation mode from the request:

- For an audit or review, report without editing.
- In an authorized spec-writing workflow, edit only the idea, plan, ADR, or specification.
- For an implementation, diff, module, interface, test suite, or operational machinery, use `$simplify-code` instead.

Existing code may inform feasibility, but sunk implementation cost does not define the right design. Completion criterion: the spec surface and mutation authority are explicit, and the spec-audit ledger is exhausted.
