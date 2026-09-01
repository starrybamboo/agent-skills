# Spec complexity audit

Reduce complexity before it becomes code. Judge the proposed architecture and failure policy, not implementation line count.

## 1. Freeze the outcome

Extract the user-visible outcome, compatibility requirements, security and data invariants, and recovery expectations. Separate these requirements from the mechanisms proposed to satisfy them.

Completion criterion: every proposed mechanism can name the outcome or invariant it serves.

## 2. Build the spec ledger

Account for every proposed:

- domain concept, module, seam, and adapter;
- durable state, status, generation, cache, index, tombstone, or duplicate representation;
- lifecycle, queue, scheduler, background process, lock, retry, compensation, or cleanup path;
- extension point, configuration switch, migration phase, compatibility layer, and operational procedure.

For each entry, record its owner, lifecycle, triggering scenario, and maintenance obligation. Mark it `keep`, `simplify`, or `remove`.

Completion criterion: every concept in the proposal is classified; no stateful mechanism remains implicit.

## 3. Challenge the scenario

Ask of every mechanism:

1. Is its scenario reachable under the proposed invariants, or merely imaginable?
2. Is it required by observed behavior, a committed product promise, an adversarial threat, or a realistic failure mode?
3. What are the probability, impact, and recoverability?
4. Can a constraint make the bad state impossible?
5. Can the owning seam fail clearly instead of recovering automatically?

Prefer clear failure plus user retry when all are true:

- the failure is rare or transient;
- the action is understandable and repeatable;
- the operation is idempotent, or an existing idempotency key prevents duplicates;
- no irreversible side effect or partial commit escapes first;
- retry preserves authorization, ordering, and data integrity.

Keep dedicated machinery when retry can duplicate effects, lose data, cross a security boundary, violate ordering, or strand an unrecoverable partial state. Low probability alone never dismisses catastrophic or adversarial risk.

Completion criterion: every exceptional path is tied to concrete evidence and impact or removed from the design.

## 4. Design the simple baseline

Write the smallest end-to-end design that satisfies the frozen outcome. Compare the proposal against that baseline concept by concept.

Prefer, in order:

1. remove an unsupported requirement or unreachable state;
2. replace state with an invariant or derived value;
3. give one owner one representation of each fact;
4. reuse an existing seam with the same lifecycle;
5. fail clearly and retry safely instead of adding speculative recovery;
6. keep necessary complexity behind one deep module.

Reject a simplification when it moves lifecycle knowledge to callers, turns an invariant into convention, adds client or operator burden, or leaves failure semantics undefined.

Completion criterion: no known design preserves the same outcome with fewer concepts and obligations.

## 5. Resolve the spec

When edits are authorized, remove rejected concepts from the spec rather than leaving them as optional future branches. Record retained non-obvious complexity beside the scenario that earns it.

Report separately:

- **Removed or simplified decisions**;
- **Retained complexity and its evidence**;
- **Rejected mechanisms** that transferred complexity;
- **Open evidence** that could change the decision later.

Do not inspect test volume or implementation structure as the audit target. Existing code may inform feasibility, but sunk cost does not define the right design.

Completion criterion: the spec ledger is exhausted and the resulting architecture has an explicit complexity budget.
