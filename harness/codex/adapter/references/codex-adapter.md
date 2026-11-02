# pstack adapter for Codex

Read this once per session before following the upstream pstack Skill. Apply
these replacements literally; drop fields that Codex does not support.

## Tool and field map

| pstack / Claude form | Codex form |
| --- | --- |
| `Task` or `Agent` | `agentstool__spawn_agent` |
| `AskQuestion` / `AskUserQuestion` | Ask one concise question in plain text only for a real product or preference decision |
| `TodoWrite` | Keep a visible Markdown checklist in the reply and update it at phase boundaries |
| `Read <pstack>/skills/<name>/SKILL.md` | Read the same absolute path directly |
| `Grep`, `Glob` | `rg`, `rg --files`, or a targeted shell read |
| `pstack:poteto-agent` | Spawn a normal Codex agent with the `poteto-agent` brief below |
| `pstack:comment-sicko` | Spawn a read-only Codex agent that reads `<pstack>/agents/comment-sicko.md` |
| `resume` | `agentstool__followup_task` |
| background notification | `agentstool__wait_agent` |
| `readonly: true` or `Explore` | Spawn with a brief that begins `Read-only task. Do not edit files.` |
| `readonly: false` | Spawn with a write scope limited to named paths |

`spawn_agent` has no `subagent_type`, `isolation`, or per-agent working
directory field. Put the required role, absolute source paths, write scope, and
working directory in the brief. For parallel writes, create separate Git
worktrees only when the task authorizes them; give each agent its worktree's
absolute path and forbid edits elsewhere.

## Subagent briefs

### poteto-agent

Use a lowercase task name such as `pstack_feature_worker`. Start with
`fork_turns: "none"` unless the child actually needs conversation context.

```text
Read <pstack-root>/skills/poteto-mode/SKILL.md in full before doing any work,
including its Principles index. You are a poteto-agent delegate for the parent
chat. The parent owns the playbook and final judgment.

Goal: <restate the user's goal>
Scope: <files or behavior>
Working directory: <absolute path>
Write scope: <exact paths, or "read-only; do not edit files">
Required output: <specific evidence, diff, finding, or summary>

Read the active Codex adapter from the pstack Skill package before using a
mapped tool. Do not invent model behavior or claim a skipped Claude/Cursor step
ran.
```

Do not use a generic delegate in place of this wrapper when the workflow calls
for `poteto-agent`.

### comment-sicko

Spawn a read-only agent whose brief says:

```text
Read-only task. Do not edit files.
Read <pstack-root>/agents/comment-sicko.md in full and operate as Comment Sicko.
Review only this scope: <paths or diff range>.
Return touched files, deletion count, MUST KILL flags, and skips.
```

## Models and reasoning

Upstream Claude and Grok slugs are not valid Codex model IDs. Omit `model` and
let the child inherit the parent unless the user explicitly configures a Codex
model for that role. `inherit-parent` and `auto` both mean: omit `model`.

When a Codex model override is explicitly requested, use only a model available
in the current session and set a supported `reasoning_effort`. Never silently
substitute a different model or report a single-model run as multi-model review.

The upstream `setup-pstack` model-rule step is Claude/Cursor-specific. Do not
write `~/.cursor/rules/` or `~/.claude/rules/` from Codex. If the user asks to
configure Codex models, treat that as a separate Codex configuration change and
inspect the current Codex configuration before editing it.

## Unsupported surfaces

- Cursor Automations, webhooks, routine wakes, and secret requests: skip with
  `Skipped in Codex: <feature>. <reason>.`
- Cursor cloud agents: use a local Git worktree only when authorized, or skip
  the isolation step and say so.
- Bugbot's built-in tooling: use the forge CLI and ordinary PR review threads.
- Claude live artifacts and Claude-specific prompt syntax: return normal
  Markdown output and keep the underlying content.

## Execution discipline

- Read the upstream playbook before opening its todo checklist.
- For parallel work, state the partition, whether to wait for every child, and
  the exact result each child returns.
- Review every child's actual output; never pass it through as your own summary.
- Re-read affected evidence after a fix, and distinguish local checks, TEST,
  live environments, and unverified work.
- If the upstream Skill cannot be resolved, stop that part and report the
  missing path and required installer/update step.
