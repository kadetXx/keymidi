#!/usr/bin/env bash
# Shared helpers for local macOS release scripts.

RELEASE_ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/release.env"

load_release_env() {
  if [[ -f "$RELEASE_ENV_FILE" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "$RELEASE_ENV_FILE"
    set +a
  fi
}

repo_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd
}

read_version() {
  node -p "require('$(repo_root)/package.json').version"
}

require_macos() {
  if [[ "$(uname -s)" != "Darwin" ]]; then
    echo "This script must run on macOS."
    exit 1
  fi
}

require_apple_api() {
  for var in APPLE_API_KEY_ID APPLE_API_ISSUER APPLE_API_KEY; do
    if [[ -z "${!var:-}" ]]; then
      echo "Missing $var — copy packaging/release.sample.env to packaging/release.env and fill it in."
      exit 1
    fi
  done
  if [[ ! -f "$APPLE_API_KEY" ]]; then
    echo "APPLE_API_KEY file not found: $APPLE_API_KEY"
    echo "Update the path in packaging/release.env (see release.sample.env)."
    exit 1
  fi
}

require_gh() {
  if ! command -v gh >/dev/null 2>&1; then
    echo "GitHub CLI (gh) is required. Install: brew install gh"
    exit 1
  fi
}

load_release_env
