#!/usr/bin/env bash
#
# release.sh
# One-command release helper for Minivanigans! (Player app).
#
# Bumps the version in the two files that matter, commits, tags, and pushes.
# Pushing the tag is what triggers .github/workflows/release.yml, which builds
# the macOS/Windows/Linux installers and creates a DRAFT GitHub Release.
#
# Usage:
#   ./release.sh 0.2.0        # set an explicit version
#   ./release.sh patch        # 0.1.0 -> 0.1.1
#   ./release.sh minor        # 0.1.0 -> 0.2.0
#   ./release.sh major        # 0.1.0 -> 1.0.0
#   ./release.sh              # prompt (suggests a patch bump)
#
set -euo pipefail

# --- Resolve the repo directory (handles spaces in the path) ---------------
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

TAURI_CONF="apps/player/src-tauri/tauri.conf.json"
PLAYER_PKG="apps/player/package.json"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: $REPO_DIR is not a git repository." >&2
  exit 1
fi
for f in "$TAURI_CONF" "$PLAYER_PKG"; do
  [[ -f "$f" ]] || { echo "ERROR: cannot find $f" >&2; exit 1; }
done

# --- Read the current version from tauri.conf.json -------------------------
CURRENT="$(grep -m1 '"version"' "$TAURI_CONF" | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')"
if [[ ! "$CURRENT" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "ERROR: could not read a valid version (got '$CURRENT') from $TAURI_CONF." >&2
  exit 1
fi
echo "Current version: $CURRENT"

# --- Work out the new version ----------------------------------------------
IFS='.' read -r MAJ MIN PAT <<< "$CURRENT"
bump() {
  case "$1" in
    major) echo "$((MAJ + 1)).0.0" ;;
    minor) echo "${MAJ}.$((MIN + 1)).0" ;;
    patch) echo "${MAJ}.${MIN}.$((PAT + 1))" ;;
  esac
}

ARG="${1:-}"
case "$ARG" in
  major|minor|patch) NEW="$(bump "$ARG")" ;;
  "" )
    SUGGEST="$(bump patch)"
    read -r -p "New version [${SUGGEST}]: " NEW
    NEW="${NEW:-$SUGGEST}"
    ;;
  * ) NEW="$ARG" ;;   # treat anything else as an explicit version
esac

if [[ ! "$NEW" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "ERROR: '$NEW' is not a valid X.Y.Z version." >&2
  exit 1
fi
if [[ "$NEW" == "$CURRENT" ]]; then
  echo "ERROR: new version equals current version ($CURRENT). Nothing to do." >&2
  exit 1
fi
TAG="v${NEW}"

# --- Safety checks ----------------------------------------------------------
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  echo "WARNING: you are on '$BRANCH', not 'main'. Releases are normally cut from main." >&2
  read -r -p "Continue on '$BRANCH' anyway? [y/N]: " C; [[ "$C" == [yY] ]] || { echo "Aborted."; exit 1; }
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: working tree is not clean. Commit or stash your changes first," >&2
  echo "       so the release commit contains only the version bump." >&2
  git status --short >&2
  exit 1
fi
if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "ERROR: tag ${TAG} already exists locally." >&2
  exit 1
fi
if git ls-remote --exit-code --tags origin "${TAG}" >/dev/null 2>&1; then
  echo "ERROR: tag ${TAG} already exists on origin." >&2
  exit 1
fi

# --- Confirm ----------------------------------------------------------------
echo
echo "About to release:  ${CURRENT}  ->  ${NEW}   (tag ${TAG})"
echo "  - update version in ${TAURI_CONF} and ${PLAYER_PKG}"
echo "  - commit, tag ${TAG}, and push 'main' + the tag to origin"
echo "  - pushing the tag triggers the CI build + DRAFT GitHub Release"
echo
read -r -p "Proceed? [y/N]: " GO; [[ "$GO" == [yY] ]] || { echo "Aborted."; exit 1; }

# --- Apply the version bump (first "version" line in each file) -------------
set_version() {
  local file="$1" v="$2"
  awk -v v="$v" '
    !done && /"version"[[:space:]]*:/ {
      sub(/"version"[[:space:]]*:[[:space:]]*"[^"]*"/, "\"version\": \"" v "\"")
      done = 1
    }
    { print }
  ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
}
set_version "$TAURI_CONF" "$NEW"
set_version "$PLAYER_PKG" "$NEW"

# --- Commit, tag, push ------------------------------------------------------
git add "$TAURI_CONF" "$PLAYER_PKG"
git commit -q -m "Release ${TAG}"
git tag "$TAG"

echo
echo "Pushing main + ${TAG} ..."
git push origin "$BRANCH"
git push origin "$TAG"

echo
echo "✅ Released ${TAG}."
echo "   Watch the build:  https://github.com/EpicureofCrayons/minivanaganstcg/actions"
echo "   When it's green, review the DRAFT release and publish it."
