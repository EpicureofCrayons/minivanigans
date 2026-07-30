// Deck legality. Pure function driving the Deck Builder's live legality panel.

import type { Deck, AnyCard, RulesConfig } from "./types";

export interface DeckValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  counts: {
    total: number;
    character: number;
    support: number;
    premiumPlus: number;
  };
}

/** Result of checking whether one more copy of a card may be added to a deck. */
export interface AddCheckResult {
  ok: boolean;
  /** Human-readable reasons it can't be added (empty when ok). */
  reasons: string[];
}

/**
 * Can one more copy of `card` be added to `deck` without breaking a rule?
 * Only checks the *maximum* limits adding could violate (deck full, type caps,
 * copy limits, Premium Plus cap) — minimums don't block adding.
 */
/** v4.1: Character copy caps count by chassis (names/classes may differ);
 *  cards without a chassis (pre-v4) fall back to counting by name. */
const copyKey = (c: AnyCard): string =>
  c.type === "Character" ? `chassis:${c.chassisId ?? `name:${c.name}`}` : `name:${c.name}`;

export function canAddCardToDeck(
  deck: Deck,
  card: AnyCard,
  cardsById: Map<string, AnyCard>,
  cfg: RulesConfig
): AddCheckResult {
  let total = 0,
    character = 0,
    support = 0,
    premiumPlus = 0,
    sameCopy = 0,
    sameSupport = 0;

  for (const entry of deck.entries) {
    const c = cardsById.get(entry.cardId);
    if (!c) continue;
    total += entry.count;
    if (copyKey(c) === copyKey(card)) sameCopy += entry.count;
    if (c.type === "Character") {
      character += entry.count;
      if (c.rarity === "PremiumPlus") premiumPlus += entry.count;
    }
    if (c.type === "Support") {
      support += entry.count;
      if (card.type === "Support" && c.effectId === card.effectId) sameSupport += entry.count;
    }
  }

  const reasons: string[] = [];

  if (total + 1 > cfg.deck.size.max)
    reasons.push(`This deck is full — a deck holds at most ${cfg.deck.size.max} cards.`);

  if (sameCopy + 1 > cfg.deck.maxCopiesByName) {
    const what =
      card.type === "Character" && card.chassisId
        ? cfg.presets.find((p) => p.id === card.chassisId)?.displayName ?? card.name
        : card.name;
    reasons.push(`You already have the max ${cfg.deck.maxCopiesByName} copies of "${what || "this card"}".`);
  }

  if (card.type === "Character") {
    if (character + 1 > cfg.deck.character.max)
      reasons.push(`A deck allows at most ${cfg.deck.character.max} Character cards.`);
    // v5 has no mechanical rarity cap.
  }

  if (card.type === "Support") {
    if (support + 1 > cfg.deck.support.max)
      reasons.push(`A deck allows at most ${cfg.deck.support.max} Moment cards.`);
    const def = cfg.supportEffects.find((e) => e.id === card.effectId);
    if (def && sameSupport + 1 > def.maxPerDeck)
      reasons.push(`"${def.displayName}" is limited to ${def.maxPerDeck} per deck.`);
  }

  return { ok: reasons.length === 0, reasons };
}

export function validateDeck(
  deck: Deck,
  cardsById: Map<string, AnyCard>,
  cfg: RulesConfig
): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let total = 0,
    character = 0,
    support = 0,
    premiumPlus = 0;
  const countByCopy = new Map<string, { label: string; n: number }>();
  const countBySupportEffect = new Map<string, number>();

  for (const entry of deck.entries) {
    const card = cardsById.get(entry.cardId);
    if (!card) {
      errors.push(`Deck references a missing card (${entry.cardId}).`);
      continue;
    }
    total += entry.count;

    const key = copyKey(card);
    const label =
      card.type === "Character" && card.chassisId
        ? cfg.presets.find((p) => p.id === card.chassisId)?.displayName ?? card.name
        : card.name;
    const prev = countByCopy.get(key);
    countByCopy.set(key, { label, n: (prev?.n ?? 0) + entry.count });

    if (card.type === "Character") {
      character += entry.count;
      if (card.rarity === "PremiumPlus") premiumPlus += entry.count;
    }
    if (card.type === "Support") {
      support += entry.count;
      const e = countBySupportEffect.get(card.effectId) ?? 0;
      countBySupportEffect.set(card.effectId, e + entry.count);
    }
  }

  // Copy limit (per chassis for Characters, per name otherwise)
  for (const { label, n } of countByCopy.values()) {
    if (n > cfg.deck.maxCopiesByName) {
      errors.push(`Too many copies of "${label}" (${n}/${cfg.deck.maxCopiesByName}).`);
    }
  }

  // Per-support copy cap (printed on the card)
  for (const [effectId, n] of countBySupportEffect) {
    const def = cfg.supportEffects.find((e) => e.id === effectId);
    if (def && n > def.maxPerDeck) {
      errors.push(`Too many "${def.displayName}" Moments (${n}/${def.maxPerDeck}).`);
    }
  }

  const rangeText = (r: { min: number; max: number }) =>
    r.min === r.max ? `exactly ${r.min}` : `${r.min}–${r.max}`;

  if (total < cfg.deck.size.min || total > cfg.deck.size.max)
    errors.push(`Deck must be ${rangeText(cfg.deck.size)} cards (currently ${total}).`);
  if (character < cfg.deck.character.min || character > cfg.deck.character.max)
    errors.push(`Characters must be ${rangeText(cfg.deck.character)} (currently ${character}).`);
  if (support < cfg.deck.support.min || support > cfg.deck.support.max) {
    errors.push(`Moments must be ${rangeText(cfg.deck.support)} (currently ${support}).`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: { total, character, support, premiumPlus },
  };
}
