#!/usr/bin/env bash
# Pushes .github/rulesets/*.json to GitHub, so branch protection is version-controlled rather
# than clicked into a settings page nobody can diff.
#
#   scripts/apply-rulesets.sh          apply every ruleset, creating or updating by name
#   scripts/apply-rulesets.sh --show   print what is on GitHub now and change nothing
#
# Rulesets are matched by name: one already called the same thing is updated in place, so this
# is safe to run repeatedly and will not stack duplicates.

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

require gh
require python3

SLUG="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"

if [[ "${1:-}" == "--show" ]]; then
    gh api "repos/$SLUG/rulesets" --jq '.[] | "\(.id)\t\(.enforcement)\t\(.name)"'
    exit 0
fi

# A ruleset naming a status check that no workflow produces blocks every merge forever, so
# check the contexts exist as job names before pushing anything.
missing=0
while read -r context; do
    if ! grep -rqE "^  ${context}:" .github/workflows/; then
        printf 'warning: no workflow job named "%s", which every merge would then wait on forever\n' "$context" >&2
        missing=1
    fi
done < <(python3 -c '
import json, pathlib
seen = set()
for path in sorted(pathlib.Path(".github/rulesets").glob("*.json")):
    for rule in json.loads(path.read_text())["rules"]:
        if rule["type"] == "required_status_checks":
            for check in rule["parameters"]["required_status_checks"]:
                seen.add(check["context"])
print("\n".join(sorted(seen)))
')
if [[ "$missing" == "1" ]]; then
    fail "Fix the contexts above, or the branch they protect can never be merged into."
fi

for file in .github/rulesets/*.json; do
    name="$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['name'])" "$file")"
    existing="$(gh api "repos/$SLUG/rulesets" --jq ".[] | select(.name == \"$name\") | .id")"

    if [[ -z "$existing" ]]; then
        gh api --method POST "repos/$SLUG/rulesets" --input "$file" >/dev/null
        printf 'created  %s\n' "$name"
    else
        gh api --method PUT "repos/$SLUG/rulesets/$existing" --input "$file" >/dev/null
        printf 'updated  %s (#%s)\n' "$name" "$existing"
    fi
done

printf '\nDone. Review them at https://github.com/%s/settings/rules\n' "$SLUG"
