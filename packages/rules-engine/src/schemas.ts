// Zod schemas mirroring the engine types. Used for runtime validation of loaded
// files (cards, decks, config) and as a second line of defence on form input.

import { z } from "zod";

export const cardClassSchema = z.enum(["Shifter", "Stray", "NPC"]);
export const raritySchema = z.enum(["Common", "PremiumPlus"]);

const baseCardFields = {
  id: z.string().min(1),
  name: z.string(),
  imagePath: z.string().optional(),
  imageTransform: z
    .object({ x: z.number(), y: z.number(), scale: z.number() })
    .optional(),
  sharedBy: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
};

export const characterCardSchema = z.object({
  ...baseCardFields,
  type: z.literal("Character"),
  cardClass: cardClassSchema,
  rarity: raritySchema,
  chassisId: z.string().optional(),
  hp: z.number(),
  attack: z.object({
    name: z.string(),
    damage: z.number(),
  }),
  abilityId: z.string(),
  abilityFlavorName: z.string().optional(),
  fullBleedArt: z.boolean().optional(),
});

export const supportCardSchema = z.object({
  ...baseCardFields,
  type: z.literal("Support"),
  effectId: z.string(),
  effectFlavorName: z.string().optional(),
});

export const anyCardSchema = z.discriminatedUnion("type", [
  characterCardSchema,
  supportCardSchema,
]);

export const deckEntrySchema = z.object({
  cardId: z.string().min(1),
  count: z.number().int().positive(),
});

export const deckSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  entries: z.array(deckEntrySchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const abilityDefSchema = z.object({
  id: z.string().min(1),
  displayName: z.string(),
  description: z.string(),
  cost: z.number(),
  commonOnly: z.boolean().optional(),
});

export const supportEffectDefSchema = z.object({
  id: z.string().min(1),
  displayName: z.string(),
  description: z.string(),
  maxPerDeck: z.number(),
});

export const chassisDefSchema = z.object({
  id: z.string().min(1),
  displayName: z.string(),
  rarity: raritySchema,
  hp: z.number(),
  damage: z.number(),
  abilityId: z.string(),
  everydayName: z.string().optional(),
  shiftName: z.string().optional(),
  shiftDamage: z.number().optional(),
  shiftEffect: z.string().optional(),
  identity: z.string(),
});

const minMaxSchema = z.object({ min: z.number(), max: z.number() });

export const rulesConfigSchema = z.object({
  version: z.number(),
  deck: z.object({
    size: minMaxSchema,
    character: minMaxSchema,
    support: minMaxSchema,
    maxCopiesByName: z.number(),
    maxPremiumPlus: z.number(),
    minivanMax: z.number(),
    startingHand: z.number(),
    secondPlayerBonusCards: z.number(),
    handLimit: z.number(),
    mulliganMax: z.number(),
  }),
  rules: z.object({
    winKnockouts: z.number(),
    koComebackDraw: z.number(),
    suddenDeath: z.boolean(),
    suddenDeathBasis: z.enum(["tokens", "scored"]).optional(),
    secondWindDeckoutLock: z.boolean().optional(),
    powerUpBonus: z.number(),
  }),
  budgets: z.object({ Common: z.number(), PremiumPlus: z.number() }),
  hp: z.object({ min: z.number(), max: z.number(), pointsPer: z.number(), pointsFactor: z.number().optional() }),
  damage: z.object({ min: z.number(), max: z.number(), pointsPer: z.number(), pointsFactor: z.number().optional() }),
  lanyard: z.object({ widthIn: z.number(), heightIn: z.number() }),
  classAdvantageBonus: z.number(),
  classBeats: z.object({
    Shifter: cardClassSchema,
    Stray: cardClassSchema,
    NPC: cardClassSchema,
  }),
  abilities: z.array(abilityDefSchema),
  supportEffects: z.array(supportEffectDefSchema),
  presets: z.array(chassisDefSchema),
  conduct: z.object({ bannedWords: z.array(z.string()) }),
});

// ---- Templates ----

const slotRectSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

const slotIdSchema = z.enum([
  "name",
  "art",
  "hp",
  "attackName",
  "attackDamage",
  "ability",
  "effect",
  "classMarker",
  "rarityMarker",
  "typeLabel",
]);

export const cardTemplateSchema = z.object({
  frame: z.enum(["ribbon", "borderless"]),
  accent: z.enum(["class", "fixed"]),
  accentColor: z.string(),
  cornerRadius: z.number(),
  slots: z.record(slotIdSchema, slotRectSchema),
});

export const templateSetSchema = z.object({
  version: z.number(),
  templates: z.object({
    "Character/Common": cardTemplateSchema,
    "Character/PremiumPlus": cardTemplateSchema,
    Support: cardTemplateSchema,
  }),
});

// ---- Profile ----

export const avatarSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("builtin"), id: z.string() }),
  z.object({ kind: z.literal("image"), ref: z.string() }),
]);

export const profileSchema = z.object({
  username: z.string(),
  avatar: avatarSchema,
  favoriteCardId: z.string().optional(),
});

// ---- Share file ----

export const shareLanyardSchema = z.object({
  username: z.string(),
  avatar: avatarSchema,
  favoriteCard: anyCardSchema.optional(),
});

export const shareFileSchema = z.object({
  format: z.literal("day-shifters-share"),
  shareVersion: z.number(),
  sharedAt: z.string(),
  lanyard: shareLanyardSchema.optional(),
  cards: z.array(anyCardSchema),
  decks: z.array(deckSchema).optional(),
});

// ---- Bundle ----

export const bundleSchema = z.object({
  format: z.literal("day-shifters-bundle"),
  bundleVersion: z.number(),
  createdAt: z.string().optional(),
  config: rulesConfigSchema,
  templates: templateSetSchema,
});
