#!/usr/bin/env bash
# Full local release: package → notarize → (optional) publish.
#
# Requires Developer ID cert + App Store Connect API credentials.
# See packaging/package.sh and packaging/notarize.sh for env var details.
#
# Usage:
#   ./packaging/local-release.sh                 # package + notarize both arches
#   ./packaging/local-release.sh --sign-only     # package only (skip notarize)
#   ./packaging/local-release.sh --publish       # package + notarize + gh upload
#   ./packaging/local-release.sh --arm64         # arm64 only
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

NOTARIZE=true
PUBLISH=false
EXTRA_ARGS=()

for arg in "$@"; do
  case "$arg" in
    --sign-only) NOTARIZE=false ;;
    --publish) PUBLISH=true ;;
    --arm64|--x64) EXTRA_ARGS+=("$arg") ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: $0 [--sign-only] [--publish] [--arm64] [--x64]"
      exit 1
      ;;
  esac
done

"$SCRIPT_DIR/package.sh" "${EXTRA_ARGS[@]}"

if $NOTARIZE; then
  VERSION=$(node -p "require('$SCRIPT_DIR/../package.json').version")
  shopt -s nullglob
  DMGS=(release/KeyMIDI-"$VERSION"-*.dmg)
  shopt -u nullglob
  "$SCRIPT_DIR/notarize.sh" "${DMGS[@]}"
fi

if $PUBLISH; then
  "$SCRIPT_DIR/publish.sh"
fi
