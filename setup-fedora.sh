#!/usr/bin/env bash
#
# setup-fedora.sh — guided install of the Minivanigans! toolchain on Fedora.
#
# Installs (only what's missing):
#   1. Node.js + npm        — for the React/Vite frontends and the rules-engine tests
#   2. Rust (via rustup)    — for Tauri's native desktop shell (Phase 2+)
#   3. Tauri Linux deps     — webkit2gtk etc. so `tauri build` works on Fedora
#
# Safe to re-run: every step is idempotent and skips anything already present.
# You'll be prompted before each install so nothing happens without your say-so.

set -u  # treat unset variables as errors; we deliberately do NOT use -e so a
        # single failed step doesn't abort the whole guided run.

# ---- pretty output helpers --------------------------------------------------
BOLD=$'\e[1m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; RED=$'\e[31m'; BLUE=$'\e[34m'; RESET=$'\e[0m'
say()   { printf '%s\n' "${BLUE}==>${RESET} ${BOLD}$*${RESET}"; }
ok()    { printf '%s\n' "${GREEN}  ✓${RESET} $*"; }
warn()  { printf '%s\n' "${YELLOW}  !${RESET} $*"; }
err()   { printf '%s\n' "${RED}  ✗${RESET} $*"; }
have()  { command -v "$1" >/dev/null 2>&1; }

# Ask a yes/no question; default is yes. Returns 0 for yes, 1 for no.
confirm() {
  local prompt="$1" reply
  read -r -p "${BOLD}${prompt}${RESET} [Y/n] " reply
  case "${reply:-y}" in
    [Yy]*|"") return 0 ;;
    *)        return 1 ;;
  esac
}

# ---- preflight --------------------------------------------------------------
if [[ ! -f /etc/fedora-release ]]; then
  warn "This doesn't look like Fedora. The dnf commands below may not apply."
  confirm "Continue anyway?" || exit 1
fi

say "Minivanigans! toolchain setup for Fedora"
echo "This will check for Node.js, Rust, and Tauri's system libraries,"
echo "and offer to install whatever is missing. Nothing installs without a prompt."
echo

# ---- 1. Node.js + npm -------------------------------------------------------
say "Step 1 / 3 — Node.js + npm"
if have node && have npm; then
  ok "Node $(node --version) and npm $(npm --version) already installed."
else
  warn "Node.js / npm not found."
  echo "  Required for the React frontends and the rules-engine test suite (Phase 1)."
  if confirm "Install Node.js + npm via dnf?"; then
    sudo dnf install -y nodejs npm
    if have node; then ok "Installed Node $(node --version)."; else err "Node install failed — check the dnf output above."; fi
  else
    warn "Skipped. Phase 1 cannot run without Node."
  fi
fi
echo

# ---- 2. Rust (rustup) -------------------------------------------------------
say "Step 2 / 3 — Rust (via rustup)"
if have rustc && have cargo; then
  ok "Rust $(rustc --version) already installed."
elif [[ -x "$HOME/.cargo/bin/rustc" ]]; then
  warn "Rust is installed but not on this shell's PATH."
  echo "  Run:  ${BOLD}source \"\$HOME/.cargo/env\"${RESET}  (or open a new terminal)."
else
  warn "Rust not found."
  echo "  Required for Tauri's native desktop shell — only needed from Phase 2 onward."
  echo "  (You can skip this now and still build/test the entire rules engine.)"
  if confirm "Install Rust via rustup now?"; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    # shellcheck disable=SC1091
    [[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"
    if have rustc; then ok "Installed Rust $(rustc --version)."; else
      warn "Installed, but not yet on PATH. Run: source \"\$HOME/.cargo/env\""
    fi
  else
    warn "Skipped Rust. That's fine for Phase 1."
  fi
fi
echo

# ---- 3. Tauri Linux system dependencies -------------------------------------
say "Step 3 / 3 — Tauri Linux system libraries"
# These are dev packages Tauri needs to compile against the OS webview on Fedora.
TAURI_PKGS=(webkit2gtk4.1-devel openssl-devel curl wget file
            libappindicator-gtk3-devel librsvg2-devel patchelf)

# Figure out which are already installed so we only prompt if something's missing.
missing=()
for pkg in "${TAURI_PKGS[@]}"; do
  rpm -q "$pkg" >/dev/null 2>&1 || missing+=("$pkg")
done

if [[ ${#missing[@]} -eq 0 ]]; then
  ok "All Tauri system libraries already present."
else
  warn "Missing ${#missing[@]} package(s): ${missing[*]}"
  echo "  Needed by Tauri from Phase 2 onward; not required for Phase 1."
  if confirm "Install the missing Tauri system libraries?"; then
    sudo dnf install -y "${missing[@]}"
    sudo dnf group install -y "c-development" "development-tools"
    ok "Tauri system libraries installed."
  else
    warn "Skipped. Install before Phase 2 with:"
    echo "    sudo dnf install ${TAURI_PKGS[*]}"
  fi
fi
echo

# ---- summary ----------------------------------------------------------------
say "Summary"
printf '  %-8s ' "Node:";  have node  && echo "${GREEN}$(node --version)${RESET}"  || echo "${RED}not installed${RESET}"
printf '  %-8s ' "npm:";   have npm   && echo "${GREEN}$(npm --version)${RESET}"    || echo "${RED}not installed${RESET}"
printf '  %-8s ' "rustc:"; have rustc && echo "${GREEN}$(rustc --version)${RESET}"  || echo "${YELLOW}not installed (only needed from Phase 2)${RESET}"
printf '  %-8s ' "cargo:"; have cargo && echo "${GREEN}$(cargo --version)${RESET}"  || echo "${YELLOW}not installed (only needed from Phase 2)${RESET}"
echo
if have node && have npm; then
  ok "Ready for Phase 1 (rules engine + tests)."
else
  warn "Install Node before starting Phase 1."
fi
if ! have cargo && [[ -x "$HOME/.cargo/bin/cargo" ]]; then
  warn "Rust is installed but not active in this shell — run: source \"\$HOME/.cargo/env\""
fi
