#!/usr/bin/env bash
# Runs after every frontend build. With a Sentry token and DSN in the environment it ties the built
# code to its source maps and uploads them, so a report points at the line in our own files.
# Without them, as in development and the gate, it does nothing.

set -euo pipefail

if [ -z "${SENTRY_AUTH_TOKEN:-}" ] || [ -z "${REACT_APP_SENTRY_DSN:-}" ]; then
    echo "No Sentry token or DSN, so no source maps uploaded."
    exit 0
fi

cd "$(dirname "$0")/../frontend"
RELEASE="whisprl@$(node -p "require('./package.json').version")"
export SENTRY_ORG=whisprl SENTRY_PROJECT=whisprl-web

npx sentry-cli sourcemaps inject build/assets
npx sentry-cli sourcemaps upload --release "$RELEASE" build/assets
