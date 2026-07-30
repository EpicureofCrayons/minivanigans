#!/usr/bin/env bash
#
# Build a universal Minivanigans! macOS app and DMG locally.
#
# Default: unsigned build for local testing.
# Signed build: MINIVANIGANS_SIGNED_BUILD=1 ./build-macos.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAYER_DIR="${REPO_DIR}/apps/player"
BUNDLE_DIR="${PLAYER_DIR}/src-tauri/target/universal-apple-darwin/release/bundle"

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || die "Required command '$1' was not found."
}

[[ "$(uname -s)" == "Darwin" ]] || die "This script must be run on macOS."

need node
need npm
need rustc
need cargo
need rustup
need xcode-select

if ! xcode-select -p >/dev/null 2>&1; then
  die "Apple command-line tools are missing. Run: xcode-select --install"
fi

cd "${REPO_DIR}"

printf '\n==> Installing JavaScript dependencies\n'
npm install

printf '\n==> Running tests\n'
npm test

printf '\n==> Building the shared rules engine\n'
npm run build -w @minivanigans/rules-engine

printf '\n==> Installing the Intel and Apple Silicon Rust targets\n'
rustup target add aarch64-apple-darwin x86_64-apple-darwin

TAURI_ARGS=(
  build
  --
  --ci
  --target universal-apple-darwin
  --bundles app,dmg
)

if [[ "${MINIVANIGANS_SIGNED_BUILD:-0}" != "1" ]]; then
  TAURI_ARGS+=(--no-sign)
  printf '\n==> Building an unsigned universal macOS app and DMG\n'
else
  printf '\n==> Building a signed universal macOS app and DMG\n'
fi

(
  cd "${PLAYER_DIR}"
  npm run tauri "${TAURI_ARGS[@]}"
)

printf '\nBuild complete. Artifacts:\n'
find "${BUNDLE_DIR}" -maxdepth 3 \
  \( -type f -name '*.dmg' -o -type d -name '*.app' \) \
  -print

if [[ "${MINIVANIGANS_SIGNED_BUILD:-0}" != "1" ]]; then
  printf '\nNote: this build is unsigned. macOS may require right-clicking the app and choosing Open.\n'
fi
