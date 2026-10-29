---
name: code-review
description: Review a branch, PR, or work-in-progress diff against a fixed base for correctness, requirements, and consequential coding standards. Use one combined reviewer by default and add reviewers only for distinct material risks.
---

Review the requested surface. User and repository rules determine scope and required checks. A standalone review is read-only: return findings without editing code, publishing comments, changing issues, or invoking a modifying workflow.

## Choose the depth

- Low-impact documentation, labels, or inventories: owner fact/link/script checks suffice during implementation. An explicitly requested review still happens in the current task.
- Ordinary code: one independent reviewer checks behavior, requirements, and consequential standards together. In a standalone review, the current reviewer fills this role; there is no default delegation.
- Privacy, authorization, deletion, irreversible data changes, or critical transaction/concurrency behavior: start with one reviewer focused on the concrete failure modes. Add a second only when a distinct material risk needs separate expertise or independent challenge. State the risk and divide the scope before delegating.

When implementation needs independence and delegation is authorized, use one bounded subagent with source pointers and an exact surface, not the full conversation. An agent who did not author the change may fill the reviewer role. Review of one's own implementation is self-review; if an independent reviewer is unavailable, report that limit rather than relabeling it or spawning a mandatory review tree. Honor explicit requests for multiple reviewers.

## Pin scope and sources

Resolve the supplied base and its merge-base with the candidate. For implementation, use the starting commit and initial worktree status captured by the owner. For a PR, use its base and head. Ask for a base only when it cannot be inferred reliably from the requested scope.

Capture candidate commit and worktree status, relevant committed/staged/unstaged diff, and in-scope untracked files. Read untracked files as added content. Keep unrelated dirty work outside the review; flag overlapping hunks whose provenance is unclear. A bad ref is an error. An empty surface means no changes to review, not evidence of correctness.

Use the explicit task or current issue/spec as the requirement source. Read project instructions for the affected paths, and search the repository for files that document how code should be written; `CODING_STANDARDS.md` or `CONTRIBUTING.md` belongs on that list when present. Consult linked history only for a specific unresolved decision. If a requirement source is missing, review what can be established and identify the uncertainty. Read tracker rules before tracker access when the repository provides them; do not run setup as part of a review.

## Review the actual risks

Follow changed behavior through affected callers and consumers. Check the requested outcome, regressions, scope creep, and applicable security/data invariants. Inspect tests as evidence; add or run a targeted probe when it resolves a concrete uncertainty. Reuse valid existing checks, and distinguish reported evidence from checks personally executed.

Apply documented standards where they affect correctness or maintenance. Look for unnecessary mechanisms, duplication with a real divergence risk, and misleading contracts. Name the practical consequence. Skip anything tooling already enforces.

### Smell baseline

On top of whatever the repository documents, every review carries this fixed set of Fowler code smells (_Refactoring_, ch.3), even when the repository documents nothing. When delegating a review, point the reviewer at this section. Two rules bind it:

- **The repository overrides.** A documented repository standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation. Report it as an optional suggestion with the hunk quoted, unless you can name a concrete consequence that makes it a required fix.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name**: a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code**: the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy**: a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps**: the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession**: a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches**: the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery**: one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change**: one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality**: abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains**: long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man**: a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest**: a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

## Report and stop

Report two axes under separate headings, because a change can pass one and fail the other, and one merged list lets a strong axis mask a weak one:

- **Requirements**: does the change do what the task, issue, or spec asked? Missing or partial requirements, scope creep, and behavior that looks implemented but is wrong. Quote the requirement for each finding.
- **Standards**: does the change follow documented standards and the smell baseline, and avoid unnecessary mechanisms and misleading contracts?

Deduplicate and order by consequence within each axis; don't merge or rerank across them. Give each axis its own one-line verdict and worst finding. When no requirement source exists, say so under Requirements instead of skipping the heading. Each actionable finding includes severity, file/line or precise surface, trigger, impact, and contract or reproducible evidence. Separate required fixes from optional suggestions. State the reviewed base/candidate, validation used, and meaningful evidence gaps. Report no findings when that is the result; tests passing alone do not prove the entire contract.

After a fix, inspect the delta, original failure case, and affected neighbors. Broaden only for new evidence of risk. A second full review is not the default.

A review ends when actionable findings and limits are reported; it does not automatically launch simplification or another review. Persist results only in an existing delivery artifact when the task needs one, or when the user requests a handoff. Issue acceptance and closure remain with the delivery owner under repository rules.
