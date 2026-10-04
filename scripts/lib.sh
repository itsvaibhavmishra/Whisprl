#!/usr/bin/env bash
# Shared helpers for the release commands. Kept together so both spell a failure the same way.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() {
    printf '\n%s\n' "$1" >&2
    exit 1
}

require() {
    command -v "$1" >/dev/null 2>&1 || fail "$1 is not installed, and this needs it."
}

repo_url() {
    local url
    url="$(git remote get-url origin 2>/dev/null)" || fail "No origin remote, so there is nowhere to release to."
    # Normalise both SSH and HTTPS forms to the browsable https URL.
    url="${url%.git}"
    url="${url/git@github.com:/https://github.com/}"
    printf '%s' "$url"
}

# Higher, equal or lower, so a release cannot go backwards by typo. Prints -1, 0 or 1.
compare_versions() {
    python3 -c '
import sys
left, right = (tuple(int(part) for part in value.split(".")) for value in sys.argv[1:3])
print((left > right) - (left < right))
' "$1" "$2"
}

# Commit signing goes through a key that asks for a touch, and a prompt is easy to miss while
# the gate that precedes it runs. Missing one should cost a wait, not the whole release.
commit_signed() {
    local message="$1" attempts=3 wait=30 attempt=1
    while true; do
        if git commit -m "$message"; then
            return 0
        fi
        if [[ $attempt -ge $attempts ]]; then
            fail "Commit failed after $attempts attempts."
        fi
        printf '\nsigning failed on attempt %d of %d. Retrying in %ds, approve the prompt when it appears.\n' \
            "$attempt" "$attempts" "$wait"
        sleep "$wait"
        attempt=$((attempt + 1))
    done
}

# The open pull request from one branch into another, if there is one.
open_pull_request() {
    gh pr list --base "$1" --head "$2" --json number --jq '.[0].number // empty'
}

# Opens the pull request, or corrects the one already open so a stale title cannot survive.
# upsert_pull_request <base> <head> <title> <body> [label...]
upsert_pull_request() {
    local base="$1" head="$2" title="$3" body="$4"
    shift 4
    local labels=() label existing
    for label in "$@"; do labels+=(--add-label "$label"); done

    existing="$(open_pull_request "$base" "$head")"
    if [[ -z "$existing" ]]; then
        local create_labels=()
        for label in "$@"; do create_labels+=(--label "$label"); done
        # bash 3.2, which macOS ships, counts an empty array as unset and set -u then aborts.
        gh pr create --base "$base" --head "$head" --title "$title" --body "$body" \
            ${create_labels[@]+"${create_labels[@]}"}
        return
    fi

    printf '\nupdating the open %s into %s pull request, #%s\n' "$head" "$base" "$existing"
    gh pr edit "$existing" --title "$title" --body "$body" ${labels[@]+"${labels[@]}"}
}
