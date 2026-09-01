# Scheduled Task management

Use the ChatGPT desktop app's Scheduled Task capability. The CLI and IDE extension do not provide the Scheduled management interface. A local update requires the computer to be on, the desktop app to be running, the selected project to remain on disk, and network access.

## Stable identity

The one managed task is named `Update shared agent skills`. Inspect existing Scheduled Tasks for that exact name before any create. Reuse or update the existing task; never create a duplicate. If more than one already exists, stop and ask which one to retain before deleting anything.

Use the current saved local project as the task anchor when available. The task does not edit that project; it updates user-level skills. If the current directory is not a saved local project, ask the user to choose one.

## Setup

1. Run the local `setup` command first. Continue only when it succeeds.
2. Ask exactly: `是否启用共享 Skill 自动更新？`
3. If the answer is no, create nothing and confirm that manual `update` remains available.
4. If the answer is yes, show the proposed task before creating it:
   - source: `https://github.com/starrybamboo/agent-skills`, branch `main`;
   - target: user-level skills owned by that Hub only;
   - schedule: every day at 04:00 local time unless the user chooses another time;
   - failure policy: validate and stage first, roll back on an application failure, retain the previous usable installation, and report the reason;
   - runtime needs: computer on, desktop app running, project available, and network access.
5. Obtain confirmation of that exact proposal, then create or update the one task.

Use this durable task prompt:

```text
Run $shared-skills-manager update for starrybamboo/agent-skills. Update only user-level skills already recorded as owned by that Hub, validate the complete candidate before applying it, preserve the previous usable installation on any failure, and never edit, commit, push, or merge the Hub repository. If nothing changed, record a concise success. Otherwise report the source commit plus every added, modified, removed, or failed skill.
```

Use a standalone local Scheduled Task, not a thread heartbeat or worktree. Leave model and reasoning settings at the user's defaults unless the user explicitly chooses overrides.

## Other commands

- `status`: run the local status command and view the exact Scheduled Task. Report active, paused, absent, or duplicated separately from catalog health.
- `pause`: pause the exact task; preserve its cadence and prompt.
- `resume`: reactivate the exact paused task; preserve its cadence and prompt.
- `schedule HH:mm`: update the exact task to the requested local daily time and preserve its prompt and status.
- `disable`: delete the exact task after the user explicitly asks to disable automatic updates. Do not remove installed skills or the manual update entry.

After every Scheduled Task mutation, view it again and report the effective status and local schedule.
