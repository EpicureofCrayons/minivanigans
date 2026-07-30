// Lightweight v5 bot policy. It values lethal moves, timely Shifts, recovery
// through the Minivan, and useful Moments without trying to solve the game.

import type { Action, Difficulty, GameState, SupportPile } from "./types";
import {
  defaultDiscard,
  defaultTarget,
  defaultTargets,
  everydayDamage,
  legalActions,
  other,
  shiftDamage,
  S_BACKSEAT,
  S_ENCORE,
  S_GROUP,
  S_SNACK,
  S_VIBES,
} from "./engine";

export function chooseReaction(): boolean {
  return false;
}

export function chooseTarget(state: GameState, _difficulty: Difficulty = "normal"): number | null {
  return defaultTarget(state);
}

export function chooseTargets(state: GameState, _difficulty: Difficulty = "normal"): number[] {
  return defaultTargets(state);
}

export function chooseDiscard(state: GameState, _difficulty: Difficulty = "normal"): number[] {
  return defaultDiscard(state);
}

export function chooseAction(state: GameState, difficulty: Difficulty = "normal"): Action {
  const legal = legalActions(state);
  const me = state.players[state.turn];
  const opp = state.players[other(state.turn)];
  const active = me.active;
  const defender = opp.active;
  const find = <T extends Action["type"]>(type: T) => legal.find((a) => a.type === type);

  if (!state.flags.actionChoiceMade) {
    if (active && defender && active.shiftReady && !(state.ply === 1 && state.turn === state.firstPlayer)) {
      const dmg = shiftDamage(active, opp.kos, me.kos);
      if (dmg >= defender.hp || active.chassisId !== "cannon" || difficulty === "normal") {
        return find("pass") ?? legal[0]!;
      }
    }

    const moments = legal.filter((a): a is Extract<Action, { type: "playSupport" }> => a.type === "playSupport");
    const support = (id: string): Extract<Action, { type: "playSupport" }> | undefined =>
      moments.find((a) => (me.hand.find((c) => c.uid === a.uid) as SupportPile | undefined)?.effectId === id);
    if (active && active.hp <= active.maxHP - 2) {
      const heal = support(S_SNACK) ?? support(S_VIBES);
      if (heal) return heal;
    }
    if (active && !active.shiftReady) {
      const encore = support(S_ENCORE);
      if (encore) return encore;
      const fresh = me.minivan.find((c) => c.shiftReady);
      const swap = fresh && legal.find((a) => a.type === "voluntarySwitch" && a.uid === fresh.uid);
      if (swap) return swap;
    }
    if (me.hand.filter((c) => c.kind === "char").length === 0) {
      const group = support(S_GROUP);
      if (group) return group;
    }
    const backseat = support(S_BACKSEAT);
    if (backseat && active && active.hp <= 2 && me.minivan.length) return backseat;
    const bench = find("placeMinivan");
    if (bench && me.minivan.length < 2) return bench;
    return find("pass") ?? legal[0]!;
  }

  if (!state.flags.moved && active && defender) {
    const everyday = find("attack");
    const shifts = legal.filter((a) => a.type === "shift");
    if (shifts.length) {
      if (active.chassisId === "wildcard") {
        if (defender.hp <= 2) return shifts.find((a) => a.type === "shift" && a.choice === "damage") ?? shifts[0]!;
        if (active.hp < active.maxHP) return shifts.find((a) => a.type === "shift" && a.choice === "heal") ?? shifts[0]!;
        return shifts.find((a) => a.type === "shift" && a.choice === "switch") ?? shifts[0]!;
      }
      if (shiftDamage(active, opp.kos, me.kos) >= defender.hp || state.flags.passed) return shifts[0]!;
    }
    if (everyday && everydayDamage(active, state.flags) >= defender.hp) return everyday;
    return everyday ?? find("endTurn") ?? legal[0]!;
  }

  return find("endTurn") ?? legal[0]!;
}
