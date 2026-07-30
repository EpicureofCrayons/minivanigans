import type { Storage } from "./types";
import { tauriStorage } from "./tauriStorage";
import { browserStorage } from "./browserStorage";

/** True when running inside the Tauri webview (vs. a plain browser tab). */
export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const storage: Storage = isTauri ? tauriStorage : browserStorage;

export type { Storage, Snapshot } from "./types";
