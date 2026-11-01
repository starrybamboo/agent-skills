# pstack dependency coverage in Claude Code

This collection keeps pstack as its primary workflow. Cursor Team Kit supplies the missing portable dependencies; it does not replace pstack's task routing.

| Reference | Distribution | Claude Code entry |
| --- | --- | --- |
| `deslop` | Original Cursor Team Kit skill | `/cursor-team-kit:deslop` |
| `control-cli` | Original Cursor Team Kit skill | `/cursor-team-kit:control-cli` |
| `control-ui` | Original Cursor Team Kit skill | `/cursor-team-kit:control-ui` |
| `verify-this`, referenced by control-ui | Original Cursor Team Kit skill | `/cursor-team-kit:verify-this` |
| `create-skill` | Cursor built-in, not supplied in the public kit | Not installed by this collection. Use a separately available, verified authoring tool when needed; report the difference. |
| Cursor `/loop`, `/autopilot`, plan mode, Automations, cloud agents, Bugbot, built-in PR tools | Host capabilities, not portable skill folders | Follow the official pstack Claude Code adapter. Installing a skill cannot grant these capabilities. |

The source is `cursor/plugins/cursor-team-kit` at the revision recorded in `upstreams.lock.json`. Its original tree is retained under `plugins/cursor-team-kit/upstream/`. The generated manifest selects four skill directories. The upstream `agents/`, `rules/`, and other skills remain source material, outside Claude Code's automatic component directories and outside the manifest selection.

These four skills use repository-native commands, shell tools, Playwright or CDP. They do not require a Cursor account. Browser binaries, Playwright, tmux and the application's own dependencies still have to exist where the task runs; the collection does not install or authenticate them.

## Loading and invocation

After installing both plugins, start a fresh Claude Code session and check that the four qualified companion commands are available. pstack's references to a skill **from cursor-team-kit** resolve to that plugin, not to a missing file inside pstack's own `skills/` directory.

Most pstack skills set `disable-model-invocation: true`. Their absence from Claude's automatic skill listing does not prove installation failed. The official Claude Code adapter describes how an explicitly started pstack workflow reads its internal references. The four companion skills retain their upstream invocation flags. This collection does not globally enable all pstack skills or bypass a host's explicit invocation denial.

`technical-writing` is already included in pstack. When a running pstack workflow reaches documentation or commit-message work, it must follow that existing trigger; installing another copy would not fix an omitted step.

## Verification boundary

Repository tests prove source hashes, metadata generation, selected-skill discovery, idempotent synchronization and failure before replacement when an upstream dependency disappears. They do not prove that a local Claude Code session has refreshed its plugin cache, loaded these skills, or successfully driven an application. Validate those separately after local installation, without spending model quota merely to check file presence.

## Upstream updates

The existing daily synchronization includes both sources. Skill text is copied unchanged; only the Claude Code manifest is generated locally. Review changes to the selected paths and any new external dependencies before merging a sync PR. Changes to the manifest selection belong in `upstreams.json`, not inside vendored skill files.

References: [upstream companion list](https://github.com/cursor/plugins/tree/main/pstack#not-shipped-here), [Claude Code adapter](https://github.com/cursor/plugins/blob/main/harness/pstack/claude-code/docs/harness/claude-code.md), [Claude Code manifest paths](https://code.claude.com/docs/en/plugins-reference#path-only-fields).
