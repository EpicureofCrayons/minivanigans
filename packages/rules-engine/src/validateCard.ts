// Single-card legality. Pure function the Player App calls live as the user edits.

import type { AnyCard, CharacterCard, SupportCard, RulesConfig } from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  // Legacy field retained for callers compiled against older releases.
  budget?: { used: number; max: number };
}

function nameErrors(card: AnyCard, cfg: RulesConfig): string[] {
  const errors: string[] = [];
  if (!card.name?.trim()) errors.push("Card needs a name.");
  // Optional local conduct check
  const lower = (card.name ?? "").toLowerCase();
  if (cfg.conduct.bannedWords.some((w) => w && lower.includes(w.toLowerCase()))) {
    errors.push("Name contains a word blocked by the Code of Conduct.");
  }
  return errors;
}

export function validateCard(card: AnyCard, cfg: RulesConfig): ValidationResult {
  const errors: string[] = nameErrors(card, cfg);

  if (card.type === "Character") {
    const c = card as CharacterCard;
    // v5: every Character is built on one of eight fixed chassis.
    if (cfg.presets.length > 0) {
      const chassis = cfg.presets.find((p) => p.id === c.chassisId);
      if (!chassis) {
        errors.push("Pick one of the eight Character chassis.");
      } else {
        if (c.hp !== chassis.hp || c.attack.damage !== chassis.damage) {
          errors.push(`Stats must match ${chassis.displayName} (${chassis.hp} Stamina / ${chassis.damage} Everyday damage).`);
        }
        if (c.abilityId !== chassis.abilityId) {
          errors.push(`Shift Move is fixed by the chassis (${chassis.displayName}).`);
        }
      }
    }

    // Stamina bounds
    if (c.hp < cfg.hp.min || c.hp > cfg.hp.max) {
      errors.push(`Stamina must be ${cfg.hp.min}–${cfg.hp.max}.`);
    }

    // Damage bounds
    if (c.attack.damage < cfg.damage.min || c.attack.damage > cfg.damage.max) {
      errors.push(`Damage must be ${cfg.damage.min}–${cfg.damage.max}.`);
    }

    if (!c.attack.name?.trim()) errors.push("Everyday Move needs a custom name.");
    if (!cfg.abilities.some((a) => a.id === c.abilityId)) errors.push("Unknown Shift Move.");
    return { ok: errors.length === 0, errors };
  }

  if (card.type === "Support") {
    const s = card as SupportCard;
    const effect = cfg.supportEffects.find((e) => e.id === s.effectId);
    if (!effect) errors.push("Unknown Moment effect.");
    return { ok: errors.length === 0, errors };
  }

  return { ok: false, errors: ["Unknown card type."] };
}
