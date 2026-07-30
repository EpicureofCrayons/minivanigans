# Third-Party Licenses

Minivanigans! bundles open-source software. This file lists the **direct
dependencies** and their licenses, and reproduces the full text of each license
type used. It satisfies the attribution conditions of the permissive licenses
those dependencies are distributed under.

> **Note on completeness.** This is a hand-compiled list of *direct*
> dependencies. Before a formal public release, regenerate a complete list that
> also covers *transitive* dependencies:
>
> - **JavaScript/npm:** `npx license-checker-rseidelsohn --production --out THIRD-PARTY-JS.txt`
> - **Rust/Cargo (Tauri):** `cargo install cargo-about && cargo about generate about.hbs > THIRD-PARTY-RUST.html`
>   (run inside `apps/player/src-tauri`)

---

## Application dependencies (JavaScript)

| Package | License |
| --- | --- |
| react, react-dom | MIT |
| react-router-dom | MIT |
| zustand | MIT |
| zod | MIT |
| @dnd-kit/core, @dnd-kit/utilities | MIT |
| lucide-react | ISC |
| tailwindcss, @tailwindcss/vite | MIT |
| vite, @vitejs/plugin-react | MIT |
| vitest | MIT |
| typescript | Apache-2.0 |
| @types/react, @types/react-dom | MIT |
| @tauri-apps/api | MIT OR Apache-2.0 |
| @tauri-apps/plugin-dialog, plugin-fs, plugin-opener | MIT OR Apache-2.0 |
| @tauri-apps/cli | MIT OR Apache-2.0 |

## Fonts

| Font | License |
| --- | --- |
| Fredoka (via @fontsource-variable/fredoka) | SIL Open Font License 1.1 (OFL-1.1) |
| Sora (via @fontsource-variable/sora) | SIL Open Font License 1.1 (OFL-1.1) |

The `@fontsource-variable/*` npm packaging is MIT; the **font files themselves**
are licensed under the SIL Open Font License 1.1. Under the OFL, the fonts may
be bundled and redistributed freely, but may not be sold by themselves, and the
license/copyright notice must travel with them.

## Native runtime (Rust / Tauri)

The desktop shell is built with [Tauri](https://tauri.app), which along with its
transitive crate dependencies is distributed under **MIT OR Apache-2.0**. Run
`cargo about` (see note above) to produce the complete per-crate list.

---

## License texts

### MIT License

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### ISC License

```
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```

### Apache License 2.0

Full text: https://www.apache.org/licenses/LICENSE-2.0

### SIL Open Font License 1.1

Full text: https://openfontlicense.org
