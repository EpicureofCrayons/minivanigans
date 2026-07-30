import type { AnyCard, Deck, Profile, RulesConfig } from "@minivanigans/rules-engine";

/** A full portable snapshot of the user's data (used for export/import). */
export interface Snapshot {
  cards: AnyCard[];
  decks: Deck[];
  /** null means "no bundled config saved yet — use engine defaults". */
  config: RulesConfig | null;
}

/**
 * Storage abstraction. Two implementations exist:
 *  - tauriStorage:  real files under the OS app-data dir (production)
 *  - browserStorage: localStorage (lets the UI run in a plain browser tab)
 * The right one is chosen at runtime in ./index.ts.
 */
export interface Storage {
  readonly kind: "tauri" | "browser";
  loadCards(): Promise<AnyCard[]>;
  saveCards(cards: AnyCard[]): Promise<void>;
  loadDecks(): Promise<Deck[]>;
  saveDecks(decks: Deck[]): Promise<void>;
  loadConfig(): Promise<RulesConfig | null>;
  saveConfig(config: RulesConfig): Promise<void>;
  loadProfile(): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<void>;
  /** Persist image bytes; returns a stable reference to store on the card. */
  saveImage(bytes: Uint8Array, ext: string): Promise<string>;
  /** Resolve a stored image reference to something usable as <img src>. */
  imageUrl(ref: string): Promise<string | undefined>;
  /** Read a stored image back as a `data:` URL (used when building shares). */
  imageData(ref: string): Promise<string | undefined>;
  /** Human-readable description of where the data lives (shown in Settings). */
  location(): Promise<string>;
}

export const FILES = {
  cards: "cards.json",
  decks: "decks.json",
  config: "config.json",
  profile: "profile.json",
  imagesDir: "images",
} as const;
