#!/usr/bin/env bash
# Moves rc into production without cutting a version. For work that belongs on production but is not
# worth a release on its own, and for anything that has to reach production before the next release.
#
#   scripts/skip-release.sh

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
source "$(dirname "${BASH_SOURCE[0]}")/version.sh"

require git
require gh
require python3

echo "fetching..."
git fetch --prune origin

AHEAD="$(git log --oneline origin/production..origin/rc)"
[[ -n "$AHEAD" ]] || fail "rc has nothing production does not, so there is nothing to merge."

VERSION="$(read_version)"
WAITING="$(python3 scripts/changelog.py count)"
COMMITS="$(printf '%s\n' "$AHEAD" | sed 's/^/- /')"

# The devlog is only ever emptied by scripts/release.sh, so anything sitting in it now still
# gets swept into whichever version is cut next. Saying so here stops it reading like a loss.
if [[ "$WAITING" -gt 0 ]]; then
    noun="entries"
    [[ "$WAITING" -eq 1 ]] && noun="entry"
    DEVLOG_NOTE="\`devlog.txt\` still holds **$WAITING** $noun. They stay there and land in the changelog under whichever version is released next. Nothing is lost by merging this.

$(python3 scripts/changelog.py read | sed 's/^  \([A-Za-z]*\): \(.*\)$/- **\1**: \2/')"
else
    DEVLOG_NOTE='`devlog.txt` is empty, so nothing is waiting to be written up.'
fi

upsert_pull_request production rc "Merge rc without releasing" "$(
    cat <<EOF
Brings \`production\` up to date with \`rc\` **without publishing anything**.

The \`skip release\` label is what stops it: no tag, no build, no GitHub release. \`production\` stays on $VERSION.

### What is being merged

$COMMITS

### Devlog

$DEVLOG_NOTE
EOF
)" "skip release"

printf '\nopened, labelled skip release. Merging it publishes nothing.\n'
