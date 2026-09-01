---
name: afk
description: Continue already-authorized work while the user is away from the keyboard, sleeping, eating, commuting, or otherwise unavailable. Use when the user says they are leaving and wants Codex to keep working, monitor tasks, finish, babysit, or perform cleanup without further interaction. Advance independent wrap-up while leaving unrelated suspended work untouched; resolve only blocking in-scope choices from established preferences, project instructions, code evidence, and the simplest-correct default.
---

# AFK

Treat the user's departure as delegation of in-scope judgment, not as permission to expand the task. Finish the existing objective without depending on the user being available for routine choices.

## Establish the AFK contract

1. Capture the active objective, completion condition, repositories or tasks in scope, already-authorized external actions, and explicit prohibitions.
2. Preserve the current authorization envelope. AFK does not independently authorize a new feature, branch, worktree, deployment, purchase, destructive action, credential use, or external communication.
3. Inspect active tasks, automations, and pending questions. Mark which ones are prerequisites for the completion condition and which can remain suspended without blocking it.
4. Continue until the completion condition is met or a genuinely material boundary is reached. User absence is expected state, not a blocker.

## Consume delegated judgment

An agent, tool, or task asking a question does not make the question material. Reclassify it before deciding whether to wait.

### Decide and continue

Resolve a choice autonomously when it stays inside the approved behavior and system boundary. Use this priority order:

1. Follow explicit user decisions, `AGENTS.md`, accepted specs, ADRs, and existing project conventions.
2. Preserve security, authorization, data integrity, and already-approved failure semantics.
3. Choose the simplest end-to-end option that satisfies the confirmed requirement.
4. Prefer reversible changes, existing mechanisms, fewer concepts, and lower regression risk.
5. Use code evidence and targeted verification to break remaining ties.

Record the decision and its reason, then keep working. Do not defer ordinary implementation choices such as exactness beyond the requirement, local refactor shape, cache settings, batching, test seams, tool selection, retrying a safe transient failure, or a recommended simple option versus a more elaborate general solution.

Do not turn AFK into task rescue. A suspended, idle, or archived task may stay exactly as it is when its remaining work is independent of the completion condition. Continue the available wrap-up without touching that task.

Only when the suspended work is a real prerequisite, resolve a non-material choice directly and resume the same task. Restore an archived task only when completing that prerequisite requires it; do not revive work merely to make every task look closed.

### Stop at a material boundary

Pause only when continuing requires authority that the user did not already grant, including:

- changing product meaning or expanding the requested feature or system boundary;
- a database entity-mapping change that requires human approval;
- an unauthorized production or environment change, secret use, purchase, or external message;
- a destructive or difficult-to-recover action;
- weakening security, authorization, data integrity, or an explicit reliability guarantee;
- choosing between materially different user-visible outcomes with no established preference or evidence.

Complete every independent safe part before stopping. Leave one consolidated blocker that states the exact new decision or authority required and the safest default; do not repeatedly wake or ping the absent user.

## Run the AFK loop

1. Progress every independent safe step first. Wait for or intervene in another task only when the dependency map says it gates the completion condition.
2. Treat `idle` and `needs input` as neither automatic blockers nor invitations to take over. Leave non-blocking work suspended; resolve blocking non-material questions without the user.
3. Diagnose and fix in-scope validation failures. Retry safe transient operations with a bounded attempt count.
4. Perform commits, pushes, packaging, issue closure, or deployment only when the pre-AFK request already authorized that action.
5. Avoid new follow-up tasks, infrastructure, cleanup scope, or speculative improvements unless they were explicitly included.
6. Stop recurring automation after completion so it cannot repeat writes or create duplicates.

## Return report

When the user returns, report:

- completed work and verification evidence;
- autonomous decisions that materially shaped the implementation;
- commits, remote state, and artifacts when applicable;
- only the remaining blockers that truly require new authority.

AFK is complete when the authorized completion condition is met. Independent suspended work may remain and should be reported as deferred context, not as a blocker. A partial result is complete only when every unfinished prerequisite crosses a material boundary above.
