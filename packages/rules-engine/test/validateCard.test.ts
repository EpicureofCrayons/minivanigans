import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config";
import { validateCard } from "../src/validateCard";
import { character, fromChassis, support } from "./helpers";

describe("v5 card validation", () => {
  it("accepts all eight chassis", () => {
    for (const c of defaultConfig.presets) expect(validateCard(fromChassis(c.id, defaultConfig), defaultConfig).ok, c.id).toBe(true);
  });

  it("requires a chassis and exact standard stats", () => {
    expect(validateCard(character({ chassisId: undefined }), defaultConfig).ok).toBe(false);
    const altered = fromChassis("anchor", defaultConfig, { hp: 6 });
    expect(validateCard(altered, defaultConfig).errors.some((e) => e.includes("must match"))).toBe(true);
  });

  it("requires the chassis Shift id and an Everyday flavor name", () => {
    expect(validateCard(fromChassis("pivot", defaultConfig, { abilityId: "cannon" }), defaultConfig).ok).toBe(false);
    expect(validateCard(fromChassis("pivot", defaultConfig, { attack: { name: "", damage: 2 } }), defaultConfig).errors)
      .toContain("Everyday Move needs a custom name.");
  });

  it("accepts known Moments and rejects unknown ones", () => {
    expect(validateCard(support({ effectId: "good-vibes" }), defaultConfig).ok).toBe(true);
    expect(validateCard(support({ effectId: "old-effect" }), defaultConfig).errors).toContain("Unknown Moment effect.");
  });

  it("applies the local conduct check", () => {
    const cfg = { ...defaultConfig, conduct: { bannedWords: ["pickle"] } };
    expect(validateCard(fromChassis("cannon", cfg, { name: "PICKLE Wizard" }), cfg).ok).toBe(false);
  });
});
