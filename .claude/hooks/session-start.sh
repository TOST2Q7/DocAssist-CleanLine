#!/bin/bash
# Cloud sessions only: install deps so `npm run check` works. Silent: stdout goes into Claude's context.
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR"
npm install --no-audit --no-fund --loglevel=error >/dev/null
