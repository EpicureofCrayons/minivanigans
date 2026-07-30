// Point-budget math — the basis of the "no overpowered cards" gate.

import type { CharacterCard, RulesConfig } from "./types";

/** HP cost = ceil(hp / pointsPer) × factor. E.g. 60 HP at pointsPer 10 = 6 points. */
export const hpCost = (hp: number, cfg: RulesConfig): number =>
  Math.ceil(hp / cfg.hp.pointsPer) * (cfg.hp.pointsFactor ?? 1);

/** Attack cost = ceil(damage / pointsPer) × factor. v4.1: damage costs double
 *  what HP does (pointsFactor 2) — damage is the scarce, game-ending resource. */
export const attackCost = (damage: number, cfg: RulesConfig): number =>
  Math.ceil(damage / cfg.damage.pointsPer) * (cfg.damage.pointsFactor ?? 1);

export function abilityCost(abilityId: string, cfg: RulesConfig): number {
  const a = cfg.abilities.find((x) => x.id === abilityId);
  if (!a) throw new Error(`Unknown ability ${abilityId}`);
  return a.cost;
}

/** Total points spent on a character card: HP + Attack + Ability. */
export function characterTotalCost(card: CharacterCard, cfg: RulesConfig): number {
  return (
    hpCost(card.hp, cfg) +
    attackCost(card.attack.damage, cfg) +
    abilityCost(card.abilityId, cfg)
  );
}
