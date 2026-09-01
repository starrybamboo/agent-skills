---
name: code-review
description: Review committed and work-in-progress changes since a fixed point (commit, branch, tag, or merge-base) along two axes — Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
---

Two-axis review of the current change surface relative to a fixed point, including committed, staged, unstaged, and untracked work:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / spec?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings.

Use `docs/agents/issue-tracker.md` when the repository provides it. If it is missing, keep the review read-only: use the available spec sources and report that tracker integration is unavailable instead of running setup.

## Process

### 1. Pin the review surface

Whatever the user said is the fixed point — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc. When `$implement` calls this skill, it passes the starting `HEAD` and initial worktree status captured before implementation. If neither source provides a fixed point, ask for it.

Resolve the fixed point and its merge-base with `HEAD`. Capture the review surface once:

- tracked committed, staged, and unstaged changes: `git diff <merge-base>`;
- untracked files: `git ls-files --others --exclude-standard`, treating each in-scope file as entirely added;
- commit list: `git log <fixed-point>..HEAD --oneline`;
- reviewed revision and worktree state: `git rev-parse HEAD` and `git status --short`.

Before going further, confirm the fixed point resolves and the merge-base exists. Fail as empty only when the tracked diff is empty and there are no untracked files. A bad ref or genuinely empty surface should fail here — not inside two parallel sub-agents.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.) — fetch via the workflow in `docs/agents/issue-tracker.md`.
2. A path the user passed as an argument.
3. A spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

### 3. Identify the standards sources

Anything in the repo that documents how code should be written, such as `CODING_STANDARDS.md` or `CONTRIBUTING.md`.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below — a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation — and, like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy** — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality** — abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### 4. Spawn both sub-agents in parallel

**Standards sub-agent prompt** — include:

- The resolved merge-base, tracked diff command, untracked file list, commit list, and any initial worktree status supplied by the caller. Tell it to read each untracked file as added content and flag overlapping pre-existing changes whose provenance is unclear.
- The list of standards-source files you found in step 3, **plus the smell baseline from step 3** pasted in full — the sub-agent has no other access to it.
- The brief: "Report — per file/hunk where relevant — (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls — documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** — include:

- The resolved merge-base, tracked diff command, untracked file list, commit list, and any initial worktree status supplied by the caller. Tell it to read each untracked file as added content and flag overlapping pre-existing changes whose provenance is unclear.
- The path or fetched contents of the spec.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

### 5. Aggregate

Start with a compact review context: the fixed point, merge-base, reviewed `HEAD`, initial status when supplied, current worktree status, and spec source. Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings — the two axes are deliberately separate (see _Why two axes_).

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes — that's the reranking the separation exists to prevent.

When this review is the review stage of `$implement`, also return the exact in-scope issue IDs and whether each axis passed so `$implement` can close the tickets after the final simplification pass and commit. Keep a standalone review read-only; issue closure belongs to the implementation workflow.

### 6. Optional simplification handoff

A standalone review remains read-only: do not change code, write a review file, invoke a modifying workflow, or close issues.

When the user explicitly asked to review and simplify, or this review runs inside an implementation workflow that already has mutation authority, the caller may pass the review context, both axis reports, and the reviewed surface to `$simplify-code` after task-related hard Standards findings and all Spec findings are resolved. Complexity-related Standards judgement calls are candidates, not proof that deletion is safe; `$simplify-code` must freeze the behavior floor and run its own deletion test.

Exclude paths that were already dirty in the caller's initial status from the mutation handoff unless the caller has a pre-change baseline that isolates this task's hunks. If the task must overlap such a path and provenance cannot be separated, stop for direction rather than risking the pre-existing work.

The report itself is the handoff within one task. Persist it only when the user requests a cross-task handoff or the outer workflow already owns a durable feature artifact; the outer workflow chooses that existing location.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
