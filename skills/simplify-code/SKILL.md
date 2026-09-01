---
name: simplify-code
description: Simplify existing implementation code, tests, modules, state, or operational machinery without changing approved behavior, architecture, or failure policy. Use when the user asks to simplify code, remove over-engineering, clean up a reviewed diff, or when an authorized implementation workflow reaches its final simplification pass.
---

# Simplify Code

Remove concepts and maintenance obligations, not merely lines. A code-review report is evidence to inspect, not modification authority and not proof that a deletion is safe.

## 1. Fix the authority and behavior floor

Choose the mode from the user's request:

- A review, audit, or complexity assessment is read-only.
- An explicit request to simplify, clean up, refactor, or review and simplify authorizes scoped edits.
- An authorized implementation workflow may invoke this skill for its final behavior-preserving reduction pass.

Read the request, accepted issue or spec, repository instructions, relevant architecture decisions, target diff, and any code-review report. Spec mismatches and hard Standards violations are preceding implementation work, not simplification: the caller must resolve them first. If one remains in the affected area, report it and stop there; do not repair it under this skill merely because the desired behavior is documented. An independent area may still be simplified when its own behavior floor is settled.

Record the floor that every reduction must preserve:

- observable success and failure behavior;
- security, authorization, data, transaction, and concurrency invariants;
- compatibility and migration constraints;
- recovery and operational guarantees already approved.

If a candidate changes that floor, architecture ownership, or failure policy, return it for a product or architecture decision. Do not present that change as code simplification.

Completion criterion: the mode and behavior floor are explicit.

## 2. Build a targeted code ledger

Start from the requested area, changed diff, and review findings. Account for every materially added or expanded:

- module, public interface, adapter, abstraction, configuration switch, or test seam;
- state, cache, duplicate fact, status, or state transition;
- lock, scheduler, queue, background task, retry, compensation, or cleanup path;
- fixture or test coupled to private structure.

Record the callers and continuing maintenance obligation for each candidate, then mark it `keep`, `simplify`, or `remove`. Count concepts and obligations before line count.

Completion criterion: every in-scope candidate is classified, names the behavior floor it preserves, and every stateful or lifecycle-owning candidate is examined.

## 3. Run the deletion test

Imagine deleting or collapsing the candidate and trace where every rule, state, ordering constraint, cleanup duty, and failure path goes. A real reduction makes an obligation disappear.

Reject the change when it:

- copies the same rule into callers;
- makes callers own ordering, lifecycle, cleanup, retries, or state;
- turns a typed invariant into comments or convention;
- moves burden into configuration, deployment, support, debugging, or future maintenance;
- hides failures or removes the only test that observes valuable behavior.

Prefer, in order:

1. delete unreachable, unused, or speculative implementation;
2. collapse duplicate facts and representations;
3. derive values instead of storing another state;
4. merge shallow modules and hypothetical one-adapter seams into their owner;
5. shrink public interfaces and keep test seams internal;
6. reuse an existing project mechanism;
7. keep necessary complexity behind one deep module.

Do not introduce a generic framework to remove local code. A small class that centrally owns a real lifecycle may already be the simplest design.

Completion criterion: every accepted change lowers total implementation and operational complexity rather than relocating it.

## 4. Preserve useful tests

Keep tests for observable security, authorization, concurrency, transaction, idempotency, data integrity, wire, and historical regression behavior.

Merge or remove tests that only restate private structure, annotations, exact collaborator order, or a production interface created only for tests. For every removed test, identify the surviving stable-seam test that still fails on regression.

Completion criterion: each removed test is redundant or observes no valuable behavior.

## 5. Apply and verify

In review-only mode, report the ledger and proposed reductions without changing files.

In mutation mode, apply the smallest coherent reduction. After each reduction cluster:

1. run the narrow checks at the preserved seam;
2. run any broader checks required by the repository or request;
3. inspect the diff for replacement abstractions and shifted obligations;
4. compare the ledger before and after.

If no safe reduction exists, keep the code and say so. Do not create cosmetic churn to force a non-empty diff.

Review-only completion criterion: every in-scope candidate is classified, safe candidates are distinguished from rejected or escalated changes, and no files were modified.

Mutation completion criterion: checks pass and at least one concept or obligation disappeared, or the report demonstrates why no safe reduction exists.

## 6. Report

Report separately:

- removed or simplified concepts and surviving coverage;
- retained complexity and the invariant that earns it;
- rejected deletions that would transfer complexity;
- verification performed and any unresolved product or architecture decision.

Do not claim success from negative line count alone.
