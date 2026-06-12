#!/usr/bin/env bash
# Upload release artifacts to GitHub.
#
# Bump version and tag first, then build + notarize:
#   npm version patch && git push --follow-tags
#   ./packaging/package.sh && ./packaging/notarize.sh
#   ./packaging/publish.sh
#
# Usage:
#   ./packaging/publish.sh              # upload DMGs + zips for package.json version
#   ./packaging/publish.sh --draft      # create/upload as draft release
#   ./packaging/publish.sh --notes FILE # release notes from file
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=packaging/lib.sh
source "$SCRIPT_DIR/lib.sh"

require_gh
cd "$(repo_root)"

VERSION="$(read_version)"
TAG="v$VERSION"
DRAFT=false
NOTES=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --draft) DRAFT=true ;;
    --notes)
      shift
      NOTES="${1:-}"
      if [[ -z "$NOTES" || ! -f "$NOTES" ]]; then
        echo "Usage: $0 --notes path/to/notes.md"
        exit 1
      fi
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--draft] [--notes FILE]"
      exit 1
      ;;
  esac
  shift
done

shopt -s nullglob
ARTIFACTS=(release/KeyMIDI-"$VERSION"-*.dmg release/KeyMIDI-"$VERSION"-*.zip)
shopt -u nullglob

if [[ ${#ARTIFACTS[@]} -eq 0 ]]; then
  echo "No release artifacts found for $VERSION in release/"
  exit 1
fi

create_args=(--title "$TAG")
if $DRAFT; then
  create_args+=(--draft)
fi
if [[ -n "$NOTES" ]]; then
  create_args+=(--notes-file "$NOTES")
else
  create_args+=(--generate-notes)
fi

if gh release view "$TAG" >/dev/null 2>&1; then
  echo "→ Release $TAG already exists; uploading artifacts"
else
  echo "→ Creating release $TAG"
  gh release create "$TAG" "${create_args[@]}"
fi

echo "→ Uploading ${#ARTIFACTS[@]} files"
gh release upload "$TAG" --clobber "${ARTIFACTS[@]}"

echo ""
echo "Done: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/releases/tag/$TAG"
