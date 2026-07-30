import { create } from "zustand";
import {
  defaultConfig,
  defaultTemplates,
  type AnyCard,
  type Deck,
  type RulesConfig,
  type TemplateSet,
} from "@minivanigans/rules-engine";
import { storage, type Snapshot } from "../lib/storage";
import { loadBundle } from "../lib/bundle";
import { loadDefaultDeck } from "../lib/defaultDeck";

interface LibraryState {
  loaded: boolean;
  cards: AnyCard[];
  decks: Deck[];
  /** Active rules config — from the baked bundle (or a user-saved override). */
  config: RulesConfig;
  /** Card frame templates included with the current game bundle. */
  templates: TemplateSet;
  /** Version of the bundle baked into this build. */
  bundleVersion: number;

  load: () => Promise<void>;

  upsertCard: (card: AnyCard) => Promise<void>;
  removeCard: (id: string) => Promise<void>;

  upsertDeck: (deck: Deck) => Promise<void>;
  removeDeck: (id: string) => Promise<void>;

  setConfig: (config: RulesConfig) => Promise<void>;

  /** Replace everything from an imported snapshot. */
  importSnapshot: (snap: Partial<Snapshot>) => Promise<void>;
  /** Append cards + decks (used by Import-a-share); never overwrites existing. */
  addShared: (cards: AnyCard[], decks: Deck[]) => Promise<void>;
  /** Serialize current state for export. */
  exportSnapshot: () => Snapshot;
}

export const useLibrary = create<LibraryState>((set, get) => ({
  loaded: false,
  cards: [],
  decks: [],
  config: defaultConfig,
  templates: defaultTemplates,
  bundleVersion: defaultTemplates.version,

  async load() {
    let [cards, decks, savedConfig, bundle] = await Promise.all([
      storage.loadCards(),
      storage.loadDecks(),
      storage.loadConfig(),
      loadBundle(),
    ]);

    // First launch (nothing saved yet): seed the bundled starter decks so a new
    // player has cards to look at and legal decks to start from. We only seed
    // when the library is completely empty, so deleting everything is respected.
    //
    // v4.1 migration: a library that is *only* the old v3 seed ("ds-seed-*"
    // ids) AND completely untouched (nothing ever edited — seed content ships
    // with updatedAt === createdAt, and every edit path bumps updatedAt) is
    // replaced with the new starter decks — the v3 cards aren't legal under
    // the preset roster. Anything the player created OR edited is never touched.
    const untouched = (x: { createdAt: string; updatedAt: string }) => x.updatedAt === x.createdAt;
    const pureOldSeed =
      cards.length > 0 &&
      decks.length > 0 && // deleting the seed deck is a choice we respect
      cards.every((c) => (c.id.startsWith("ds-seed-") || c.id.startsWith("ds-a-") || c.id.startsWith("ds-b-")) && untouched(c)) &&
      decks.every((d) => (d.id === "ds-seed-deck" || d.id.startsWith("ds-starter-")) && untouched(d));
    if ((cards.length === 0 && decks.length === 0) || pureOldSeed) {
      const seed = await loadDefaultDeck();
      if (seed) {
        cards = seed.cards;
        decks = seed.decks;
        await Promise.all([storage.saveCards(cards), storage.saveDecks(decks)]);
      }
    }

    // A user-saved config only overrides the bundle when it's the same rules
    // generation — a stale v3 config would break the v4.1 engine and builder.
    const config =
      savedConfig && savedConfig.version >= bundle.config.version ? savedConfig : bundle.config;

    set({
      cards,
      decks,
      config,
      templates: bundle.templates,
      bundleVersion: bundle.bundleVersion,
      loaded: true,
    });
  },

  async upsertCard(card) {
    const cards = get().cards.slice();
    const i = cards.findIndex((c) => c.id === card.id);
    if (i >= 0) cards[i] = card;
    else cards.push(card);
    set({ cards });
    await storage.saveCards(cards);
  },

  async removeCard(id) {
    const cards = get().cards.filter((c) => c.id !== id);
    // Prune the card from every deck too — dangling entries would silently
    // shrink decks below the legal 18 with no visible cause.
    let decksChanged = false;
    const decks = get().decks.map((d) => {
      if (!d.entries.some((e) => e.cardId === id)) return d;
      decksChanged = true;
      return { ...d, entries: d.entries.filter((e) => e.cardId !== id), updatedAt: new Date().toISOString() };
    });
    set(decksChanged ? { cards, decks } : { cards });
    await Promise.all([storage.saveCards(cards), decksChanged ? storage.saveDecks(decks) : Promise.resolve()]);
  },

  async upsertDeck(deck) {
    const decks = get().decks.slice();
    const i = decks.findIndex((d) => d.id === deck.id);
    if (i >= 0) decks[i] = deck;
    else decks.push(deck);
    set({ decks });
    await storage.saveDecks(decks);
  },

  async removeDeck(id) {
    const decks = get().decks.filter((d) => d.id !== id);
    set({ decks });
    await storage.saveDecks(decks);
  },

  async setConfig(config) {
    set({ config });
    await storage.saveConfig(config);
  },

  async importSnapshot(snap) {
    const cards = snap.cards ?? get().cards;
    const decks = snap.decks ?? get().decks;
    // A backup from an older rules generation must not roll the live config
    // back (a v3 config would break the v4.1 builder and engine).
    const config =
      snap.config && snap.config.version >= get().config.version ? snap.config : get().config;
    set({ cards, decks, config });
    await Promise.all([
      storage.saveCards(cards),
      storage.saveDecks(decks),
      storage.saveConfig(config),
    ]);
  },

  async addShared(newCards, newDecks) {
    const cards = [...get().cards, ...newCards];
    const decks = [...get().decks, ...newDecks];
    set({ cards, decks });
    await Promise.all([storage.saveCards(cards), storage.saveDecks(decks)]);
  },

  exportSnapshot() {
    const { cards, decks, config } = get();
    return { cards, decks, config };
  },
}));
