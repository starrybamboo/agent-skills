# Ownership and context boundaries

Continue in the current task when it can carry the next step coherently. Finishing one phase, crossing a token threshold, or having several tickets is not by itself a reason to open more tasks.

- Delegate bounded independent work only when authorized and it can progress alongside useful local work. Pass the needed source pointers, owned surface, and completion condition.
- Create a user-visible task only at the user's request. A worker returns evidence to its owner; it does not recreate the coordination hierarchy.
- Use `/handoff` when ownership actually moves or relevant context has become costly to maintain. Curate decisions, exact Git/task state, valid evidence, remaining work, and the next action. Avoid copying the full transcript.
- If automatic compaction occurs, continue the same objective from the preserved state. Verify an uncertain pointer when needed; do not restart completed stages.

An existing coordinator resolves dependencies and integration seams. It reuses valid worker evidence and requests focused fixes for specific findings. Reports of completion trigger acceptance of the delivered unit, not a fresh implementation or a full parallel review by default.
