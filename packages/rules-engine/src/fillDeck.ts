// Intelligently complete a partial deck into a legal, ready-to-play one.
//
// Pure function: it only *adds* copies of cards already in the player's
// library, never removes their picks. Every add is gated by canAddCardToDeck,
// so the result respects every limit (deck size, type caps, Premium Plus cap,
// global copy-by-name cap, and each Support's own maxPerDeck). Selection favours
// variety — new card names first, then an even spread of Character chassis —
// with a light random tie-break so repeated fills aren't identical.

import type { Deck, AnyCard, RulesConfig } from "./types";
import { canAddCardToDeck } from "./validateDeck";

export interface FillDeckResult {
  /** The deck entries after filling (a fresh array; the input is never mutated). */
  entries: Deck["entries"];
  /** How many cards were added. */
  added: number;
}

function categoryCount(deck: Deck, cardsById: Map<string, AnyCard>, type: AnyCard["type"]): number {
  let n = 0;
  for (const e of deck.entries) {
    const c = cardsById.get(e.cardId);
    if (c && c.type === type) n += e.count;
  }
  return n;
}

/** Add one copy of a card id to a working deck's entries (mutates the array). */
function bump(entries: Deck["entries"], cardId: string): void {
  const i = entries.findIndex((e) => e.cardId === cardId);
  if (i >= 0) entries[i] = { ...entries[i]!, count: entries[i]!.count + 1 };
  else entries.push({ cardId, count: 1 });
}

/**
 * Choose the best legal card to add next from `pool`, preferring variety:
 * lowest existing copy-count of that name, then the least-represented Character
 * class, then a small random nudge. Returns undefined when nothing legal remains.
 */
function pickBest(
  pool: AnyCard[],
  working: Deck,
  cardsById: Map<string, AnyCard>,
  cfg: RulesConfig
): AnyCard | undefined {
  const nameCount = new Map<string, number>();
  const chassisCount = new Map<string, number>();
  for (const e of working.entries) {
    const c = cardsById.get(e.cardId);
    if (!c) continue;
    nameCount.set(c.name, (nameCount.get(c.name) ?? 0) + e.count);
    if (c.type === "Character") {
      const key = c.chassisId ?? c.name;
      chassisCount.set(key, (chassisCount.get(key) ?? 0) + e.count);
    }
  }

  let best: AnyCard | undefined;
  let bestScore = Infinity;
  for (const card of pool) {
    if (!canAddCardToDeck(working, card, cardsById, cfg).ok) continue;
    const dup = nameCount.get(card.name) ?? 0;
    const chassis = card.type === "Character" ? chassisCount.get(card.chassisId ?? card.name) ?? 0 : 0;
    const score = dup * 100 + chassis * 10 + Math.random();
    if (score < bestScore) {
      bestScore = score;
      best = card;
    }
  }
  return best;
}

/** Add cards from `pool` until the category reaches `target` or nothing fits. */
function addUpTo(
  working: Deck,
  pool: AnyCard[],
  type: AnyCard["type"],
  target: number,
  cardsById: Map<string, AnyCard>,
  cfg: RulesConfig
): void {
  while (categoryCount(working, cardsById, type) < target) {
    const pick = pickBest(pool, working, cardsById, cfg);
    if (!pick) break;
    bump(working.entries, pick.id);
  }
}

/**
 * Fill a partial deck toward a complete, legal one. Reaches each category's
 * minimum first (so a small library still yields the best legal deck possible),
 * then tops both up to their maximums within the overall deck-size cap.
 */
export function fillDeck(
  deck: Deck,
  cardsById: Map<string, AnyCard>,
  cfg: RulesConfig
): FillDeckResult {
  const working: Deck = { ...deck, entries: deck.entries.map((e) => ({ ...e })) };
  const before = working.entries.reduce((n, e) => n + e.count, 0);

  const pool = Array.from(cardsById.values());
  const characters = pool.filter((c) => c.type === "Character");
  const supports = pool.filter((c) => c.type === "Support");

  // Phase 1 — satisfy the minimums in each category.
  addUpTo(working, supports, "Support", cfg.deck.support.min, cardsById, cfg);
  addUpTo(working, characters, "Character", cfg.deck.character.min, cardsById, cfg);
  // Phase 2 — top up toward the maximums (canAddCardToDeck caps total at size.max).
  addUpTo(working, supports, "Support", cfg.deck.support.max, cardsById, cfg);
  addUpTo(working, characters, "Character", cfg.deck.character.max, cardsById, cfg);

  const after = working.entries.reduce((n, e) => n + e.count, 0);
  return { entries: working.entries, added: after - before };
}
