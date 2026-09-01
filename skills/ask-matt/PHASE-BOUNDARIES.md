# Phase boundaries

A **phase** is a chunk of work inside a task: grilling, ticketing, implementation, or QA. A **phase boundary** is the safe point where ownership and context can move without splitting an unfinished thought. An orchestra also treats each worker synchronization point as a boundary.

## The four options

| Option | What it does |
| --- | --- |
| **Continue** | Keep the primary conversation and its full reasoning. |
| **`/clear`** | Start unrelated work without carrying this context. |
| **Worker task or subagent** | Isolate bounded independent work and return its result. |
| **`/handoff`** | Curate relevant decisions and live state into a fresh successor task. |

## The tree

Work top to bottom at the boundary. The first yes wins.

**1. Is the next phase small enough to finish here, and does it benefit from the full reasoning?** Continue. This is the cheapest and highest-fidelity route. For an orchestra near its context threshold, use `/handoff`'s finishing exception only when workers are done and the remaining verification, closure, and report are genuinely short.

**2. Is the existing context irrelevant to the next work?** Use `/clear`. The old task remains the source for the completed work; the new work starts without inherited assumptions.

**3. Is there bounded independent work while this task should retain ownership?** Open a worker task or dispatch a subagent. Give it source pointers and one completion criterion. The coordinator keeps the main flow and receives only the evidence needed to advance it.

**4. Otherwise, use `/handoff`.** Curate the objective, decisions, pointers, Git state, live worker identifiers, verification, frontier, and exact next action. Start a fresh successor task from that capsule and retire the predecessor as coordinator. This is the continuation route for relevant context that still has substantial work ahead.

Automatic product compaction is not a workflow boundary: it chooses what survives without exposing that editorial decision. A curated handoff makes the preservation choices explicit and inspectable.

## Fidelity

Continue retains the full primary conversation but leaves less room. Worker tasks retain only one bounded branch. Clear carries nothing. Handoff is deliberately selective: it loses transcript detail while preserving the facts and reasons that can change the successor's decisions.

Make the choice at a boundary. Mid-phase, continue until the next stable checkpoint or split only a genuinely independent branch.
