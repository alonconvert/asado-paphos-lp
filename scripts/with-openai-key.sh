#!/usr/bin/env bash
# Auth chain: Keychain (Infisical machine identity) → Infisical (OPENAI_API_KEY) → exec "$@"
# Mirrors ~/.local/bin/browser-use-mcp pattern. Value never touches stdout.
# Per ~/.claude/rules/visual-assets.md the OS is locked to gpt-image-2 @ high.

set -euo pipefail

PROJECT_ID="7274e5b0-1359-4c43-854e-eff4339a6817"
ENV_SLUG="prod"
SECRET_PATH="/converty-os"
SECRET_NAME="OPENAI_API_KEY"
INFISICAL_BIN="/opt/homebrew/bin/infisical"

CID=$(security find-generic-password -a "$USER" -s "infisical-browser-use-client-id" -w 2>/dev/null)
CSEC=$(security find-generic-password -a "$USER" -s "infisical-browser-use-client-secret" -w 2>/dev/null)

TOK=$("$INFISICAL_BIN" login --method=universal-auth \
  --client-id="$CID" \
  --client-secret="$CSEC" \
  --silent --plain 2>/dev/null)

unset CID CSEC

VAL=$("$INFISICAL_BIN" secrets get "$SECRET_NAME" \
  --projectId="$PROJECT_ID" \
  --env="$ENV_SLUG" \
  --path="$SECRET_PATH" \
  --token="$TOK" \
  --plain --silent 2>/dev/null)

unset TOK

if [ -z "$VAL" ]; then
  echo "with-openai-key.sh: $SECRET_NAME is empty in Infisical $ENV_SLUG env" >&2
  exit 1
fi

export OPENAI_API_KEY="$VAL"
unset VAL

exec "$@"
