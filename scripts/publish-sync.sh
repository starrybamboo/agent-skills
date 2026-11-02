#!/usr/bin/env bash
set -euo pipefail
if [[ "$(git branch --show-current)" != 'sync/pstack' ]]; then
  echo 'Refusing to publish outside sync/pstack' >&2
  exit 1
fi
stage_paths=(plugins upstreams.lock.json skills-manifest.json skills-router.json)
if [[ -d harness/codex ]]; then stage_paths+=(harness/codex); fi
git add -- "${stage_paths[@]}"
while IFS= read -r -d '' file; do
  case "$file" in
    plugins/*|harness/codex/*|upstreams.lock.json|skills-manifest.json|skills-router.json) ;;
    *) echo "Unexpected staged change: $file" >&2; exit 1 ;;
  esac
done < <(git diff --cached --name-only -z)
if ! git diff --cached --quiet; then
  revision=$(node -p "JSON.parse(require('fs').readFileSync('upstreams.lock.json','utf8')).sources.map(s=>s.name+'@'+s.revision.slice(0,12)).join(', ')")
  git commit -m "chore: sync upstream skills ($revision)"
fi
if git diff --quiet origin/main HEAD -- plugins upstreams.lock.json skills-manifest.json skills-router.json; then
  if [[ ! -d harness/codex ]] || git diff --quiet origin/main HEAD -- harness/codex; then
    echo 'No upstream changes to propose.'
    exit 0
  fi
fi
while IFS= read -r -d '' file; do
  case "$file" in
    plugins/*|harness/codex/*|upstreams.lock.json|skills-manifest.json|skills-router.json) ;;
    *) echo "Unexpected sync branch change: $file" >&2; exit 1 ;;
  esac
done < <(git diff --name-only -z origin/main HEAD)
git push origin HEAD:refs/heads/sync/pstack
body=$(mktemp)
trap 'rm -f "$body"' EXIT
{
  echo '## Upstream update'
  echo
  node --input-type=module -e "import fs from 'node:fs'; for(const s of JSON.parse(fs.readFileSync('upstreams.lock.json','utf8')).sources) console.log('- '+s.name+' '+s.version+': https://github.com/'+s.repository+'/commit/'+s.revision)"
  echo
  echo 'Imported source files remain unchanged. Reviewed collection adapters generate host metadata only.'
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
