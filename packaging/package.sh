#!/usr/bin/env bash
# Build, sign, and package KeyMIDI DMGs + zips (no notarization).
#
# Requires Developer ID cert in Keychain ("Always Allow" on first codesign prompt).
# Optional CSC_NAME override in packaging/release.env (see release.sample.env).
#
# Usage:
#   ./packaging/package.sh           # arm64 + x64
#   ./packaging/package.sh --arm64   # arm64 only
#   ./packaging/package.sh --x64     # x64 only
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=packaging/lib.sh
source "$SCRIPT_DIR/lib.sh"

require_macos
cd "$(repo_root)"

export CSC_NAME="${CSC_NAME:-COLLINS ENEBELI (LPV78GHYTM)}"
VERSION="$(read_version)"
ARCHES=(arm64 x64)

for arg in "$@"; do
  case "$arg" in
    --arm64) ARCHES=(arm64) ;;
    --x64) ARCHES=(x64) ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: $0 [--arm64] [--x64]"
      exit 1
      ;;
  esac
done

ARCH_FLAGS=()
for arch in "${ARCHES[@]}"; do
  ARCH_FLAGS+=(--"$arch")
done

echo "→ Developer ID: $CSC_NAME"
echo "→ Version:      $VERSION"
echo "→ Arches:       ${ARCHES[*]}"
echo "→ Notarize:     skipped (run ./packaging/notarize.sh after)"

npm run rebuild:electron
npm run build

export SKIP_NOTARIZE=1
npx electron-builder --mac "${ARCH_FLAGS[@]}" --publish never

echo ""
echo "Signed artifacts in release/:"
for arch in "${ARCHES[@]}"; do
  echo "  release/KeyMIDI-$VERSION-$arch.dmg"
  echo "  release/KeyMIDI-$VERSION-$arch.zip"
done
echo ""
echo "Next: ./packaging/notarize.sh"
