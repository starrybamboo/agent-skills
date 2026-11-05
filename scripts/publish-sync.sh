#!/usr/bin/env bash
set -euo pipefail
if [[ "$(git branch --show-current)" != 'sync/pstack' ]]; then
  echo 'Refusing to publish outside sync/pstack' >&2
  exit 1
fi
stage_paths=(plugins upstreams.lock.json skills-manifest.json skills-router.json)
if [[ -d harness/codex ]] || [[ -n "$(git ls-files -- harness/codex)" ]]; then stage_paths+=(harness/codex); fi
git add -- "${stage_paths[@]}"
while IFS= read -r -d '' file; do
  case "$file" in
    plugins/*|harness/codex/*|upstreams.lock.json|skills-manifest.json|skills-router.json) ;;
    *) echo "Unexpected staged change: $file" >&2; exit 1 ;;
  esac
done < <(git diff --cached --no-renames --name-only -z)
candidate=$(git write-tree)
while IFS= read -r -d '' file; do
  case "$file" in
    plugins/*|harness/codex/*|upstreams.lock.json|skills-manifest.json|skills-router.json) ;;
    *) echo "Unexpected sync branch change: $file" >&2; exit 1 ;;
  esac
done < <(git diff --no-renames --name-only -z origin/main "$candidate")
# Compare the final tree with main, including real changes already on sync/pstack.
# Revision-only churn must not create a commit, push, or create/update a PR.
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
has_changes=$(node "$script_dir/sync-changes.mjs" origin/main "$candidate")
if [[ "$has_changes" == 'false' ]]; then
  echo 'No substantive upstream changes to propose (source revision metadata only, or no changes).'
  exit 0
fi
if ! git diff --cached --quiet; then
  revision=$(node -p "JSON.parse(require('fs').readFileSync('upstreams.lock.json','utf8')).sources.map(s=>s.name+'@'+s.revision.slice(0,12)).join(', ')")
  git commit -m "chore: sync upstream skills ($revision)"
fi
git push origin HEAD:refs/heads/sync/pstack
body=$(mktemp)
trap 'rm -f "$body"' EXIT
{
  echo '## Upstream update'
  echo
  node --input-type=module -e "import fs from 'node:fs'; for(const s of JSON.parse(fs.readFileSync('upstreams.lock.json','utf8')).sources) console.log('- '+s.name+' '+s.version+': https://github.com/'+s.repository+'/commit/'+s.revision)"
  echo
  echo 'Imported source files are unchanged except for the marked edits in patches/. Reviewed collection adapters generate host metadata only.'
  echo
  echo 'The Codex harness is generated from the same pinned pstack tree.'
  echo
  echo '## Verification'
  echo '- Collection integrity checks, Codex harness checks, and synchronization tests passed before publication.'
  echo '- Upstream scripts were not executed. Live Claude Code/Codex behavior is not certified by this check.'
  echo "- Sync run: https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
  echo
  echo 'Review the upstream diff before merging. This PR does not auto-merge, deploy, or install local skills.'
} > "$body"
number=$(gh pr list --head sync/pstack --base main --state open --json number --jq '.[0].number // empty')
if [[ -n "$number" ]]; then
  gh pr edit "$number" --title 'chore: sync upstream skills' --body-file "$body"
else
  gh pr create --draft --head sync/pstack --base main --title 'chore: sync upstream skills' --body-file "$body"
fi
