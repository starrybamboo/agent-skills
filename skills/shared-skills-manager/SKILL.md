---
name: shared-skills-manager
description: Install, update, inspect, or schedule updates for the public starrybamboo/agent-skills catalog. Invoke explicitly with setup, update, status, pause, resume, disable, or schedule.
argument-hint: "setup | update | status | pause | resume | disable | schedule HH:mm"
disable-model-invocation: true
---

# Shared Skills Manager

Manage only the global skills owned by `starrybamboo/agent-skills`. Resolve this skill's actual directory before running its script; do not assume a fixed home path.

## Local catalog commands

For `setup`, `update`, or `status`, run:

```text
node <this-skill-directory>/scripts/manage-shared-skills.mjs <command>
```

- `setup` verifies the installation created by `npx skills`, records exact ownership, and applies a newer validated `main` if one is already available.
- `update` checks Hub `main`, stays quiet apart from a concise no-change result when current, and reports added, modified, and removed skills when it applies an update.
- `status` reports the installed commit, remote commit, ownership drift, last run, and whether an update is available.

Stop on a nonzero exit and report the error. When recovery is incomplete, preserve the reported transaction files and surface the failed recovery steps and path; do not claim the previous installation was restored or retry with a broad `npx skills update -g`. Report cleanup warnings separately from installation failures.

## Scheduled update commands

For `setup`, `pause`, `resume`, `disable`, `schedule`, or a complete `status`, read [references/scheduled-task.md](references/scheduled-task.md). Scheduled Task state is managed through the ChatGPT desktop app, not by editing automation files or using the operating system scheduler.

If no command was supplied, show the command list and ask which one the user wants. Do not infer consent to automatic updates from installing or manually updating the catalog.
