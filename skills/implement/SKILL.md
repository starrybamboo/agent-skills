---
name: implement
description: "Implement one ticket directly, or coordinate unbounded ticket workers through an orchestra hierarchy."
---

Route by the unit the user passed before changing files.

## Ticket route

Use the current task as the implementer when the scope is one ticket, one issue, or a small piece of work with no child ticket graph. Do not create an orchestra for this route.

Before changing files, record the current `HEAD` as the code-review fixed point and capture the initial worktree status. Treat initially dirty paths as outside the later simplification mutation unless an available pre-change baseline can isolate this task's hunks; stop for direction when required work overlaps a path whose provenance cannot be separated.

When an orchestra dispatched the ticket, edit only the granted mutation claim. Pause before touching a new path, shared generated artifact, schema namespace, runtime, or tracker item and ask the orchestra to expand the claim. The orchestra owns worker dispatch and tracker state; the worker owns only its ticket implementation and evidence.

Use `/tdd` where possible at pre-agreed seams. Run typechecking and focused test files regularly.

Once done, use `/code-review` with the recorded fixed point and initial status to review the complete working change surface. Resolve task-related hard Standards findings and all Spec findings, then pass the review context, both axis reports, and the final change surface to `$simplify-code` for one authorized behavior-preserving pass. If `$simplify-code` escalates a product, architecture, or failure-policy decision, stop and return it for a decision.

After the final simplification pass, inspect the resulting diff and run the checks required by the repository and ticket. Repeat the full review only when simplification unexpectedly changes the behavior surface or introduces a new implementation area. In a shared checkout, obtain the orchestra's Git lease before staging or committing. Commit only this ticket's work to the current branch.

### Review ownership and context economy

The ticket worker owns the complete ticket-local review: TDD evidence, Standards/Spec findings, simplify-code, final checks, and the scoped commit. When the root orchestra supplies an integrated baseline and explicit read-only scope, the same worker may also perform the cross-ticket compatibility review for its change and return a compact integration packet. The packet should contain only changed claims, touched invariants, compatibility findings against the named baseline commits, blockers, required root smoke checks, and deferred evidence. The root consumes that packet instead of replaying the worker's full diff, review, and test transcript.

The root orchestra still owns the global ledger, mutation and integration leases, final acceptance judgment, tracker writes, and archive decisions. It reruns a full review only when the integration surface changes unexpectedly or the worker packet identifies an unresolved global risk.

## Spec route: orchestra

Use this route when the user passes an implementation spec or parent issue with multiple associated tickets. The current task becomes the **root orchestra** unless a parent orchestra delegated a child graph to it. The root owns the global task and conflict graphs, mutation claims, integration evidence, and final acceptance. A subordinate orchestra owns only its delegated child graph. Every orchestra remains control plane and sends implementation or fixes to ticket workers.

Before dispatching, read [references/orchestra-protocol.md](references/orchestra-protocol.md) completely. That protocol is mandatory whenever two or more ticket workers may share a repository, checkout, runtime, database, generated artifact, or tracker.

1. Read the complete spec and every scoped ticket, including comments and blocking relationships. Record the overall `HEAD`, initial worktree status, repository instructions, and the ticket frontier.
2. Delegate a genuine child ticket graph to a subordinate orchestra when separate coordination will reduce root load. A subordinate must have a worker-dispatch path; otherwise the root dispatches its workers while the subordinate plans and monitors them.
3. Choose the checkout topology. When repository rules and user authority permit it, give each parallel implementation ticket an isolated worktree from a clean committed fixed point. The root orchestra alone creates, tracks, integrates, and retires worktrees. Reconcile existing shared WIP before migration; never clone one dirty working tree into every worker.
4. Build the dependency graph and global resource-conflict graph. Reconcile every pre-existing dirty path with an owner before granting a mutation claim.
5. Open one implementer task for every ready ticket whose claim can be granted. Do not impose an arbitrary worker-count limit: dispatch all non-conflicting ready work up to actual platform capacity, and queue only dependency or resource conflicts.
6. Seed every orchestra and worker with context pointers, the requested model, reasoning effort, service tier, scope, fixed point, checkout, claims, initial dirty boundaries, and its completion gate. Preserve the configured non-fast tier unless the user explicitly requests `fast` in the current task. Verify the actual task runtime; prompt text and inherited config are not proof that the requested model or effort took effect. A subordinate orchestra cannot grant a global claim or integration lease by itself.
7. Follow orchestras and workers with compact task snapshots. Keep the root ledger authoritative for task ID, wait cursor, claim, status, commit, checks, decisions, and deferred evidence. Continue the same task for follow-up work. Every user-visible task update and final answer must follow the human-readable output contract in the protocol.
8. Serialize only exclusive runtime resources and integration into the target branch. Inspect each scoped commit and evidence, integrate it, then advance newly unblocked tickets. Revalidate workers whose read set was changed by an integrated commit.
9. When the graph is empty, review the full spec change surface from the root fixed point, send cross-ticket findings to focused workers, and run scoped integration checks.

The orchestra must follow `$handoff` for context succession. Treat that skill as the single source of truth for the current transfer threshold and safe boundary; do not copy a second token threshold into the implementation workflow. Transfer the root-ledger scope, active worker identifiers and cursors, and owned worktrees so the successor continues the same work rather than creating duplicates.

## Completion and tracker state

Keep these states independent:

- **Locally done**: accepted implementation, review, simplification, required local checks, and scoped commit.
- **Deferred evidence**: a named environment or platform check with an owner and destination; it does not downgrade locally done work unless the current delivery explicitly requires it.
- **Distribution**: push, merge, deployment, or a manual handoff. Report it separately from local completion.
- **Tracker**: comment, checkbox, label, dependency, or closure state. The orchestra alone updates it after reading repository and user authorization rules.

For every explicitly scoped issue, verify repository ownership and current state, then write only the tracker changes that current authority permits. Include commit SHAs, checks, baseline exceptions, and deferred evidence. A parent is locally done only after every scoped child is locally done and the full-spec integration pass succeeds.

Re-query every tracker mutation. Keep task-related failures open and report the exact blocker. If authentication, network access, or authorization blocks the write, preserve tracker state and return a handoff without changing the local-completion result.
