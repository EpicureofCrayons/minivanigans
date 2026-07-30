import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config";
import { canAddCardToDeck, validateDeck } from "../src/validateDeck";
import { deck, fromChassis, indexCards, support } from "./helpers";

function fixture() {
  const chars = ["anchor", "cannon", "pivot", "sustainer", "trickster", "captain"].map((id) => fromChassis(id, defaultConfig));
  const moments = ["snack-break", "running-late", "carpool"].map((id) => support({ effectId: id, name: id }));
  const cards = [...chars, ...moments];
  const d = deck([
    ...chars.map((c) => ({ cardId: c.id, count: 2 })),
    ...moments.map((c) => ({ cardId: c.id, count: 2 })),
  ]);
  return { cards, d, byId: indexCards(cards) };
}

describe("v5 deck validation", () => {
  it("accepts exactly 12 Characters and 6 Moments", () => {
    const { d, byId } = fixture();
    expect(validateDeck(d, byId, defaultConfig).ok).toBe(true);
  });

  it("counts differently named Characters by chassis", () => {
    const a = fromChassis("cannon", defaultConfig, { name: "A" });
    const b = fromChassis("cannon", defaultConfig, { name: "B" });
    const d = deck([{ cardId: a.id, count: 2 }, { cardId: b.id, count: 2 }]);
    expect(validateDeck(d, indexCards([a, b]), defaultConfig).errors.some((e) => e.includes("Too many copies"))).toBe(true);
  });

  it("enforces each Moment's printed limit across custom names", () => {
    const a = support({ name: "Again!", effectId: "encore" });
    const b = support({ name: "One More!", effectId: "encore" });
    const d = deck([{ cardId: a.id, count: 1 }, { cardId: b.id, count: 1 }]);
    expect(validateDeck(d, indexCards([a, b]), defaultConfig).errors.some((e) => e.includes("Encore"))).toBe(true);
  });

  it("blocks a nineteenth card", () => {
    const { d, byId, cards } = fixture();
    expect(canAddCardToDeck(d, cards[0]!, byId, defaultConfig).ok).toBe(false);
  });
});
