# Third-party notices

## pstack

- Author: Lauren Tan.
- Source: https://github.com/cursor/plugins
- Imported directory: `harness/pstack/claude-code`.
- Exact revision, version, and file inventory: `upstreams.lock.json`.
- License: MIT, retained unchanged at `plugins/pstack/LICENSE`.
- Modification policy: the complete imported directory is copied byte-for-byte, with executable flags preserved. Local collection metadata and synchronization tooling live outside it.

## Cursor Team Kit

- Author: Eric Zakariasson, as identified by the upstream plugin manifest.
- Source: https://github.com/cursor/plugins/tree/main/cursor-team-kit
- Exact revision, version, and file inventory: `upstreams.lock.json`.
- License: MIT, retained unchanged in `plugins/cursor-team-kit/upstream/LICENSE` and copied to the plugin root.
- The complete original directory is retained under `upstream/`, with original bytes and executable flags. Collection tooling generates only `.claude-plugin/plugin.json` and the root license copy. The manifest exposes selected portable skills without changing their instructions or activating the other workflows, agents, or `.mdc` rules.

The earlier Matt Pocock, Hikarilan, and locally adapted skills are absent from the current distribution. Their source, licenses, and notices remain together in Git history before this migration.
