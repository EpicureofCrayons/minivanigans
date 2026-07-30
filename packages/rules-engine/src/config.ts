// Minivanigans! Rules v5.0 — one shared source of truth for both apps and the
// deterministic match engine. A few legacy config keys remain in the schema so
// older local libraries can be opened and migrated without losing cards.

import type { ChassisDef, RulesConfig } from "./types";

export const CONFIG_VERSION = 5;

const chassis = (
  id: string,
  displayName: string,
  hp: number,
  damage: number,
  everydayName: string,
  shiftName: string,
  shiftDamage: number,
  shiftEffect: string,
  identity: string
): ChassisDef => ({
  id,
  displayName,
  rarity: "Common",
  hp,
  damage,
  abilityId: id,
  everydayName,
  shiftName,
  shiftDamage,
  shiftEffect,
  identity,
});

export const defaultConfig: RulesConfig = {
  version: CONFIG_VERSION,
  deck: {
    size: { min: 18, max: 18 },
    character: { min: 12, max: 12 },
    support: { min: 6, max: 6 },
    maxCopiesByName: 3,
    maxPremiumPlus: 12,
    minivanMax: 3,
    startingHand: 5,
    secondPlayerBonusCards: 1,
    handLimit: 7,
    mulliganMax: 2,
  },
  rules: {
    winKnockouts: 3,
    koComebackDraw: 0,
    suddenDeath: false,
    suddenDeathBasis: "scored",
    secondWindDeckoutLock: false,
    powerUpBonus: 0,
  },
  // Retained only for compatibility with older config files and app builds.
  budgets: { Common: 0, PremiumPlus: 0 },
  hp: { min: 4, max: 7, pointsPer: 1 },
  damage: { min: 2, max: 3, pointsPer: 1 },
  lanyard: { widthIn: 4, heightIn: 6 },
  classAdvantageBonus: 0,
  classBeats: { Shifter: "Stray", Stray: "NPC", NPC: "Shifter" },
  abilities: [
    { id: "anchor", displayName: "Not Today", description: "3 damage. Shield 1.", cost: 0 },
    { id: "cannon", displayName: "Big Finish", description: "4 damage.", cost: 0 },
    { id: "pivot", displayName: "Keep Moving", description: "2 damage. You may switch afterward.", cost: 0 },
    { id: "sustainer", displayName: "Second Snack", description: "2 damage, then heal 2 from this Character.", cost: 0 },
    { id: "trickster", displayName: "Throw Off the Plan", description: "2 damage, then spend the opposing Active.", cost: 0 },
    { id: "captain", displayName: "Rally the Van", description: "3 damage, then ready one Character in your Minivan.", cost: 0 },
    {
      id: "wildcard",
      displayName: "Anything Could Happen",
      description: "Choose: 3 damage; or 2 damage and heal 1; or 2 damage and you may switch.",
      cost: 0,
    },
    { id: "underdog", displayName: "Against the Odds", description: "3 damage, or 4 if your opponent has more KO Stars.", cost: 0 },
  ],
  supportEffects: [
    { id: "snack-break", displayName: "Snack Break", description: "Heal 2 from your Active.", maxPerDeck: 2 },
    {
      id: "running-late",
      displayName: "Running Late",
      description: "Switch. Your new Active's Everyday Move deals +1 damage this turn.",
      maxPerDeck: 2,
    },
    {
      id: "carpool",
      displayName: "Carpool",
      description: "Put one Character from your hand into an open Minivan space. You may switch to that Character.",
      maxPerDeck: 2,
    },
    {
      id: "detour",
      displayName: "Detour",
      description: "Your opponent switches their Active with a Minivan Character of their choice, if able.",
      maxPerDeck: 1,
    },
    {
      id: "encore",
      displayName: "Encore",
      description: "Ready your Active. It may use its Shift Move this turn even though Encore used your Action.",
      maxPerDeck: 1,
    },
    {
      id: "group-chat",
      displayName: "Group Chat",
      description: "Search your deck for one Character, reveal it, put it into your hand, then shuffle.",
      maxPerDeck: 2,
    },
    {
      id: "backseat-driver",
      displayName: "Backseat Driver",
      description: "After your Everyday Move this turn, you may switch.",
      maxPerDeck: 2,
    },
    {
      id: "good-vibes",
      displayName: "Good Vibes",
      description: "Heal 1 from up to two different Characters you control.",
      maxPerDeck: 2,
    },
  ],
  presets: [
    chassis("anchor", "The Anchor", 7, 2, "Steady Hit", "Not Today", 3, "Shield 1.", "Durable defender"),
    chassis("cannon", "The Cannon", 4, 3, "Big Hit", "Big Finish", 4, "", "Fragile attacker"),
    chassis("pivot", "The Pivot", 5, 2, "Quick Hit", "Keep Moving", 2, "You may switch afterward.", "Flexible rotation"),
    chassis("sustainer", "The Sustainer", 6, 2, "Keep Going", "Second Snack", 2, "Heal 2 from this Character.", "Healing"),
    chassis("trickster", "The Trickster", 5, 2, "Pester", "Throw Off the Plan", 2, "Spend the opposing Active.", "Disruption"),
    chassis("captain", "The Captain", 6, 2, "Lead the Way", "Rally the Van", 3, "Ready one Character in your Minivan.", "Team support"),
    chassis("wildcard", "The Wildcard", 5, 2, "Surprise Hit", "Anything Could Happen", 2, "Choose one Wildcard effect.", "Adaptability"),
    chassis("underdog", "The Underdog", 5, 2, "Try Again", "Against the Odds", 3, "4 damage if your opponent has more KO Stars.", "Comeback attacker"),
  ],
  conduct: { bannedWords: [] },
};

export function chassisById(cfg: RulesConfig, id: string | undefined) {
  if (!id) return undefined;
  return cfg.presets.find((p) => p.id === id);
}

export function firstGameConfig(cfg: RulesConfig): RulesConfig {
  return { ...cfg, rules: { ...cfg.rules, winKnockouts: 2 } };
}
