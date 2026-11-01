# Migration from the old catalog

The old catalog mixed upstream and local workflow rules in 40 global skills. This release removes those skill directories and uses the upstream pstack Claude Code plugin as the sole workflow baseline. The old source is recoverable at commit `867b61913524568f30b022d24793b51a29b4b60d`; it is not duplicated in an archive that skill discovery could reload.

## Repository versus installed state

This migration changes the repository only. It does not remove Codex global skills, Claude Code symlinks, repository-local skills, scheduled desktop tasks, or user configuration. Do not report an old skill uninstalled just because it disappeared from this repository.

Before switching an existing computer:

1. Inspect the previous manager's ownership state and the actual installed files and links. Preserve locally modified or unrelated entries.
2. Pause the old shared-skills-manager scheduled update task through the interface that created it.
3. Remove only verified old catalog-owned entries after their removal is authorized. Do not delete a whole global skills directory or replace a user's symlink merely because its name matches.
4. Install the new pstack plugin once, from the chosen marketplace. Confirm that its agents and relative references load, then run a small real task.
5. Check that old `ask-matt`, `implement`, and other retired routes no longer influence the new session. Do not replace dot's separate instructions.

The previous manager calls `validateCatalog` before writing installation state. That validator requires `schemaVersion === 1`. The new `skills-manifest.json` has schema version 2 and represents plugin distributions, so the old manager must reject it rather than partially install a plugin as independent skills. This intentional failure requires migration, not a retry loop or a broad global update command.

## What has not been adapted

The official pstack Claude Code distribution includes its own adapter. Its model fallback and unavailable Cursor-only features are defined upstream. This collection does not invent tool mappings or silently turn those steps into successes.

There is no verified Codex-specific distribution in this release. A future adapter should live outside the imported tree and prove its tool, agent, model, and autonomous-run behavior before becoming a supported installation route.

## Reintroducing a capability

Start from a task the pstack baseline cannot adequately handle. Retrieve only the relevant old skill from Git history, verify its license and dependencies, and add it as a separate supplement. Do not restore the old catalog, duplicate the main router, or patch pstack merely to keep an unused old workflow alive.
