<p align="center">
  <img src="logo/minivanigans-logo-text-only-green-vanigans-v2%20transparent.png" alt="Minivanigans!" width="720">
</p>

# Minivanigans!

Minivanigans! is a make-your-own card game about ordinary characters having
extraordinary shifts. Turn family, friends, pets, imaginary creatures, and
everyday oddballs into cards, pack a Minivan, and see who can score three
Knockouts first.

This repository contains the desktop companion app and the shared game engine.
The app helps you make balanced cards, build legal decks, play against the bot,
and print everything you need for a game at home.

## What you can do

- Make custom Character and Moment cards without changing their underlying
  game balance.
- Build an 18-card deck with live legality checks.
- Test a deck against the computer.
- Create a profile, avatar, and custom ride.
- Print or export cards, themed card backs, game tokens, rules, and a personal
  play mat.
- Back up or share your creations.

Your cards and profile stay on your device unless you choose to export or share
them.

## Start playing

Download the newest build from
[GitHub Releases](https://github.com/EpicureofCrayons/Minivanigans/releases).
Installers are produced for macOS, Windows, and Linux.

The current game rules are in
[Minivanigans_Rules_v5.md](Minivanigans_Rules_v5.md). Version 5 is still being
playtested, so individual card numbers may change as real games reveal what is
fun and what needs tuning.

See [CHANGELOG.md](CHANGELOG.md) for the changes included in each app version.

## Work on the app

You will need [Node.js](https://nodejs.org), [Rust](https://rustup.rs), and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/) for your
operating system.

```bash
npm install
npm run build -w @minivanigans/rules-engine
cd apps/player
npm run tauri dev
```

On Fedora, `./setup-fedora.sh` can install the required system packages.

The main pieces of the project are:

- `apps/player` — the React and Tauri desktop app.
- `packages/rules-engine` — game rules, validation, deck filling, and bot logic.
- `Minivanigans_Rules_v5.md` — the current tabletop rules.

## Build an installer

Run the helper for the operating system you are currently using:

```bash
# macOS: universal Intel and Apple Silicon app and DMG
./build-macos.sh

# Linux: AppImage
./build-linux-appimage.sh
```

```powershell
# Windows: MSI and setup executable
.\build-windows.ps1
```

Each helper checks the toolchain, installs JavaScript dependencies, runs the
tests, builds the rules engine, and packages the player app. Build output is
written below `apps/player/src-tauri/target/`.

The macOS and Windows helpers create unsigned local builds by default. For a
signed build, use `MINIVANIGANS_SIGNED_BUILD=1 ./build-macos.sh` on macOS or
`.\build-windows.ps1 -Signed` on Windows after configuring the signing
credentials.

## License

The application code is available under the [MIT License](LICENSE).

The game rules, artwork, logos, and other game content are available under
[CC BY-NC 4.0](LICENSE-CONTENT.md): you may share and adapt them with
attribution, but not sell them.

Third-party acknowledgements are listed in
[THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md).
