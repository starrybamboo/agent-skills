#!/usr/bin/env bash
# Runs one non-Claude seat through Codex and returns the seat's real exit code.
set -euo pipefail

if [[ $# -lt 5 || $# -gt 6 ]]; then
  echo 'Usage: codex-seat.sh <worktree> <model> <effort> <brief-file> <output-file> [read-only]' >&2
  exit 2
fi
worktree=$1 model=$2 effort=$3 brief=$4 output=$5 sandbox=workspace-write
if [[ $# -eq 6 ]]; then
  [[ $6 == read-only ]] || { echo "Unknown mode: $6" >&2; exit 2; }
  sandbox=read-only
fi

# A local gateway must not go through an HTTP proxy.
export NO_PROXY="127.0.0.1,localhost${NO_PROXY:+,$NO_PROXY}"
export no_proxy="$NO_PROXY"

prompt=$(<"$brief")
cd "$worktree"
limit=${CODEX_SEAT_TIMEOUT:-1500}
runner=()
if command -v timeout >/dev/null; then runner=(timeout "$limit"); fi
set +e
"${runner[@]}" codex exec --skip-git-repo-check -s "$sandbox" -m "$model" \
  -c "model_reasoning_effort=\"$effort\"" "$prompt" </dev/null >"$output" 2>&1
code=$?
set -e
echo "$model exit=$code"
exit "$code"
