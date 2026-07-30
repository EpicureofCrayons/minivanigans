import type {
  AnyCard,
  CardClass,
  CardType,
  CharacterCard,
  RulesConfig,
  SupportCard,
} from "@minivanigans/rules-engine";

/** Default art framing: centered, no zoom. */
export const DEFAULT_TRANSFORM = { x: 50, y: 50, scale: 1 } as const;

/** A fresh, mostly-blank card of the given type with sensible defaults. */
export function blankCard(type: CardType, cfg: RulesConfig): AnyCard {
  const now = new Date().toISOString();
  const base = {
    id: crypto.randomUUID(),
    name: "",
    imageTransform: { ...DEFAULT_TRANSFORM },
    createdAt: now,
    updatedAt: now,
  };

  if (type === "Support") {
    const support: SupportCard = {
      ...base,
      type: "Support",
      effectId: cfg.supportEffects[0]?.id ?? "",
    };
    return support;
  }

  // v5: Characters are built on one of eight fixed chassis.
  const chassis = cfg.presets[0];
  const character: CharacterCard = {
    ...base,
    type: "Character",
    cardClass: "Shifter",
    rarity: "Common",
    chassisId: chassis?.id,
    hp: chassis?.hp ?? 60,
    attack: { name: "", damage: chassis?.damage ?? 20 },
    abilityId: chassis?.abilityId ?? "none",
  };
  return character;
}

/** Apply a chassis (Stamina, Everyday damage, and Shift effect are fixed). */
export function applyChassis(card: CharacterCard, chassisId: string, cfg: RulesConfig): CharacterCard {
  const chassis = cfg.presets.find((p) => p.id === chassisId);
  if (!chassis) return card;
  return {
    ...card,
    chassisId: chassis.id,
    rarity: "Common",
    hp: chassis.hp,
    attack: { ...card.attack, damage: chassis.damage },
    abilityId: chassis.abilityId,
    // A rename made for a different ability doesn't carry over.
    abilityFlavorName: card.abilityId === chassis.abilityId ? card.abilityFlavorName : undefined,
  };
}

/**
 * Per-class identity colours (spec §8: class identity lives in the art window /
 * accents, app chrome stays neutral). Tuned to read on both themes.
 */
export const CLASS_THEME: Record<
  CardClass,
  { name: string; ring: string; chip: string; glow: string }
> = {
  Shifter: {
    name: "Shifter",
    ring: "#e0533a",
    chip: "bg-[#e0533a]/15 text-[#c33b22] dark:text-[#ff8f78]",
    glow: "from-[#e0533a]/25",
  },
  Stray: {
    name: "Stray",
    ring: "#3aa563",
    chip: "bg-[#3aa563]/15 text-[#268049] dark:text-[#6fe09a]",
    glow: "from-[#3aa563]/25",
  },
  NPC: {
    name: "NPC",
    ring: "#4f7fe0",
    chip: "bg-[#4f7fe0]/15 text-[#3361c4] dark:text-[#8fb0ff]",
    glow: "from-[#4f7fe0]/25",
  },
};
