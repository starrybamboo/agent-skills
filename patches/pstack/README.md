# Local changes to pstack

`plugins/pstack/` is the upstream copy with the patches in this folder applied. The vendored files carry no markers, so this list is the record of what differs from upstream.

## 0001-multi-model-seats.patch

Lets pstack's review panels use models that the Claude Code `Agent` tool cannot run.

| File | Change |
| --- | --- |
| `docs/harness/claude-code.md` | Adds the "Non-Claude seats" section under Models, and a rule that `setup-pstack` keeps `codex:` role entries. |
| `skills/arena/SKILL.md` | Runs `codex:` runners and judges through the seat script. |
| `skills/interrogate/SKILL.md` | Runs `codex:` adversaries through the seat script. |
| `scripts/codex-seat.sh` | New file. Runs one seat through `codex exec` and returns its exit code. |

Upstream's rule that a bare non-Claude slug falls back to the session model is unchanged.
