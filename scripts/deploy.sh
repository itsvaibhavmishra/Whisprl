#!/usr/bin/env bash
# Puts production live one piece at a time and checks each piece landed, so nothing ships ahead of its server.
# The release workflow runs these in order, and the undo commands for whatever already went out when a later step fails.
#
#   scripts/deploy.sh backend <sha>               builds that commit on Northflank and waits until the API answers from it
#   scripts/deploy.sh undo-backend <sha> <gone>   builds the earlier commit and waits until the API stops answering from <gone>
#   scripts/deploy.sh live-website                prints the Netlify deploy live now, the one to go back to
#   scripts/deploy.sh website <folder>            uploads a built website, publishes it once Netlify has it ready
#   scripts/deploy.sh undo-website <deploy id>    puts that deploy back live
#
# Needs NORTHFLANK_TOKEN, NETLIFY_TOKEN and API_ORIGIN (the API's address, ending in /api).

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

require curl
require jq
require zip

NORTHFLANK="https://api.northflank.com/v1/projects/whisprl/services/whisprl"
NETLIFY="https://api.netlify.com/api/v1"
NETLIFY_SITE_ID="11d93069-5655-4db9-b73d-b34de9c5deab"
# a build and its rollout take a few minutes each, so this is generous without hiding one that is stuck
BACKEND_WAIT=1500
WEBSITE_WAIT=600
POLL=15

northflank() {
    curl --fail-with-body --silent --show-error -H "Authorization: Bearer $NORTHFLANK_TOKEN" -H "Content-Type: application/json" "$@"
}

netlify() {
    curl --fail-with-body --silent --show-error -H "Authorization: Bearer $NETLIFY_TOKEN" "$@"
}

version_status() {
    curl --silent --max-time 10 --output /dev/null --write-out '%{http_code}' "$API_ORIGIN/version" || true
}

served_commit() {
    curl --silent --max-time 10 "$API_ORIGIN/version" | jq -r '.commit // empty' 2>/dev/null || true
}

serves() {
    [ "$(served_commit)" = "$1" ]
}

# a build from before the version route answers 404, which still means the failed commit is gone
no_longer_serves() {
    local status
    status="$(version_status)"
    [ "$status" = 404 ] || { [ "$status" = 200 ] && [ "$(served_commit)" != "$1" ]; }
}

wait_for_api() {
    local goal="$1" waited=0
    shift
    until "$@"; do
        [ "$waited" -lt "$BACKEND_WAIT" ] || fail "The API at $API_ORIGIN never $goal in ${BACKEND_WAIT}s. It answers from '$(served_commit)'."
        sleep "$POLL"
        waited=$((waited + POLL))
    done
    echo "the API $goal"
}

# the service deploys the latest successful build of production by itself, so a build that succeeds goes out
build_backend() {
    local sha="$1" build status waited=0
    build="$(northflank -X POST "$NORTHFLANK/build" -d "{\"branch\": \"production\", \"sha\": \"$sha\"}" | jq -r .data.id)"
    echo "building ${sha::7} on Northflank as $build"
    while true; do
        status="$(northflank "$NORTHFLANK/build/$build" | jq -r .data.status)"
        case "$status" in
        SUCCESS) return ;;
        FAILURE | ABORTED | CRASHED | SUBMISSION_FAILURE | UNSCHEDULABLE) fail "Northflank build $build ended $status." ;;
        esac
        [ "$waited" -lt "$BACKEND_WAIT" ] || fail "Northflank build $build was still $status after ${BACKEND_WAIT}s."
        sleep "$POLL"
        waited=$((waited + POLL))
    done
}

live_website() {
    netlify "$NETLIFY/sites/$NETLIFY_SITE_ID" | jq -r '.published_deploy.id // empty'
}

publish_website() {
    netlify -X POST --output /dev/null "$NETLIFY/sites/$NETLIFY_SITE_ID/deploys/$1/restore"
    [ "$(live_website)" = "$1" ] || fail "Netlify deploy $1 was published but another one is live."
    echo "Netlify deploy $1 is live"
}

# auto publishing is stopped on the site, so an upload waits unpublished until it is published here
deploy_website() {
    local archive deploy state waited=0
    archive="$(mktemp -d)/website.zip"
    # the source maps are already in Sentry, and nobody else needs them
    (cd "$1" && zip -qrX "$archive" . -x '*.map')
    deploy="$(netlify -X POST -H "Content-Type: application/zip" --data-binary "@$archive" "$NETLIFY/sites/$NETLIFY_SITE_ID/deploys" | jq -r .id)"
    echo "uploaded the website as Netlify deploy $deploy"
    while true; do
        state="$(netlify "$NETLIFY/deploys/$deploy" | jq -r .state)"
        case "$state" in
        ready) break ;;
        error | rejected) fail "Netlify deploy $deploy ended $state." ;;
        esac
        [ "$waited" -lt "$WEBSITE_WAIT" ] || fail "Netlify deploy $deploy was still $state after ${WEBSITE_WAIT}s."
        sleep 5
        waited=$((waited + 5))
    done
    publish_website "$deploy"
}

case "${1:-}" in
backend)
    build_backend "$2"
    wait_for_api "answers from ${2::7}" serves "$2"
    ;;
undo-backend)
    build_backend "$2"
    wait_for_api "stopped answering from ${3::7}" no_longer_serves "$3"
    ;;
live-website) live_website ;;
website) deploy_website "$2" ;;
undo-website) publish_website "$2" ;;
*)
    sed -n '2,11p' "$ROOT/scripts/deploy.sh" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
