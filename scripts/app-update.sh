#!/usr/bin/env bash
# Builds the web app as a live update for the Android app, signs it, and writes the file installed
# apps read to find it. The release workflow runs this; run it locally only to test an update.
#
#   scripts/app-update.sh <private key> <output folder> [download address]
#
# The download address defaults to this version's GitHub release. The build reads the production
# settings from the environment, the same REACT_APP_ values Netlify builds the website with.

if [ $# -lt 2 ] || [ ! -r "$1" ]; then
    echo "Usage: scripts/app-update.sh <readable private key> <output folder> [download address]" >&2
    exit 1
fi
# resolved before lib.sh moves to the repository root, so relative paths mean what they meant here
KEY="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
OUT="$(mkdir -p "$2" && cd "$2" && pwd)"

source "$(dirname "$0")/lib.sh"

require openssl
require zip

# a build without these would stop updating every phone it reaches, or talk to the wrong server
[ -n "${REACT_APP_UPDATE_URL:-}" ] || fail "REACT_APP_UPDATE_URL is not set, so the update could never find the next one."
[ -n "${REACT_APP_API_ORIGIN:-}" ] || fail "REACT_APP_API_ORIGIN is not set, so the update would not know its server."

VERSION="$(node -p "require('./frontend/package.json').version")"
NATIVE_VERSION="$(sed -n 's/^ *versionCode \([0-9][0-9]*\).*/\1/p' frontend/android/app/build.gradle)"
[ -n "$NATIVE_VERSION" ] || fail "Could not read versionCode from frontend/android/app/build.gradle."
BASE="${3:-$(repo_url)/releases/download/v$VERSION}"

(cd frontend && npm run build)

# source maps help nobody on a phone, and they are most of the download
(cd frontend/build && zip -qrX "$OUT/app-update.zip" . -x '*.map')
SIGNATURE="$(openssl dgst -sha256 -sign "$KEY" "$OUT/app-update.zip" | openssl base64 -A)"

python3 - "$OUT/app-update.json" "$VERSION" "$NATIVE_VERSION" "$BASE/app-update.zip" "$SIGNATURE" <<'PY'
import json, sys
path, version, native_version, url, signature = sys.argv[1:]
with open(path, "w") as manifest:
    json.dump({"version": version, "minNativeVersion": int(native_version), "url": url, "signature": signature}, manifest, indent=2)
PY

printf 'Update %s for APK version %s or newer, %s, in %s\n' "$VERSION" "$NATIVE_VERSION" "$(du -h "$OUT/app-update.zip" | cut -f1)" "$OUT"
