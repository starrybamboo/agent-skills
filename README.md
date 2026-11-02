# Agent Skills

A collection of upstream agent tools maintained by `starrybamboo`. Start with pstack, keep its upstream behavior, and add other tools only for demonstrated gaps. This repository does not maintain a competing engineering workflow.

## What ships

- `plugins/pstack/` is a copy of `cursor/plugins/harness/pstack/claude-code` with the edits in `patches/pstack/` applied, including skills, agents, documentation, scripts, assets, plugin metadata, and license.
- `plugins/cursor-team-kit/upstream/` preserves the Cursor Team Kit source unchanged. A generated Claude Code manifest exposes the three pstack dependencies (`deslop`, `control-cli`, `control-ui`) and their companion `verify-this`. Other kit workflows, agents, and Cursor rules are not activated.
- `upstreams.json` selects the source repository, tracking branch, source directory, and destination.
- `upstreams.lock.json` records the exact upstream commit, plugin version, and every file's hash and executable flag.
- `skills-manifest.json` and `skills-router.json` are generated discovery indexes, not a flat global-skill installation manifest.

Do not edit files under `plugins/pstack/` by hand. To change upstream behavior, edit the source in a clean tree, save the diff in `patches/pstack/`, list it in `patches/pstack/README.md`, and run the sync. Vendored files carry no local markers; the patch directory is the record of every local change. A patch that no longer applies stops the sync and leaves the distribution unchanged. Do not change upstream invocation flags, role defaults, or workflow rules to fit old local skills.

## Claude Code

Install this collection as a marketplace:

```text
/plugin marketplace add starrybamboo/agent-skills
/plugin install pstack@starrybamboo-skills
/plugin install cursor-team-kit@starrybamboo-skills
```

Then configure roles and start a task:

```text
/pstack:setup-pstack
/pstack:poteto-mode describe the task and the evidence that will show it is done
```

Do not install another copy of pstack from `cursor-plugins` at the same time. The upstream [Claude Code adapter](plugins/pstack/docs/harness/claude-code.md) defines the supported mappings and limitations. Installation does not make poteto-mode permanent in every chat. This repository does not change your global instructions or model settings.

If this marketplace is already installed, run `/plugin marketplace update starrybamboo-skills` before installing the companion plugin. Its commands are `/cursor-team-kit:deslop`, `/cursor-team-kit:control-cli`, `/cursor-team-kit:control-ui`, and `/cursor-team-kit:verify-this`. See [dependency coverage](docs/pstack-dependencies.md) for what can and cannot be installed this way.

## Codex

The repository also generates an explicit Codex harness from the same pinned
`plugins/pstack` tree. It exposes `$pstack` plus the 57 upstream
human-invocable Skills, including `$bro`, `$architect`, and `$how`. The
explicit entries do not auto-inject; `$pstack` remains the workflow router.

The harness maps Claude/Cursor tools to Codex at execution time. It does not
claim that Cursor Automations, cloud agents, Claude model slugs, or the
Claude/Cursor `setup-pstack` rule are portable. See
[the Codex harness document](docs/codex-harness.md).

Generate, verify, and install:

```bash
npm run codex:sync
npm run codex:check
npm run codex:install
npm run codex:status
```

`codex:install` copies the generated skills and the pinned pstack payload under
`$CODEX_HOME` (default `~/.codex`). It does not depend on a Claude plugin cache
after installation. Run `codex:sync` after pulling a new repository revision,
then `codex:install` to replace the generated user-level copy.

`sync:upstreams` now regenerates the Codex harness in the same operation as the
Claude plugin. The daily workflow therefore proposes both generated targets in
one draft PR.

The previous 40 locally maintained skills have been removed from the current catalog. Their full source remains in Git history at [`867b619`](https://github.com/starrybamboo/agent-skills/tree/867b61913524568f30b022d24793b51a29b4b60d). There is no discoverable archive directory containing retired skills.

Updating this repository does **not** uninstall files or links already present on your computers. The old shared-skills-manager accepts schema 1 only; this catalog intentionally uses schema 2, so the old updater stops before modifying an installation. Pause or remove its old scheduled task when you migrate that computer. See [migration boundaries](docs/migration.md). This repository never edits dot's instructions.

## Upstream updates

GitHub Actions checks upstream daily at **02:17 UTC (10:17 UTC+8)**, and can also be run with **Run workflow**. Scheduled runs can be delayed by GitHub; inactive public repositories may have schedules disabled.

When content changes, the job copies the upstream distributions, regenerates the reviewed adapter metadata, lock and indexes, runs this repository's tests, and opens or updates one **draft** PR on `sync/pstack`. It does not force-push, auto-merge, deploy, or install anything on your computers. A failed check stops publication. A no-change run creates no commit or PR.

The workflow uses GitHub's temporary `GITHUB_TOKEN`, not a personal access token. GitHub must allow Actions to create pull requests in this repository. If that setting is disabled, the job reports the blocker; it does not change security settings. The sync job runs tests itself rather than assuming a bot-created PR automatically starts CI. GitHub may require approval of the separate PR workflow.

Review upstream changes and merge the PR to promote them into this collection. Local plugin updates are separate. There is no hidden local auto-update job in this repository.

Manual repository synchronization:

```bash
npm ci --ignore-scripts
npm run sync:upstreams
npm test
```

To reproduce an import from an existing clean upstream checkout:

```bash
node scripts/upstreams.mjs sync --pstack-checkout /path/to/cursor-plugins
```

The checkout must be clean in the imported directory. Synchronization never executes scripts or installs dependencies from the imported plugin. Run it in a clean working tree; it replaces the owned plugin directory and generated files.

## What validation proves

The [complete skill audit](docs/skill-audit.md) covers all active entries, external references, invocation flags and known Claude Code limitations at the recorded upstream revision. Run `npm run audit:skills` to check the current distribution for broken relative links and unclassified named-skill references. Host limitations are reported separately from missing files.

`npm test` verifies plugin identity, license presence, every imported file hash
and executable flag, complete source configuration, generated skill indexes,
marketplace entries, the generated Codex harness, install conflict handling, and
migration/synchronization behavior in temporary fixtures. It also rejects
retired root skills and unexpected plugin directories.

This is distribution-integrity verification, **not** proof that every upstream workflow works in a live Claude Code session or any Codex session. Review upstream behavioral changes before merging. Only the companion skills listed above are exposed; external services and Cursor built-ins are not installed.

## Licenses

Original collection tooling is MIT licensed under [LICENSE](LICENSE). Upstream pstack is MIT licensed by Lauren Tan; its [license](plugins/pstack/LICENSE) is copied unchanged. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
