#!/usr/bin/env bash
# How this project stores its version. Sourced by release.sh and skip-release.sh, never run.
#
# Both functions must be filled in for the release command to work. read_version prints the
# current x.y.z on stdout and nothing else; bump_version writes the new one to whichever
# file(s) hold it, and those files must match VERSION_FILES in release.sh.

read_version() {
    node -p "require('./frontend/package.json').version"
}

bump_version() {
    local version="$1"
    local package
    for package in frontend backend; do
        (cd "$package" && npm version "$version" --no-git-tag-version --allow-same-version >/dev/null)
    done
}
