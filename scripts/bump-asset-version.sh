#!/usr/bin/env bash
# Bump the ?v= query string on styles.css / animations.js / i18n.js in index.html
# to force browsers to fetch fresh after each deploy.
#
# Usage:  ./scripts/bump-asset-version.sh
# Run before every `vercel deploy`.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Compute a version: short git hash + timestamp suffix.
SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "dev")
STAMP=$(date +%s)
VERSION="${SHA}-${STAMP}"

# Replace any existing ?v=... or add a fresh one.
sed -E -i '' \
  -e "s|(href=\"styles\.css)(\?v=[^\"]*)?\"|\1?v=${VERSION}\"|" \
  -e "s|(src=\"i18n\.js)(\?v=[^\"]*)?\"|\1?v=${VERSION}\"|" \
  -e "s|(src=\"animations\.js)(\?v=[^\"]*)?\"|\1?v=${VERSION}\"|" \
  index.html

echo "Bumped asset version to: ${VERSION}"
grep -E '(styles\.css|i18n\.js|animations\.js)\?v=' index.html | sed 's|^|  |'
