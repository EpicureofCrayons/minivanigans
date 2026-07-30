import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config";

describe("Rules v5 configuration", () => {
  it("contains the eight fixed chassis", () => {
    expect(defaultConfig.presets.map((c) => c.id)).toEqual([
      "anchor", "cannon", "pivot", "sustainer", "trickster", "captain", "wildcard", "underdog",
    ]);
  });

  it("uses the v5 deck and win targets", () => {
    expect(defaultConfig.deck.character).toEqual({ min: 12, max: 12 });
    expect(defaultConfig.deck.support).toEqual({ min: 6, max: 6 });
    expect(defaultConfig.rules.winKnockouts).toBe(3);
    expect(defaultConfig.rules.koComebackDraw).toBe(0);
    expect(defaultConfig.rules.suddenDeath).toBe(false);
  });

  it("contains the complete Moment menu with printed limits", () => {
    expect(defaultConfig.supportEffects).toHaveLength(8);
    expect(defaultConfig.supportEffects.find((m) => m.id === "encore")?.maxPerDeck).toBe(1);
    expect(defaultConfig.supportEffects.find((m) => m.id === "snack-break")?.maxPerDeck).toBe(2);
  });
});
