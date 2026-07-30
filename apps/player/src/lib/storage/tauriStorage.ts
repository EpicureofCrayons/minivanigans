import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
  writeFile,
  readFile,
} from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { AnyCard, Deck, Profile, RulesConfig } from "@minivanigans/rules-engine";
import { FILES, type Storage } from "./types";
import { isBundledRef, bundledUrl, bundledAsDataUrl } from "./bundled";

const opts = { baseDir: BaseDirectory.AppData } as const;

/** Creating images/ recursively also creates the app-data root if absent. */
async function ensureDirs(): Promise<void> {
  if (!(await exists(FILES.imagesDir, opts))) {
    await mkdir(FILES.imagesDir, { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

async function readJson<T>(name: string, fallback: T): Promise<T> {
  if (!(await exists(name, opts))) return fallback;
  try {
    return JSON.parse(await readTextFile(name, opts)) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(name: string, data: unknown): Promise<void> {
  await ensureDirs();
  await writeTextFile(name, JSON.stringify(data, null, 2), opts);
}

export const tauriStorage: Storage = {
  kind: "tauri",

  loadCards: () => readJson<AnyCard[]>(FILES.cards, []),
  saveCards: (cards) => writeJson(FILES.cards, cards),
  loadDecks: () => readJson<Deck[]>(FILES.decks, []),
  saveDecks: (decks) => writeJson(FILES.decks, decks),
  loadConfig: () => readJson<RulesConfig | null>(FILES.config, null),
  saveConfig: (config) => writeJson(FILES.config, config),
  loadProfile: () => readJson<Profile | null>(FILES.profile, null),
  saveProfile: (profile) => writeJson(FILES.profile, profile),

  async saveImage(bytes, ext) {
    await ensureDirs();
    const rel = `${FILES.imagesDir}/${crypto.randomUUID()}.${ext.replace(/^\./, "")}`;
    await writeFile(rel, bytes, opts);
    return rel;
  },

  async imageUrl(ref) {
    if (ref.startsWith("data:")) return ref; // inline (e.g. from an imported share)
    // Art shipped with the build (e.g. the seeded starter deck): served as a
    // static asset from public/, so a plain relative URL resolves in the webview.
    if (isBundledRef(ref)) return bundledUrl(ref);
    try {
      const abs = await join(await appDataDir(), ref);
      return convertFileSrc(abs);
    } catch {
      return undefined;
    }
  },

  async imageData(ref) {
    if (ref.startsWith("data:")) return ref;
    if (isBundledRef(ref)) return bundledAsDataUrl(bundledUrl(ref));
    try {
      const bytes = await readFile(ref, opts);
      const ext = ref.split(".").pop()?.toLowerCase() || "png";
      const mime = ext.includes("png") ? "image/png" : ext.includes("webp") ? "image/webp" : "image/jpeg";
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
      return `data:${mime};base64,${btoa(bin)}`;
    } catch {
      return undefined;
    }
  },

  location: () => appDataDir(),
};
