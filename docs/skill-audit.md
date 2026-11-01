# Claude Code dependency and invocation audit

Audit scope: pstack 0.15.36 and Cursor Team Kit 1.2.0, both pinned to `cursor/plugins` commit `ae5650febf4320793844c12c4adaa937f417f8da`. The collection entry points are those in `skills-manifest.json`, not every source file retained under a vendor directory.

## Result

- 62 active skills: 58 pstack skills and four selected companion skills.
- 162 Markdown files inspected by the reference scanner. Of 356 relative link occurrences, 355 resolve and one is the literal `[...](url)` example in the `why` synthesizer template.
- No unclassified skill name was found by the scanner's explicit-name patterns. Host commands and examples are classified separately; this is not a claim that all prose references can be parsed automatically.
- 57 skills retain `disable-model-invocation: true`. The five model-invocable entries are setup-pstack, deslop, control-cli, control-ui and verify-this. This explains why a pstack-only installation can expose just setup-pstack in the automatic listing.
- The source and manifests pass integrity validation. A deliberately broken link and unknown skill name are detected by the audit regression test.
- Script syntax inspection covered 42 non-corpus helper files. TypeScript was also parsed with the TypeScript compiler (38 files, no syntax diagnostics). This is not a full type check or runtime test. A Node `--check` failure on a Bun-targeted TypeScript file was an unsuitable check, not an established upstream defect.

## Confirmed gaps and boundaries

| Area | Evidence | Consequence and treatment |
| --- | --- | --- |
| Companion dependencies | pstack's `not shipped here` section and poteto-mode triggers | deslop, control-cli and control-ui are now exposed through cursor-team-kit; verify-this is included because control-ui references it. Original text is unchanged. |
| Skill authoring | automate-me, reflect and the authoring-a-skill playbook reference Cursor's create-skill | The public sources do not supply that builtin. Do not label another authoring skill as the same implementation. A host-native replacement needs an explicit mapping. |
| Visual summaries | ketchup references `/visualize` | It is not a skill in this collection. Screenshots, Mermaid and supported artifact rendering remain distinct alternatives; do not claim a missing native visualization tool ran. |
| Autonomous wakeup | autonomous-run requires Cursor's `/loop`; the adapter has no explicit loop row | Claude Code has its own documented loop, but session lifetime and wake behavior must be checked on the actual host. Installing pstack does not configure scheduling. |
| Cross-model review | arena requires a judge from another family; the Claude adapter maps non-Claude slugs to the session model | Separate agents can still be useful, but this is not evidence of different model families. Follow the documented unavailable-judge path instead of claiming diversity. |
| Cleanup helper | `worktree-audit.sh` embeds `$HOME/.cursor/projects/.../agent-transcripts` in executable code | Prose path mapping cannot rewrite this script. Its LAST_CHAT/recent-work assessment does not cover Claude Code history. A `safe` bucket is not clearance to delete; verify active/pinned work independently. No cleanup was executed in this audit. |
| PR watcher | `scripts/watch-pr/watch-pr` has a Bun shebang; bootstrap runs a frozen Bun install | Bun, git, gh/Origin and applicable authentication are runtime prerequisites. Plugin file installation alone does not provide them. No install or authenticated PR operation was run by the audit. |
| Formal verification | statechart launcher, run.ts and references/render.md | Requires a supported TS runtime, TLC/Java, mise or explicitly supplied tool paths, and Pele for rendered images. These are external runtime dependencies, not missing SKILL.md files. |
| Bot UI | make-bot-ui calls Cursor routines, update_state and SendToUser | This workflow depends on Cursor services. A local skill package cannot supply their accounts, credentials or APIs. The upstream adapter's skipped-step handling must remain explicit. |
| Internal triggers | poteto-mode requires technical-writing for docs/commits | The file is already installed. A missing read is an execution omission, not grounds to install duplicate skills or globally change invocation flags. |

The portable companion manifest does not activate unrelated kit workflows, Cursor rules or its two agents. The original source remains available for review under `upstream/`.

## Complete active catalog

“Guidance” means no additional named skill package was found beyond this catalog. It does not certify behavior in a live Claude Code session.

| Skill | Invocation flag | Main prerequisite or limitation |
| --- | --- | --- |
| [architect](../plugins/pstack/skills/architect/SKILL.md) | Explicit | Agent delegation and model-role mapping |
| [arena](../plugins/pstack/skills/arena/SKILL.md) | Explicit | Cross-model judge can be unavailable; same-model workers are not multi-model evidence |
| [automate-me](../plugins/pstack/skills/automate-me/SKILL.md) | Explicit | Workspace transcript mapping and missing Cursor create-skill builtin |
| [benchmark-checklist](../plugins/pstack/skills/benchmark-checklist/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [blast-radius](../plugins/pstack/skills/blast-radius/SKILL.md) | Explicit | Local execution; arena only for wider changes |
| [bro](../plugins/pstack/skills/bro/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [correct](../plugins/pstack/skills/correct/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [create-formal-verification-skill](../plugins/pstack/skills/create-formal-verification-skill/SKILL.md) | Explicit | Project-generated verifier; selected solver and statechart runtime |
| [create-verification-skill](../plugins/pstack/skills/create-verification-skill/SKILL.md) | Explicit | Project-generated driver; must run a real journey before marking complete |
| [figure-it-out](../plugins/pstack/skills/figure-it-out/SKILL.md) | Explicit | Agent/worktree mapping and project-specific verification |
| [how](../plugins/pstack/skills/how/SKILL.md) | Explicit | Agent delegation and model-role mapping |
| [in-your-own-words](../plugins/pstack/skills/in-your-own-words/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [interrogate](../plugins/pstack/skills/interrogate/SKILL.md) | Explicit | Agent delegation and model-role mapping |
| [ketchup](../plugins/pstack/skills/ketchup/SKILL.md) | Explicit | Host visuals; visualize is not supplied in this collection |
| [ketchup-video](../plugins/pstack/skills/ketchup-video/SKILL.md) | Explicit | Video rendering and delivery tools are host prerequisites, not bundled binaries |
| [maintain-formal-verification-skill](../plugins/pstack/skills/maintain-formal-verification-skill/SKILL.md) | Explicit | An existing project verifier and its actual tools are required |
| [maintain-verification-skill](../plugins/pstack/skills/maintain-verification-skill/SKILL.md) | Explicit | An existing project driver; source review cannot replace live verification |
| [make-bot-ui](../plugins/pstack/skills/make-bot-ui/SKILL.md) | Explicit | Cursor routine/webhook/secret-request services are unavailable through this plugin alone |
| [no-comments](../plugins/pstack/skills/no-comments/SKILL.md) | Explicit | pstack:comment-sicko and host delegation mapping |
| [poteto-help](../plugins/pstack/skills/poteto-help/SKILL.md) | Explicit | Documentation routing; host installation commands need namespace mapping |
| [poteto-mode](../plugins/pstack/skills/poteto-mode/SKILL.md) | Explicit | Main entry; host/model/companion mappings and project rules apply |
| [principle-attack-the-premise](../plugins/pstack/skills/principle-attack-the-premise/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-boundary-discipline](../plugins/pstack/skills/principle-boundary-discipline/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-build-the-lever](../plugins/pstack/skills/principle-build-the-lever/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-encode-lessons-in-structure](../plugins/pstack/skills/principle-encode-lessons-in-structure/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-exhaust-the-design-space](../plugins/pstack/skills/principle-exhaust-the-design-space/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-experience-first](../plugins/pstack/skills/principle-experience-first/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-explain-the-number](../plugins/pstack/skills/principle-explain-the-number/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-fix-root-causes](../plugins/pstack/skills/principle-fix-root-causes/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-foundational-thinking](../plugins/pstack/skills/principle-foundational-thinking/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-guard-the-context-window](../plugins/pstack/skills/principle-guard-the-context-window/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-laziness-protocol](../plugins/pstack/skills/principle-laziness-protocol/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-make-operations-idempotent](../plugins/pstack/skills/principle-make-operations-idempotent/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-migrate-callers-then-delete-legacy-apis](../plugins/pstack/skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-minimize-reader-load](../plugins/pstack/skills/principle-minimize-reader-load/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-model-the-domain](../plugins/pstack/skills/principle-model-the-domain/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-never-block-on-the-human](../plugins/pstack/skills/principle-never-block-on-the-human/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-outcome-oriented-execution](../plugins/pstack/skills/principle-outcome-oriented-execution/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-prove-it-works](../plugins/pstack/skills/principle-prove-it-works/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-redesign-from-first-principles](../plugins/pstack/skills/principle-redesign-from-first-principles/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-separate-before-serializing-shared-state](../plugins/pstack/skills/principle-separate-before-serializing-shared-state/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-sequence-verifiable-units](../plugins/pstack/skills/principle-sequence-verifiable-units/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-subtract-before-you-add](../plugins/pstack/skills/principle-subtract-before-you-add/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-test-behavior-not-implementation](../plugins/pstack/skills/principle-test-behavior-not-implementation/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [principle-type-system-discipline](../plugins/pstack/skills/principle-type-system-discipline/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [recall](../plugins/pstack/skills/recall/SKILL.md) | Explicit | Use Claude workspace transcript layout; optional connected sources remain conditional |
| [reflect](../plugins/pstack/skills/reflect/SKILL.md) | Explicit | Transcript mapping; substantive authoring references missing create-skill builtin |
| [setup-pstack](../plugins/pstack/skills/setup-pstack/SKILL.md) | Model-invocable | Actual host Agent model/effort schema; no automatic cross-provider routing |
| [sharpen](../plugins/pstack/skills/sharpen/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [show-me-your-work](../plugins/pstack/skills/show-me-your-work/SKILL.md) | Explicit | Bundled Bash log helper; writable task-owned output |
| [statechart](../plugins/pstack/skills/statechart/SKILL.md) | Explicit | TS runtime, TLC/Java, mise or supplied binaries; Pele for image rendering |
| [swarm](../plugins/pstack/skills/swarm/SKILL.md) | Explicit | Agent delegation and model-role mapping |
| [tdd](../plugins/pstack/skills/tdd/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [teach](../plugins/pstack/skills/teach/SKILL.md) | Explicit | Local code and available execution tools; no separate companion skill identified |
| [technical-writing](../plugins/pstack/skills/technical-writing/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [typescript-best-practices](../plugins/pstack/skills/typescript-best-practices/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [unslop](../plugins/pstack/skills/unslop/SKILL.md) | Explicit | Guidance; apply within the host tools and project constraints |
| [why](../plugins/pstack/skills/why/SKILL.md) | Explicit | git/gh and only actually connected evidence sources; no automatic MCP provisioning |
| [control-cli](../plugins/cursor-team-kit/upstream/skills/control-cli/SKILL.md) | Model-invocable | Existing CLI/PTY/tmux and runtime tooling; account-independent skill text |
| [control-ui](../plugins/cursor-team-kit/upstream/skills/control-ui/SKILL.md) | Model-invocable | Existing browser/CDP/Playwright; correct target and owned cleanup still need project setup |
| [deslop](../plugins/cursor-team-kit/upstream/skills/deslop/SKILL.md) | Model-invocable | Portable diff-review guidance; preserve behavior |
| [verify-this](../plugins/cursor-team-kit/upstream/skills/verify-this/SKILL.md) | Model-invocable | Baseline/treatment evidence on the actual target; no measurement tool is bundled |

## Reproduce and interpret

Run `npm run audit:skills` for the current source inventory and named-reference results. `npm test` includes the dependency audit and its broken-reference regression test. A new unclassified name or missing relative link fails the check so an upstream update receives review.

This audit did not install anything on a personal computer, invoke an LLM, access private transcripts, start automation, connect external services, or test every workflow live. Check plugin registration, the supported Agent tool schema, runtime binaries, and one representative workflow in the target session before claiming operational compatibility.

Official references: [Claude Code skill invocation](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill), [plugin path loading](https://code.claude.com/docs/en/plugins-reference#path-only-fields), [Claude Code scheduling](https://code.claude.com/docs/en/scheduled-tasks), and the [unmodified upstream adapter](../plugins/pstack/docs/harness/claude-code.md).
