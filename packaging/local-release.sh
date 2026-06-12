#!/usr/bin/env bash
# Local signed (+ notarized) macOS release.
#
# Requires Developer ID cert in Keychain ("Always Allow" on first codesign prompt).
# For notarization, export App Store Connect API credentials first:
#   export APPLE_API_KEY_ID="..."
#   export APPLE_API_ISSUER="..."
#   export APPLE_API_KEY="$HOME/path/to/AuthKey_XXXXX.p8"
#
# Usage:
#   ./packaging/local-release.sh              # arm64 + x64, signed + notarized
#   ./packaging/local-release.sh --sign-only    # both arches, signed only
#   ./packaging/local-release.sh --arm64        # arm64 only
set -euo pipefail
cd "$(dirname "$0")/.."

export CSC_NAME="${CSC_NAME:-COLLINS ENEBELI (LPV78GHYTM)}"
VERSION=$(node -p "require('./package.json').version")
ARCHES=(arm64 x64)
NOTARIZE=true

for arg in "$@"; do
  case "$arg" in
    --sign-only) NOTARIZE=false ;;
    --arm64) ARCHES=(arm64) ;;
    --x64) ARCHES=(x64) ;;
  esac
done

ARCH_FLAGS=()
for arch in "${ARCHES[@]}"; do
  ARCH_FLAGS+=(--"$arch")
done

if $NOTARIZE; then
  for var in APPLE_API_KEY_ID APPLE_API_ISSUER APPLE_API_KEY; do
    if [[ -z "${!var:-}" ]]; then
      echo "Missing $var — set App Store Connect API env vars, or run: $0 --sign-only"
      exit 1
    fi
  done
  if [[ ! -f "$APPLE_API_KEY" ]]; then
    echo "APPLE_API_KEY file not found: $APPLE_API_KEY"
    exit 1
  fi
fi

echo "→ Developer ID: $CSC_NAME"
echo "→ Arches:       ${ARCHES[*]}"
echo "→ Notarize:     $NOTARIZE"
$NOTARIZE && echo "→ Notary key:   $APPLE_API_KEY"

npm run rebuild:electron
npm run build

if $NOTARIZE; then
  export DEBUG="${DEBUG:-electron-notarize*}"
  npx electron-builder --mac "${ARCH_FLAGS[@]}" --publish never
else
  export SKIP_NOTARIZE=1
  npx electron-builder --mac "${ARCH_FLAGS[@]}" --publish never
fi

echo ""
echo "Verify (repeat per arch built):"
for arch in "${ARCHES[@]}"; do
  dir="release/mac-$arch"
  [[ "$arch" == "x64" ]] && dir="release/mac"
  echo "  spctl -a -vv --type install $dir/KeyMIDI.app"
done
echo ""
echo "Upload:"
echo "  gh release upload v$VERSION --clobber release/KeyMIDI-$VERSION-{arm64,x64}.{dmg,zip}"
