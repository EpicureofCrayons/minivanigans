import type { AnyCard, Deck, Profile, RulesConfig } from "@minivanigans/rules-engine";
import type { Storage } from "./types";
import { isBundledRef, bundledUrl, bundledAsDataUrl } from "./bundled";

// localStorage-backed fallback so the UI can be developed/previewed in a plain
// browser tab (outside the Tauri shell). Images are kept as data URLs.

const K = {
  cards: "day-shifters:cards",
  decks: "day-shifters:decks",
  config: "day-shifters:config",
  profile: "day-shifters:profile",
  images: "day-shifters:images",
} as const;

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function bytesToDataUrl(bytes: Uint8Array, ext: string): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const mime = ext.includes("png") ? "image/png" : ext.includes("webp") ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${btoa(binary)}`;
}

export const browserStorage: Storage = {
  kind: "browser",

  loadCards: async () => read<AnyCard[]>(K.cards, []),
  saveCards: async (cards) => write(K.cards, cards),
  loadDecks: async () => read<Deck[]>(K.decks, []),
  saveDecks: async (decks) => write(K.decks, decks),
  loadConfig: async () => read<RulesConfig | null>(K.config, null),
  saveConfig: async (config) => write(K.config, config),
  loadProfile: async () => read<Profile | null>(K.profile, null),
  saveProfile: async (profile) => write(K.profile, profile),

  async saveImage(bytes, ext) {
    const ref = `mem:${crypto.randomUUID()}`;
    const map = read<Record<string, string>>(K.images, {});
    map[ref] = bytesToDataUrl(bytes, ext);
    write(K.images, map);
    return ref;
  },

  async imageUrl(ref) {
    if (ref.startsWith("data:")) return ref; // inline (e.g. from an imported share)
    if (isBundledRef(ref)) return bundledUrl(ref); // build-shipped art (starter deck)
    const map = read<Record<string, string>>(K.images, {});
    return map[ref];
  },

  async imageData(ref) {
    if (ref.startsWith("data:")) return ref;
    if (isBundledRef(ref)) return bundledAsDataUrl(bundledUrl(ref));
    const map = read<Record<string, string>>(K.images, {});
    return map[ref]; // browser images are already stored as data URLs
  },

  location: async () => "Browser localStorage (preview mode — not the real app)",
};
