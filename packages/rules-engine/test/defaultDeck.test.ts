import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config";
import type { AnyCard, Deck } from "../src/types";
import { validateCard } from "../src/validateCard";
import { validateDeck } from "../src/validateDeck";

interface StarterDeckFile {
  version: number;
  cards: AnyCard[];
  decks: Deck[];
}

const starterFile = new URL("../../../apps/player/public/default-deck.json", import.meta.url);
const starter = JSON.parse(readFileSync(starterFile, "utf8")) as StarterDeckFile;
const cardsById = new Map(starter.cards.map((card) => [card.id, card]));

describe("bundled Minivanigans starter decks", () => {
  it("ships as native Rules v5 data with legal cards", () => {
    expect(starter.version).toBe(5);

    for (const card of starter.cards) {
      expect(validateCard(card, defaultConfig), card.name).toMatchObject({
        ok: true,
        errors: [],
      });
    }
  });

  it("contains two legal 12-Character / 6-Moment decks", () => {
    expect(starter.decks).toHaveLength(2);

    for (const deck of starter.decks) {
      expect(validateDeck(deck, cardsById, defaultConfig), deck.name).toMatchObject({
        ok: true,
        errors: [],
        counts: { total: 18, character: 12, support: 6 },
      });
    }
  });

  it("introduces all eight standard Moments across the two decks", () => {
    const includedCardIds = new Set(
      starter.decks.flatMap((deck) => deck.entries.map((entry) => entry.cardId))
    );
    const momentIds = starter.cards
      .filter((card) => includedCardIds.has(card.id) && card.type === "Support")
      .map((card) => card.effectId)
      .sort();

    expect(momentIds).toEqual(defaultConfig.supportEffects.map((effect) => effect.id).sort());
  });
});
