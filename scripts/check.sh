#!/usr/bin/env bash
# The gate. CI runs exactly this on every pull request, and release.sh runs it before pushing.
#
#   scripts/check.sh
#
# Needs both packages installed, and no database, no .env and no network.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

printf '\n== backend: lint and format ==\n\n'
(cd backend && npm run lint && npm run format:check)

printf '\n== backend: load every route, controller, service and model ==\n\n'
(
    cd backend
    # process.exit because a loaded module may hold the event loop open, and nothing here should.
    node --input-type=module -e "await import('./app.js'); await import('./socket.js'); console.log('all modules load'); process.exit(0)"
)

printf '\n== backend: tests ==\n\n'
(cd backend && npm test)

printf '\n== frontend: lint and format ==\n\n'
(cd frontend && npm run lint && npm run format:check)

printf '\n== frontend: tests ==\n\n'
(cd frontend && npm test)

printf '\n== frontend: production build ==\n\n'
(cd frontend && npm run build)

printf '\ngate passed\n'
