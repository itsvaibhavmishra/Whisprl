#!/usr/bin/env bash
# Cuts a release in one command: branch, changelog, version, gate, push, both pull requests.
# Doing it by hand meant several files that had to agree, and nothing checking that they did.
#
#   scripts/release.sh 0.2.0     that version
#   scripts/release.sh           asks, offering the next patch

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
source "$(dirname "${BASH_SOURCE[0]}")/version.sh"

require git
require gh
require python3

CURRENT="$(read_version)"
REPO="$(repo_url)"

VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
    IFS=. read -r major minor patch <<<"$CURRENT"
    suggestion="${major}.${minor}.$((patch + 1))"
    read -r -p "current ${CURRENT}, release which? [${suggestion}] " VERSION
    VERSION="${VERSION:-$suggestion}"
fi

[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "\"$VERSION\" is not an x.y.z version."
[[ "$(compare_versions "$VERSION" "$CURRENT")" == "1" ]] ||
    fail "$VERSION is not above the current $CURRENT, so it would go backwards."

# Everything below rewrites tracked files and switches branch, so anything uncommitted would
# either be swept into the release or lost.
[[ -z "$(git status --porcelain)" ]] || fail "Working tree is not clean. Commit or stash it first."

echo "fetching..."
git fetch --prune origin

[[ -z "$(git ls-remote --tags origin "v$VERSION")" ]] ||
    fail "v$VERSION is already tagged, so that version is spent. Pick a higher one."

STARTING_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
BRANCH="release/$VERSION"
git checkout -b "$BRANCH" origin/rc

# Put the branch back the way it was found, so a failed run leaves nothing behind.
abort() {
    git checkout --force "$STARTING_BRANCH" >/dev/null 2>&1 || true
    git branch -D "$BRANCH" >/dev/null 2>&1 || true
    fail "Release aborted, branch removed and nothing pushed."
}
trap abort ERR

python3 scripts/changelog.py release "$VERSION" "$REPO"

# Bumping the version is the one step every stack spells differently, so it lives in the
# profile's own hook rather than as a branch in here.
bump_version "$VERSION"
echo "  version: $CURRENT -> $VERSION"

# The gate runs before anything is pushed, so a release that cannot build never becomes a
# branch anybody else has to look at.
printf '\nrunning the gate...\n\n'
scripts/check.sh

git add CHANGELOG.md devlog.txt frontend/package.json frontend/package-lock.json backend/package.json backend/package-lock.json
commit_signed "chore: 🧹 release $VERSION"
git push --set-upstream origin "$BRANCH"

trap - ERR

NOTES="$(python3 scripts/changelog.py section "$VERSION")"

upsert_pull_request rc "$BRANCH" "Prepare release $VERSION" "$(
    cat <<EOF
Version, changelog and devlog for $VERSION, written by \`scripts/release.sh\`.

Merging this puts the bump on \`rc\`. The release itself is the next pull request.

---

$NOTES
EOF
)"

# Opened now rather than after the first merge, so a release is one command. It sits red until
# the prepare pull request lands, then updates itself and release-ready passes.
upsert_pull_request production rc "Release $VERSION" "$(
    cat <<EOF
Merging this publishes **$VERSION**: the tag and the GitHub release.

Red until *Prepare release $VERSION* is merged, because until then \`rc\` is still on $CURRENT.

---

$NOTES
EOF
)"

printf '\n%s is ready. Merge the prepare pull request, then the release one.\n' "$VERSION"
