---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea, from its design intent through an implementable shape. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Before growing the tree, establish its **design root**: why this is being done, the result or experience the user wants, its broad shape, how success will be recognised, and the constraints or non-goals that bound it. Synthesize these fields into one proposed root from the user's language and the available facts; do not turn them into a preliminary questionnaire. Put the whole proposal to the user in one correction-or-confirmation question. Ask one blocking question instead only when contradictory or missing facts make a credible proposal impossible. End that round there and wait: do not process the implementation frontier in the same response. Keep the root live: when a later choice drifts from or changes it, return to the whole root before continuing.

The design root and grouped questioning are consecutive stages, not alternative interview modes. Confirm the root first; once it is confirmed, every later round batches the entire current frontier.

Keep a **complexity budget** on the tree. Whenever a branch introduces durable state, another lifecycle, retry or compensation machinery, a cache, background work, a new abstraction, or handling for a highly unlikely scenario, add a frontier node that tests what concrete outcome earns it and whether a constraint, clear failure, or safe user retry produces a simpler design. Prefer the simple branch when it preserves safety and recoverability; do not call a design simpler when it merely moves complexity to callers or operations.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled — the nodes you can resolve _now_ without guessing at answers you haven't heard yet. A round is atomic: process every node on the current frontier before yielding to the user. The design-root confirmation is the only intentionally single-question round. After it, yield with one material question only when the frontier itself contains one node. Keep independent frontier nodes as separate numbered blocks in the same response; couple nodes only when one end-to-end choice must settle them together.

Before drafting each post-root round, run a **frontier audit** across the whole known tree:

1. Enumerate every unresolved material node, including siblings on branches other than the one most recently answered.
2. Mark a node blocked only when a specific unanswered prerequisite prevents you from stating its credible alternatives or recommended answer. A prerequisite that merely changes the likely recommendation, wording, default, implementation, or later refinement leaves the node ready now.
3. Put every ready node into this round. Keep independent nodes as separate numbered blocks; turn interacting siblings into one end-to-end **Compare** instead of serialising their ingredients.
4. Route ready facts, ordinary decisions, and delegations in the same round. Only their genuinely downstream nodes wait.

Apply a **single-question gate** after the design root: a round may contain one material question only when the audit finds exactly one ready material node. State one concise frontier note explaining either that it is the only unresolved material node or naming the specific unanswered prerequisite that blocks each other known node. If you cannot name such a prerequisite, that node belongs in the current round.

Route every frontier node through one of these outcomes:

- **Compare** before asking when two or more material nodes are coupled into one mainline choice. Present exactly three structurally different, end-to-end variants instead of asking the user to settle their ingredients first. Hold all three to the same applicable frame: intended result and user experience, affected surfaces, state and lifecycles where present, failure and recovery where relevant, guarantees, and complexity cost. Carry the underlying considerations and your defaults inside each variant so the user sees what a design must account for. Variants must be credible alternatives, not cosmetic changes or padding. Mark exactly one variant as `（推荐）` in its heading or table label, then explain that recommendation once after the three variants. End that numbered block with one neutral choice question, then continue with the remaining frontier nodes. The recommendation lives only in the marked variant and its single explanation. The node remains open until the user selects, revises, or explicitly defers the choice.
- **Ask** a standalone material question when the answer changes the design root, user-visible behaviour, a safety or data-integrity boundary, a reliability promise, or a hard-to-reverse cost and cannot be understood through a complete comparison. Number the question, give your recommended answer, then continue with the remaining frontier nodes.
- **Decide** ordinary implementation details yourself. For a small or off-mainline cluster, supply one coherent subdesign rather than making the user assemble it from local questions. Show the relevant considerations, the chosen defaults, and why they fit the root.
- **Delegate** bounded fact-finding, variant exploration, and side designs that would crowd the main conversation. A delegated branch is unresolved until its evidence is brought back to the tree.

Number every **Compare** or **Ask** decision in one sequence and separate consecutive blocks. An **Ask** block ends with its recommendation line. A **Compare** block uses the same numbered heading, then contains its three variants, one recommendation paragraph, and the neutral choice question from the Compare rule. A round with consecutive Ask blocks looks like this:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body>

➡️ <your recommended answer>
```

After every node on the current frontier has been asked, decided, or delegated, yield once and wait for the user's answers. Each round the user answers reshapes the tree — settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and process the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier node needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it — don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the nodes downstream of it wait for the sub-agent to report — process the rest of the frontier now. Material decisions are the user's; ordinary implementation decisions are yours to make and expose.

Protect the main conversation's context. Use sub-agents for bounded work that can return without user interaction, and `/research` only when the user has authorised a durable cited artifact. When a branch needs an interactive or iterative prototype, a separate harness, or sustained user feedback, actively move it to a fresh task instead of building it inline: use an available user-authorised task-creation mechanism, or ask the user to invoke `/handoff`. Seed that task from the confirmed design root and the single question to answer, following the handoff's compact, source-pointer-based contract. Return only the artifact or source pointers, the observations, and the verdict to the main tree.

When the written variants are insufficient for the user to judge a UI, state model, or logic choice, route that single question through `/prototype` in the delegated context and follow its artifact and variant rules. Its artifact is primary evidence; its summary is only an index back to that evidence.

The session is done when the frontier is empty: every branch of the design tree has been answered after asking, resolved by a selected or revised variant, decided with visible reasoning, answered by delegated evidence, or moved outside the root with an explicit owner and condition for re-entry. Keep a compact synthesis so the design root survives into the specification, tickets, and implementation. When the user invoked Grilling itself to produce a spec, finish with a formal implementation-ready spec; when another flow invoked it, return the confirmed root and decisions to that caller without expanding them. Do not act on the design until the user confirms you have reached a shared understanding.
