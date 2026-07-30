import type { AnyCard, CharacterCard, Deck, RulesConfig, SupportCard } from "../src/types";

let seq = 0;
const id = () => `id-${++seq}`;
const now = "2026-07-29T00:00:00.000Z";

export function character(overrides: Partial<CharacterCard> = {}): CharacterCard {
  return {
    id: id(),
    type: "Character",
    name: "Barista",
    cardClass: "Shifter",
    rarity: "Common",
    chassisId: "cannon",
    hp: 4,
    attack: { name: "Espresso Shot", damage: 3 },
    abilityId: "cannon",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function fromChassis(chassisId: string, cfg: RulesConfig, overrides: Partial<CharacterCard> = {}): CharacterCard {
  const p = cfg.presets.find((x) => x.id === chassisId);
  if (!p) throw new Error(`No chassis ${chassisId}`);
  return character({
    chassisId: p.id,
    hp: p.hp,
    attack: { name: "Signature Move", damage: p.damage },
    abilityId: p.id,
    ...overrides,
  });
}

export function support(overrides: Partial<SupportCard> = {}): SupportCard {
  return {
    id: id(),
    type: "Support",
    name: "Snack Break",
    effectId: "snack-break",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function deck(entries: Deck["entries"], overrides: Partial<Deck> = {}): Deck {
  return { id: id(), name: "Test Deck", entries, createdAt: now, updatedAt: now, ...overrides };
}

export const indexCards = (cards: AnyCard[]) => new Map(cards.map((c) => [c.id, c]));
