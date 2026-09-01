# Orchestra coordination protocol

Use one root orchestra as the global control plane. It may delegate genuine child graphs to subordinate orchestras; all orchestras coordinate and all implementation belongs to ticket workers. Worker and subordinate-orchestra counts have no policy limit. Safe concurrency is determined by dependencies, resource claims, and actual platform capacity.

## 1. Reconcile the starting state

Record the spec, repository instructions, checkout, overall `HEAD`, initial status, active tasks, and existing handoffs. Assign every dirty path or hunk to a known owner before implementation starts. An interrupted worker retains its claim until its WIP is handed off or deliberately resolved.

Keep one authoritative root ledger. Each row records scope, parent orchestra, dependencies, worker and task IDs, model and effort, state, `base_head`, read/write claims, exclusive resources, wait cursor or heartbeat, commit, checks, decisions, and deferred evidence. A subordinate maintains a view of its rows but reports every transition to the root. Transfer the complete root ledger through `$handoff`; mirror it only to an existing ignored scratch location when durable local recovery is needed and repository rules allow it.

Completion criterion: every existing modification has an owner and no active or archived worker can still mutate an unrecorded resource.

## 2. Build both graphs

Maintain two graphs:

- The **dependency graph** answers which tickets are product-ready.
- The **conflict graph** answers which ready tickets can execute together.

Before editing, each worker proposes a claim with:

- ticket and acceptance boundary;
- `base_head` and initial dirty boundary;
- expected read set and write set;
- exclusive resources;
- required decisions, environments, and generated artifacts.

Resources include more than source paths: schema or migration namespaces, lockfiles, barrel exports, generated clients, Git index and commit, local servers, simulators, databases, ports, credentials, test data, and tracker items. Treat different files as conflicting when they change the same invariant or generated output.

Multiple readers may share a resource. Grant at most one writer for an exclusive resource. Default to path ownership in a shared checkout; grant same-file hunk ownership only when the separation is stable and can be verified before commit. A worker that discovers a new write or decision pauses before the change and requests a claim expansion.

Completion criterion: every active worker has a non-conflicting granted claim, and every blocked ready ticket names the exact dependency or resource holder.

## 3. Choose the checkout topology

Prefer one isolated worktree and branch per implementation ticket when repository rules and the user permit them. The root orchestra creates each worktree from a clean committed fixed point and records its path, branch, base commit, ticket, and owner. Workers use the assigned worktree; they do not create, move, reuse, or remove worktrees themselves.

Use a shared checkout only when repository rules require it, the task is read-only, or existing uncommitted WIP is still being recovered. Never seed multiple worktrees from the same dirty `working-tree`: first assign every hunk to one ticket, then preserve it as a scoped commit or exact patch and apply it only to its owner worktree.

Each worktree worker performs its own staging, scoped commit, review, and final local checks without a global Git-index lease. The root still serializes integration into the target branch using the repository's approved merge or cherry-pick convention. Integration conflicts go to a focused worker; do not resolve them opportunistically in the root orchestra.

Worktrees isolate files and Git indexes, not shared databases, simulators, devices, ports, credentials, test accounts, or external trackers. Keep claims and leases for those resources.

Completion criterion: every implementation worker has either one clean isolated worktree or an explicit reason to share a checkout, and no WIP was duplicated across worktrees.

## 4. Dispatch the frontier

Dispatch every ready ticket whose claim is grantable, up to tool or platform capacity. Create a subordinate orchestra only for a real child graph with its own frontier, dependencies, and multiple worker lifecycles; a single ticket or implementation slice goes directly to a worker. Before delegating, confirm the subordinate has a worker-dispatch path. If it does not, the root retains dispatch while the subordinate performs read-only planning and monitoring.

Only the root grants global claims, Git leases, cross-graph reassignments, or worker configuration changes. A subordinate may dispatch and follow workers only inside claims the root already granted to its child graph.

Pass context pointers instead of copied artifacts. Preserve any model and reasoning effort chosen by the user across workers, fixes, and successors; never silently downgrade them. Keep the service tier non-fast unless the user explicitly requests `fast` in the current task. Urgency, AFK execution, concurrency, or a historical fast task does not authorize it. Record worker ID, task ID, model, effort, service tier, wait cursor, ticket, claim, and state in the ledger.

Treat runtime configuration as a recovery gate. A model/effort name written in the prompt or local config is an intention, not evidence that the task actually uses it. If task creation cannot apply an explicitly required model/effort, make the creation turn a no-work bootstrap and send the real task in a follow-up turn with an explicit message-level override. Require the task to acknowledge its actual model, effort, and non-fast tier before it receives implementation or orchestra ownership. A mismatched task may inspect nothing beyond what is needed to diagnose configuration and cannot accept a claim.

Use these worker states: `blocked`, `ready`, `active`, `integrating`, `locally_done`, and `needs_decision`. A failed or interrupted worker remains `active` with a stale heartbeat until the orchestra captures its WIP and deliberately transitions it.

Completion criterion: every ready, non-conflicting ticket is active or queued only by real platform backpressure.

## 5. Keep control and implementation separate

The root orchestra reads, schedules, waits, verifies claims, grants integration leases, updates the tracker, and judges global acceptance. A subordinate reads and coordinates its child graph, proposes claims, dispatches authorized workers, validates their evidence, and reports transitions to the root. Every orchestra sends code changes and cross-ticket fixes to workers. A ticket worker implements only its claim and does not dispatch another worker or mutate tracker state unless the root explicitly delegates that single tracker action.

Use compact progress snapshots. Continue the same worker for fixes and clarification. Do not duplicate a ticket because a response is slow, a task was archived, or context changed; first read its last state and handoff.

### Review delegation and context economy

The ticket worker owns the ticket-local review and final evidence: TDD, Standards/Spec, simplify-code, focused checks, and the scoped commit. The root may additionally grant the worker a read-only cross-ticket review claim when it provides the exact integrated baseline commits and named invariants to compare. The worker then returns a compact integration packet containing:

- the reviewed fixed point, current `HEAD`, and claimed path boundary;
- compatibility findings against the named integrated commits and shared invariants;
- blockers or required follow-up claims;
- the smallest post-integration smoke checks;
- deferred platform, database, or distribution evidence.

The root should consume this packet rather than replaying the worker's full diff, review transcript, or complete test suite. Root-side verification remains limited to claim/path/ancestor checks, the smallest combined checks that exercise changed seams, and any risk the packet identifies. Only an unexpected integration change or an unresolved global finding justifies a second full review. This saves orchestration context without transferring global ownership: the root still decides integration, tracker mutations, final acceptance, and archival.

Completion criterion: every implementation diff has exactly one ticket worker owner, no orchestra has implementation WIP, and the root ledger matches every subordinate view.

### Context succession

At each synchronization point, record any available context-usage signal in the root ledger. Every orchestra, including the root, prepares a `$handoff` capsule from roughly 220K tokens and must transfer at the next safe boundary once it reaches 240K with unfinished work. It stops opening new phases while succession is in progress.

The successor inherits the same child graph, model, reasoning effort, non-fast service tier, worker task IDs, wait cursors, worktrees, branches, decisions, and remaining gates. It reads the capsule and marked must-read artifacts, verifies its actual runtime plus live repository and worker state, and returns a recovery acknowledgement before the root changes the owner. Existing workers keep running; neither orchestra duplicates or moves them during succession.

Completion criterion: the successor can name the objective, current frontier, active workers, owned worktrees, blockers, last verified signals, and exact next action before the predecessor releases ownership.

## 6. Integrate Git, not workers

In a shared checkout, the Git index and commit are exclusive resources even when source edits are independent. In isolated worktrees, each worker owns its own index and branch; the exclusive resource is integration into the target branch.

Before granting the lease:

1. refresh `HEAD` and status;
2. compare the worker's claimed paths with its initial boundary;
3. verify no foreign change entered the ticket diff;
4. stage only explicit claimed paths or proven hunks;
5. inspect the staged diff and run the ticket's final checks;
6. create one scoped commit and release the lease.

After a commit, update every active worker's observed `HEAD`. If the commit touched another worker's read set or invariant, move that worker back to validation before integration. Broad staging, reset, stash, checkout, clean, and history rewriting are outside this protocol unless separately authorized by repository rules and the user.

Treat a final test, typecheck, build, simulator, server, or database run as a resource claim too. When its read or write footprint intersects another active mutation, wait for those workers to commit or pause them at a safe point for the validation window. A result observed against unrelated uncommitted code is provisional, not ticket acceptance evidence.

Completion criterion: every commit maps to one ticket claim, shared indexes are empty after lease release, every worktree branch has one owner, and remaining WIP still maps to active claims.

## 7. Integrate by frontier

After the active frontier has committed, consume each worker's integration packet, verify the combined state, and run the smallest cross-ticket checks that exercise shared seams. Resolve integration findings through a focused worker with a new claim. Advance dependent tickets only after their required commits and decisions are present.

Local tests run while other workers have WIP are provisional when that WIP can affect the result. Final ticket evidence comes from the Git-lease window; final spec evidence comes from the integrated committed state.

Completion criterion: the frontier commits coexist, shared checks pass or have an owned blocker, and every newly ready ticket has been reconsidered for dispatch.

## 8. Report orthogonal completion

Track local implementation, deferred environment evidence, tracker state, and distribution separately. Transferring a platform test to its designated evidence issue removes it from ordinary implementation blocking unless the current delivery explicitly names it as a gate. A missing push capability or manual handoff does not change a locally done result.

Archive a worker only after its final state, commit, checks, remaining evidence, and claim release are recorded. A handoff transfers the ledger, active worker identifiers, cursors, claims, current `HEAD`, status, and next frontier.

Completion criterion: no completed work is downgraded by an orthogonal pending action, and no pending action is reported as completed.

## 9. Write for the human

Every Codex task is user-visible. Lead with a plain-language decision, then explain:

1. what this task found or completed;
2. what it owns;
3. what can happen now;
4. what must wait and who owns the blocker;
5. the exact next action for the root orchestra.

Keep coordination metadata at the end as a small Markdown table with human labels such as `状态`, `负责范围`, `冲突资源`, `依赖`, and `下一步`. Omit empty fields and exhaustive read sets when they do not change a decision. Link or name exact files only where the user or root must inspect them.

Do not expose the ledger as a single pipe-delimited line, raw JSON/XML, a prompt dump, or an unbroken list of internal identifiers. Translate states and conflicts into ordinary language; retain code identifiers only when precision requires them.

Completion criterion: a user can understand the outcome and next action from the first screen without decoding orchestration syntax.
