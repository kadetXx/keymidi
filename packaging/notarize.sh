#!/usr/bin/env bash
# Notarize and staple release DMGs via notarytool (same flow that worked locally).
#
# Credentials load from packaging/release.env (see release.sample.env).
#
# Usage:
#   ./packaging/notarize.sh                        # all DMGs for current version
#   ./packaging/notarize.sh release/KeyMIDI-*.dmg  # specific files
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=packaging/lib.sh
source "$SCRIPT_DIR/lib.sh"

require_macos
require_apple_api
cd "$(repo_root)"

VERSION="$(read_version)"
DMGS=()

if [[ $# -gt 0 ]]; then
  DMGS=("$@")
else
  shopt -s nullglob
  DMGS=(release/KeyMIDI-"$VERSION"-*.dmg)
  shopt -u nullglob
fi

if [[ ${#DMGS[@]} -eq 0 ]]; then
  echo "No DMGs found. Run ./packaging/package.sh first."
  exit 1
fi

notary_args=(
  --key "$APPLE_API_KEY"
  --key-id "$APPLE_API_KEY_ID"
  --issuer "$APPLE_API_ISSUER"
)

for dmg in "${DMGS[@]}"; do
  if [[ ! -f "$dmg" ]]; then
    echo "File not found: $dmg"
    exit 1
  fi

  echo ""
  echo "→ Signing $dmg"
  codesign --force --sign "$(codesign_identity)" --timestamp "$dmg"

  echo "→ Submitting $dmg"
  xcrun notarytool submit "$dmg" "${notary_args[@]}" --wait

  echo "→ Stapling $dmg"
  xcrun stapler staple "$dmg"
  xcrun stapler validate "$dmg"

  echo "→ Gatekeeper check"
  spctl -a -t open --context context:primary-signature -vv "$dmg"
done

echo ""
echo "Notarized DMGs ready. Next: ./packaging/publish.sh"
