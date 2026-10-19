#!/usr/bin/env bash
# How this project stores its version. Sourced by the release scripts and workflows, never run.
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

# The Android app's versionCode, in the working tree or at a git ref; 0 before the app existed
read_native_version() {
    local gradle="frontend/android/app/build.gradle" contents code
    if [[ -n "${1:-}" ]]; then
        contents="$(git show "$1:$gradle" 2>/dev/null || true)"
    else
        contents="$(cat "$gradle")"
    fi
    code="$(sed -n 's/^ *versionCode \([0-9][0-9]*\).*/\1/p' <<<"$contents")"
    printf '%s' "${code:-0}"
}
