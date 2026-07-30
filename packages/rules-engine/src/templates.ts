// Card frame templates consumed by the app. The rules engine owns the data
// (types + defaults); the React renderer that draws these slots lives in the app.

import type { CardType, Rarity } from "./types";

export const TEMPLATE_VERSION = 2;

/** A positioned slot rectangle, expressed as percentages (0–100) of the card. */
export interface SlotRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Every slot the renderer knows how to draw. Which apply depends on card type. */
export type SlotId =
  | "name"
  | "art"
  | "hp"
  | "attackName"
  | "attackDamage"
  | "ability"
  | "effect"
  | "classMarker"
  | "rarityMarker"
  | "typeLabel";

export const SLOT_LABELS: Record<SlotId, string> = {
  name: "Name",
  art: "Art window",
  hp: "HP",
  attackName: "Attack name",
  attackDamage: "Attack damage",
  ability: "Ability text",
  effect: "Effect text",
  classMarker: "Class marker",
  rarityMarker: "Rarity marker",
  typeLabel: "Type label",
};

export type FrameStyle = "ribbon" | "borderless";

export interface CardTemplate {
  /** Visual frame treatment. Common ships as "ribbon", Premium+ as "borderless". */
  frame: FrameStyle;
  /** Where the accent colour comes from: the card's class, or a fixed colour. */
  accent: "class" | "fixed";
  accentColor: string; // used when accent === "fixed"
  /** Outer corner radius, px at the 320×448 design size. */
  cornerRadius: number;
  slots: Partial<Record<SlotId, SlotRect>>;
}

/**
 * Templates are keyed by Character rarity (Common = ribbon, Premium Plus = borderless),
 * plus a single Support template (Supports have no rarity in v3).
 */
export type TemplateKey =
  | "Character/Common"
  | "Character/PremiumPlus"
  | "Support";

export interface TemplateSet {
  version: number;
  templates: Record<TemplateKey, CardTemplate>;
}

export function templateKey(type: CardType, rarity?: Rarity): TemplateKey {
  if (type === "Support") return "Support";
  return `Character/${rarity ?? "Common"}` as TemplateKey;
}

/** The slots that apply to a given card type (drives the designer + renderer). */
export function slotsForType(type: CardType): SlotId[] {
  if (type === "Character")
    return ["name", "hp", "art", "attackName", "attackDamage", "ability", "classMarker", "rarityMarker"];
  return ["name", "art", "effect", "typeLabel"]; // Support
}

const characterSlots: Partial<Record<SlotId, SlotRect>> = {
  name: { x: 4, y: 3, w: 62, h: 9 },
  hp: { x: 68, y: 3, w: 28, h: 8 },
  art: { x: 4, y: 14, w: 92, h: 40 },
  attackName: { x: 4, y: 56, w: 70, h: 6 },
  attackDamage: { x: 80, y: 55, w: 16, h: 8 },
  ability: { x: 4, y: 64, w: 92, h: 22 },
  classMarker: { x: 4, y: 89, w: 32, h: 7 },
  rarityMarker: { x: 68, y: 89, w: 28, h: 7 },
};

const supportSlots: Partial<Record<SlotId, SlotRect>> = {
  name: { x: 4, y: 3, w: 92, h: 9 },
  art: { x: 4, y: 14, w: 92, h: 34 },
  effect: { x: 4, y: 50, w: 92, h: 36 },
  typeLabel: { x: 4, y: 90, w: 92, h: 7 },
};

/** The starting templates: Common = Ribbon, Premium Plus = Borderless, class-themed. */
export const defaultTemplates: TemplateSet = {
  version: TEMPLATE_VERSION,
  templates: {
    "Character/Common": { frame: "ribbon", accent: "class", accentColor: "#0f766e", cornerRadius: 22, slots: structuredCloneSlots(characterSlots) },
    "Character/PremiumPlus": { frame: "borderless", accent: "class", accentColor: "#0f766e", cornerRadius: 22, slots: structuredCloneSlots(characterSlots) },
    "Support": { frame: "ribbon", accent: "fixed", accentColor: "#0f766e", cornerRadius: 22, slots: structuredCloneSlots(supportSlots) },
  },
};

function structuredCloneSlots(s: Partial<Record<SlotId, SlotRect>>): Partial<Record<SlotId, SlotRect>> {
  return JSON.parse(JSON.stringify(s));
}
