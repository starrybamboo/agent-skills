# Agent Skills

Public, project-independent agent skills curated by `starrybamboo`. The `main` branch is the maintainer-approved latest usable catalog.

## Install

Install every skill globally for Codex:

```bash
npx --yes skills@latest add starrybamboo/agent-skills --skill '*' --global --agent codex --yes
```

Then ask Codex to finish setup:

```text
$shared-skills-manager setup
```

Setup verifies and registers the installation, then asks whether to create one daily Scheduled Task. Declining leaves manual updates available:

```text
$shared-skills-manager update
$shared-skills-manager status
```

The default automatic check is 04:00 local time. Local Scheduled Tasks require the computer to be on, the ChatGPT desktop app to be running, and network access.

## Update guarantees

The manager updates only skills recorded as owned by `starrybamboo/agent-skills`. It clones `main` into a temporary directory, validates the complete candidate catalog, stages every changed directory, and rolls back the transaction if installation or metadata writes fail. Unrelated global and repository skills are left alone.

An automatic run never edits this repository, commits, pushes, or merges upstream changes. It reports added, modified, and removed skills; a validation failure leaves the previous installation active.

## Public boundary

This repository contains only reusable, project-independent workflows. Product-specific procedures, company-internal systems, credentials, private addresses, personal data, and local machine paths are excluded. `skills-manifest.json` records the origin and license of every skill.

The selected Matt Pocock skills remain under Matt Pocock's MIT license. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Original material in this repository is MIT licensed under [LICENSE](LICENSE).

## Validate

```bash
npm test
```

The same command runs on every push and pull request. It checks catalog structure, frontmatter, names, relative references, scripts, embedded licenses, source metadata, and the public-content boundary, then exercises installation, updates, deletions, and rollback in a temporary home directory.
