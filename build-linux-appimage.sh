#!/usr/bin/env bash
#
# Build a Minivanigans! AppImage locally on Linux.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAYER_DIR="${REPO_DIR}/apps/player"
BUNDLE_DIR="${PLAYER_DIR}/src-tauri/target/release/bundle/appimage"

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || die "Required command '$1' was not found."
}

[[ "$(uname -s)" == "Linux" ]] || die "This script must be run on Linux."

need node
need npm
need rustc
need cargo
need pkg-config

if ! pkg-config --exists webkit2gtk-4.1 javascriptcoregtk-4.1; then
  cat >&2 <<'DEPS'
ERROR: Tauri's Linux development libraries were not found.

Ubuntu / Debian:
  sudo apt-get update
  sudo apt-get install -y \
    libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev \
    libxdo-dev libssl-dev patchelf build-essential curl wget file

Fedora:
  sudo dnf install -y \
    webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel \
    libxdo-devel openssl-devel patchelf gcc-c++ make curl wget file

Install the packages for your distribution, then run this script again.
DEPS
  exit 1
fi

cd "${REPO_DIR}"

printf '\n==> Installing JavaScript dependencies\n'
npm install

printf '\n==> Running tests\n'
npm test

printf '\n==> Building the shared rules engine\n'
npm run build -w @minivanigans/rules-engine

printf '\n==> Building the Linux AppImage\n'
(
  cd "${PLAYER_DIR}"
  npm run tauri build -- --ci --bundles appimage
)

printf '\nBuild complete. AppImage:\n'
find "${BUNDLE_DIR}" -maxdepth 1 -type f -name '*.AppImage' -print

printf '\nTo run it:\n'
printf '  chmod +x "%s/<file>.AppImage"\n' "${BUNDLE_DIR}"
printf '  "%s/<file>.AppImage"\n' "${BUNDLE_DIR}"
