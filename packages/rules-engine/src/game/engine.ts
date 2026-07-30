// Minivanigans! Rules v5 match engine. applyAction is pure: it clones the
// supplied state, applies one legal decision, and returns the next state.

import type { AnyCard, Deck, RulesConfig } from "../types";
import { defaultConfig, firstGameConfig } from "../config";
import type {
  Action,
  CardInPlay,
  CharPile,
  GameEvent,
  GameState,
  Pending,
  PileCard,
  PlayerId,
  PlayerState,
  SupportPile,
  TurnFlags,
  WildcardChoice,
} from "./types";

export const S_SNACK = "snack-break";
export const S_RUNNING = "running-late";
export const S_CARPOOL = "carpool";
export const S_DETOUR = "detour";
export const S_ENCORE = "encore";
export const S_GROUP = "group-chat";
export const S_BACKSEAT = "backseat-driver";
export const S_VIBES = "good-vibes";

export const T_NEWACTIVE = "new-active";
export const T_RUNNING_SWITCH = "running-late-switch";
export const T_CARPOOL_CHARACTER = "carpool-character";
export const T_CARPOOL_SWITCH = "carpool-switch";
export const T_DETOUR_SWITCH = "detour-switch";
export const T_GROUP_CHARACTER = "group-chat-character";
export const T_AFTER_SWITCH = "after-move-switch";
export const T_CAPTAIN_READY = "captain-ready";
export const T_GOOD_VIBES = "good-vibes-targets";

declare function structuredClone<T>(value: T): T;

export interface Rng {
  value(): number;
  shuffle<T>(arr: T[]): T[];
  state(): number;
}

export function makeRng(seed: number): Rng {
  let a = seed | 0;
  const value = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const shuffle = <T>(arr: T[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(value() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
  };
  return { value, shuffle, state: () => a };
}

export const other = (id: PlayerId): PlayerId => (id === "p0" ? "p1" : "p0");
const isChar = (c: PileCard): c is CharPile => c.kind === "char";

function removeByUid<T extends { uid: number }>(arr: T[], uid: number): T | undefined {
  const i = arr.findIndex((x) => x.uid === uid);
  return i < 0 ? undefined : arr.splice(i, 1)[0];
}

function instantiate(c: CharPile): CardInPlay {
  return {
    uid: c.uid,
    cardId: c.cardId,
    name: c.name,
    chassisId: c.chassisId,
    maxHP: c.maxHP,
    hp: c.maxHP,
    dmg: c.dmg,
    everydayName: c.everydayName,
    shiftName: c.shiftName,
    shiftReady: true,
    shield: 0,
  };
}

function toPile(c: CardInPlay): CharPile {
  return {
    kind: "char",
    uid: c.uid,
    cardId: c.cardId,
    name: c.name,
    chassisId: c.chassisId,
    maxHP: c.maxHP,
    dmg: c.dmg,
    everydayName: c.everydayName,
    shiftName: c.shiftName,
  };
}

function emit(s: GameState, event: GameEvent) {
  s.log.push(event);
}

function draw(s: GameState, p: PlayerState, count: number) {
  let drawn = 0;
  while (drawn < count) {
    const card = p.deck.pop();
    if (!card) break;
    p.hand.push(card);
    drawn++;
  }
  if (drawn) emit(s, { t: "draw", player: p.id, count: drawn });
}

function heal(s: GameState, p: PlayerState, card: CardInPlay, amount: number) {
  const before = card.hp;
  card.hp = Math.min(card.maxHP, card.hp + amount);
  emit(s, { t: "heal", player: p.id, uid: card.uid, amount: card.hp - before });
}

function switchWithMinivan(
  s: GameState,
  p: PlayerState,
  uid: number,
  kind: Extract<GameEvent, { t: "switch" }>["kind"]
): boolean {
  const pick = removeByUid(p.minivan, uid);
  if (!pick || !p.active) return false;
  p.minivan.push(p.active);
  p.active = pick;
  emit(s, { t: "switch", player: p.id, kind, uid });
  return true;
}

function queuePending(s: GameState, p: Pending) {
  if (!s.pending) s.pending = p;
  else s.pendingQueue.push(p);
}

function advancePending(s: GameState) {
  s.pending = s.pendingQueue.shift() ?? null;
}

const freshFlags = (): TurnFlags => ({
  actionUsed: false,
  passed: false,
  actionChoiceMade: false,
  moved: false,
  encore: false,
  runningLateUid: null,
  backseatSwitch: false,
});

export function totalChars(p: PlayerState): number {
  return (p.active ? 1 : 0) + p.minivan.length + p.hand.filter(isChar).length + p.deck.filter(isChar).length;
}

export function everydayDamage(attacker: CardInPlay, flags?: TurnFlags): number {
  return attacker.dmg + (flags?.runningLateUid === attacker.uid ? 1 : 0);
}

export function shiftDamage(attacker: CardInPlay, opponentKos = 0, ownKos = 0, choice: WildcardChoice = "damage"): number {
  switch (attacker.chassisId) {
    case "anchor": return 3;
    case "cannon": return 4;
    case "pivot":
    case "sustainer":
    case "trickster":
      return 2;
    case "captain": return 3;
    case "wildcard": return choice === "damage" ? 3 : 2;
    case "underdog": return opponentKos > ownKos ? 4 : 3;
    default: return 2;
  }
}

/** Compatibility helpers retained for older UI integrations. Classes have no
 * rules effect in v5, so advantage is always false and a swing is Everyday. */
export function hasAdvantage(): boolean {
  return false;
}
export function swingDamage(att: CardInPlay): number {
  return att.dmg;
}
export function secondWindLocked(): boolean {
  return false;
}

export function bestMinivanVs(p: PlayerState): CardInPlay | null {
  return p.minivan.reduce<CardInPlay | null>((best, c) => (!best || c.hp > best.hp ? c : best), null);
}

export function bestHandChar(p: PlayerState): CharPile | null {
  return p.hand.reduce<CharPile | null>((best, c) => {
    if (!isChar(c)) return best;
    return !best || c.maxHP + c.dmg > best.maxHP + best.dmg ? c : best;
  }, null);
}

function digActiveFromDeck(s: GameState, p: PlayerState) {
  const passed: PileCard[] = [];
  while (p.deck.length) {
    const c = p.deck.pop()!;
    if (isChar(c)) {
      p.active = instantiate(c);
      emit(s, { t: "deploy", player: p.id, uid: c.uid, to: "active" });
      break;
    }
    passed.push(c);
  }
  p.deck.unshift(...passed);
}

function ensureActive(s: GameState, p: PlayerState) {
  if (p.active) return;
  const reserve = bestMinivanVs(p);
  if (reserve) {
    removeByUid(p.minivan, reserve.uid);
    p.active = reserve;
    emit(s, { t: "deploy", player: p.id, uid: reserve.uid, to: "active" });
    return;
  }
  const hand = bestHandChar(p);
  if (hand) {
    removeByUid(p.hand, hand.uid);
    p.active = instantiate(hand);
    emit(s, { t: "deploy", player: p.id, uid: hand.uid, to: "active" });
    return;
  }
  digActiveFromDeck(s, p);
}

function requestReplacement(s: GameState, p: PlayerState) {
  const options = p.minivan.length ? p.minivan.map((c) => c.uid) : p.hand.filter(isChar).map((c) => c.uid);
  if (options.length > 1) {
    queuePending(s, { kind: "target", player: p.id, effectId: T_NEWACTIVE, options, optional: false });
  } else {
    ensureActive(s, p);
  }
}

function checkKnockout(s: GameState, attacker: PlayerState, defender: PlayerState): number | null {
  if (!defender.active || defender.active.hp > 0) return null;
  const victim = defender.active;
  defender.discard.push(toPile(victim));
  defender.active = null;
  attacker.kos++;
  attacker.kosScored++;
  emit(s, { t: "ko", player: attacker.id, victimUid: victim.uid });

  if (attacker.kos >= s.cfg.rules.winKnockouts) {
    s.winner = attacker.id;
    s.reason = "knockouts";
    emit(s, { t: "win", player: attacker.id, reason: "knockouts" });
    return victim.uid;
  }
  if (totalChars(defender) === 0) {
    s.winner = attacker.id;
    s.reason = "no-characters";
    emit(s, { t: "win", player: attacker.id, reason: "no-characters" });
    return victim.uid;
  }
  requestReplacement(s, defender);
  return victim.uid;
}

function dealDamage(s: GameState, attacker: PlayerState, defender: PlayerState, amount: number, move: "everyday" | "shift") {
  if (!attacker.active || !defender.active) return;
  const attackingUid = attacker.active.uid;
  let dealt = amount;
  if (defender.active.shield > 0) {
    dealt = Math.max(0, dealt - defender.active.shield);
    defender.active.shield = 0;
  }
  defender.active.hp -= dealt;
  emit(s, { t: "move", player: attacker.id, attackerUid: attackingUid, move, dealt });
  checkKnockout(s, attacker, defender);
}

function beginTurn(s: GameState) {
  const me = s.players[s.turn];
  const opp = s.players[other(s.turn)];
  s.flags = freshFlags();
  s.ply++;

  for (const c of [me.active, ...me.minivan]) {
    if (c) c.shield = 0;
  }
  for (const c of me.minivan) {
    if (!c.shiftReady) {
      c.shiftReady = true;
      emit(s, { t: "ready", player: me.id, uid: c.uid });
    }
  }
  emit(s, { t: "turn", player: me.id, ply: s.ply });
  if (!s.firstGame) draw(s, me, 1);
  ensureActive(s, me);
  if (!me.active && totalChars(me) === 0) {
    s.winner = opp.id;
    s.reason = "no-characters";
    emit(s, { t: "win", player: opp.id, reason: "no-characters" });
  }
}

function legalMoment(s: GameState, me: PlayerState, opp: PlayerState, card: SupportPile): boolean {
  switch (card.effectId) {
    case S_RUNNING: return !!me.active && me.minivan.length > 0;
    case S_CARPOOL: return me.minivan.length < s.cfg.deck.minivanMax && me.hand.some(isChar);
    case S_DETOUR: return !!opp.active && opp.minivan.length > 0;
    case S_ENCORE: return !!me.active;
    default: return true;
  }
}

export function legalActions(s: GameState): Action[] {
  if (s.winner || s.pending || s.phase === "setup") return [];
  const me = s.players[s.turn];
  const opp = s.players[other(s.turn)];
  const a: Action[] = [];

  if (!s.flags.actionChoiceMade) {
    if (!s.firstGame) {
      if (me.minivan.length < s.cfg.deck.minivanMax) {
        for (const c of me.hand) if (isChar(c)) a.push({ type: "placeMinivan", uid: c.uid });
      }
      if (me.active && me.minivan.length) {
        for (const c of me.minivan) a.push({ type: "voluntarySwitch", uid: c.uid });
      }
      for (const c of me.hand) {
        if (c.kind === "support" && legalMoment(s, me, opp, c)) a.push({ type: "playSupport", uid: c.uid });
      }
    } else if (me.active && me.minivan.length) {
      for (const c of me.minivan) a.push({ type: "voluntarySwitch", uid: c.uid });
    }
    a.push({ type: "pass" });
    return a;
  }

  if (!s.flags.moved && me.active && opp.active) {
    a.push({ type: "attack" });
    const openingLock = s.ply === 1 && s.turn === s.firstPlayer;
    if (
      me.active.shiftReady &&
      !openingLock &&
      (s.flags.passed || s.flags.encore)
    ) {
      if (me.active.chassisId === "wildcard") {
        a.push({ type: "shift", choice: "damage" }, { type: "shift", choice: "heal" }, { type: "shift", choice: "switch" });
      } else {
        a.push({ type: "shift" });
      }
    }
  }
  a.push({ type: "endTurn" });
  return a;
}

function playMoment(s: GameState, me: PlayerState, opp: PlayerState, card: SupportPile, rng: Rng) {
  if (!legalMoment(s, me, opp, card)) return;
  removeByUid(me.hand, card.uid);
  me.discard.push(card);
  s.flags.actionUsed = true;
  s.flags.actionChoiceMade = true;
  emit(s, { t: "support", player: me.id, effectId: card.effectId });

  switch (card.effectId) {
    case S_SNACK:
      if (me.active) heal(s, me, me.active, 2);
      break;
    case S_RUNNING:
      queuePending(s, { kind: "target", player: me.id, effectId: T_RUNNING_SWITCH, options: me.minivan.map((c) => c.uid), optional: false });
      break;
    case S_CARPOOL:
      queuePending(s, {
        kind: "target",
        player: me.id,
        effectId: T_CARPOOL_CHARACTER,
        options: me.hand.filter(isChar).map((c) => c.uid),
        optional: false,
      });
      break;
    case S_DETOUR:
      queuePending(s, { kind: "target", player: opp.id, effectId: T_DETOUR_SWITCH, options: opp.minivan.map((c) => c.uid), optional: false });
      break;
    case S_ENCORE:
      if (me.active) {
        me.active.shiftReady = true;
        s.flags.encore = true;
        emit(s, { t: "ready", player: me.id, uid: me.active.uid });
      }
      break;
    case S_GROUP: {
      const options = me.deck.filter(isChar).map((c) => c.uid);
      if (options.length) {
        queuePending(s, {
          kind: "target",
          player: me.id,
          effectId: T_GROUP_CHARACTER,
          options,
          optional: false,
        });
      } else {
        rng.shuffle(me.deck);
      }
      break;
    }
    case S_BACKSEAT:
      s.flags.backseatSwitch = true;
      break;
    case S_VIBES: {
      const options = [me.active, ...me.minivan].filter((c): c is CardInPlay => !!c && c.hp < c.maxHP).map((c) => c.uid);
      if (options.length) {
        queuePending(s, { kind: "multi-target", player: me.id, effectId: T_GOOD_VIBES, options, min: 0, max: Math.min(2, options.length) });
      }
      break;
    }
  }
  s.rngA = rng.state();
}

function resolveTarget(s: GameState, uid: number | null, rng: Rng) {
  const pending = s.pending;
  if (!pending || pending.kind !== "target") return;
  const me = s.players[pending.player];
  switch (pending.effectId) {
    case T_NEWACTIVE: {
      const reserve = uid == null ? undefined : removeByUid(me.minivan, uid);
      if (reserve) {
        me.active = reserve;
        emit(s, { t: "deploy", player: me.id, uid: reserve.uid, to: "active" });
      } else {
        const hand = uid == null ? undefined : me.hand.find((c): c is CharPile => isChar(c) && c.uid === uid);
        if (hand) {
          removeByUid(me.hand, hand.uid);
          me.active = instantiate(hand);
          emit(s, { t: "deploy", player: me.id, uid: hand.uid, to: "active" });
        } else ensureActive(s, me);
      }
      break;
    }
    case T_RUNNING_SWITCH:
      if (uid != null && switchWithMinivan(s, me, uid, "moment") && me.active) s.flags.runningLateUid = me.active.uid;
      break;
    case T_CARPOOL_CHARACTER: {
      const c = uid == null ? undefined : me.hand.find((x): x is CharPile => isChar(x) && x.uid === uid);
      if (c && me.minivan.length < s.cfg.deck.minivanMax) {
        removeByUid(me.hand, c.uid);
        const deployed = instantiate(c);
        me.minivan.push(deployed);
        emit(s, { t: "deploy", player: me.id, uid: c.uid, to: "minivan" });
        queuePending(s, { kind: "target", player: me.id, effectId: T_CARPOOL_SWITCH, options: [c.uid], optional: true });
      }
      break;
    }
    case T_CARPOOL_SWITCH:
      if (uid != null) switchWithMinivan(s, me, uid, "moment");
      break;
    case T_DETOUR_SWITCH:
      if (uid != null) switchWithMinivan(s, me, uid, "moment");
      break;
    case T_GROUP_CHARACTER: {
      const c = uid == null ? undefined : me.deck.find((x): x is CharPile => isChar(x) && x.uid === uid);
      if (c) {
        removeByUid(me.deck, c.uid);
        me.hand.push(c);
      }
      rng.shuffle(me.deck);
      break;
    }
    case T_AFTER_SWITCH:
      if (uid != null) switchWithMinivan(s, me, uid, "shift");
      break;
    case T_CAPTAIN_READY: {
      const c = uid == null ? undefined : me.minivan.find((x) => x.uid === uid);
      if (c) {
        c.shiftReady = true;
        emit(s, { t: "ready", player: me.id, uid: c.uid });
      }
      break;
    }
  }
  advancePending(s);
}

function resolveMultiTarget(s: GameState, uids: number[]) {
  const pending = s.pending;
  if (!pending || pending.kind !== "multi-target") return;
  const me = s.players[pending.player];
  const legal = [...new Set(uids)].filter((uid) => pending.options.includes(uid)).slice(0, pending.max);
  if (legal.length < pending.min) return;
  for (const uid of legal) {
    const c = [me.active, ...me.minivan].find((x) => x?.uid === uid);
    if (c) heal(s, me, c, 1);
  }
  advancePending(s);
}

function resolveMove(s: GameState, kind: "everyday" | "shift", choice: WildcardChoice = "damage") {
  const me = s.players[s.turn];
  const opp = s.players[other(s.turn)];
  const active = me.active;
  if (!active || !opp.active) return;

  if (kind === "everyday") {
    dealDamage(s, me, opp, everydayDamage(active, s.flags), "everyday");
    s.flags.moved = true;
    if (!s.winner && s.flags.backseatSwitch && me.active && me.minivan.length) {
      queuePending(s, { kind: "target", player: me.id, effectId: T_AFTER_SWITCH, options: me.minivan.map((c) => c.uid), optional: true });
    }
    return;
  }

  active.shiftReady = false;
  emit(s, { t: "spent", player: me.id, uid: active.uid });
  const attackedUid = opp.active.uid;
  dealDamage(s, me, opp, shiftDamage(active, opp.kos, me.kos, choice), "shift");
  s.flags.moved = true;
  if (s.winner || !me.active) return;

  switch (active.chassisId) {
    case "anchor":
      me.active.shield = 1;
      emit(s, { t: "shield", player: me.id, uid: me.active.uid, amount: 1 });
      break;
    case "pivot":
      if (me.minivan.length) queuePending(s, { kind: "target", player: me.id, effectId: T_AFTER_SWITCH, options: me.minivan.map((c) => c.uid), optional: true });
      break;
    case "sustainer":
      heal(s, me, me.active, 2);
      break;
    case "trickster":
      if (opp.active?.uid === attackedUid) {
        opp.active.shiftReady = false;
        emit(s, { t: "spent", player: opp.id, uid: opp.active.uid });
      }
      break;
    case "captain": {
      const options = me.minivan.filter((c) => !c.shiftReady).map((c) => c.uid);
      if (options.length) queuePending(s, { kind: "target", player: me.id, effectId: T_CAPTAIN_READY, options, optional: false });
      break;
    }
    case "wildcard":
      if (choice === "heal") heal(s, me, me.active, 1);
      if (choice === "switch" && me.minivan.length) {
        queuePending(s, { kind: "target", player: me.id, effectId: T_AFTER_SWITCH, options: me.minivan.map((c) => c.uid), optional: true });
      }
      break;
  }
}

export function pendingDecider(s: GameState): PlayerId | null {
  return s.pending?.player ?? null;
}

export function defaultTarget(s: GameState): number | null {
  const p = s.pending;
  if (!p || p.kind !== "target") return null;
  const me = s.players[p.player];
  if (p.effectId === T_CARPOOL_SWITCH || p.effectId === T_AFTER_SWITCH) return p.optional ? null : p.options[0] ?? null;
  if (p.effectId === T_CAPTAIN_READY) return p.options[0] ?? null;
  if (p.effectId === T_GROUP_CHARACTER || p.effectId === T_CARPOOL_CHARACTER) {
    let best: CharPile | null = null;
    for (const c of [...me.hand, ...me.deck]) {
      if (isChar(c) && p.options.includes(c.uid) && (!best || c.maxHP + c.dmg > best.maxHP + best.dmg)) best = c;
    }
    return best?.uid ?? p.options[0] ?? null;
  }
  const reserve = bestMinivanVs(me);
  return reserve && p.options.includes(reserve.uid) ? reserve.uid : p.options[0] ?? null;
}

export function defaultTargets(s: GameState): number[] {
  const p = s.pending;
  if (!p || p.kind !== "multi-target") return [];
  const me = s.players[p.player];
  return [me.active, ...me.minivan]
    .filter((c): c is CardInPlay => !!c && p.options.includes(c.uid))
    .sort((a, b) => (a.hp / a.maxHP) - (b.hp / b.maxHP))
    .slice(0, p.max)
    .map((c) => c.uid);
}

export function defaultDiscard(s: GameState): number[] {
  const p = s.pending;
  return p?.kind === "discard" ? s.players[p.player].hand.slice(0, p.count).map((c) => c.uid) : [];
}

export function defaultReaction(): boolean {
  return false;
}

function actionIsLegal(s: GameState, action: Action): boolean {
  if (action.type === "chooseTarget") {
    return !!s.pending && s.pending.kind === "target" &&
      ((action.uid === null && s.pending.optional) || (action.uid !== null && s.pending.options.includes(action.uid)));
  }
  if (action.type === "chooseTargets") return !!s.pending && s.pending.kind === "multi-target";
  if (action.type === "discard") return !!s.pending && s.pending.kind === "discard";
  if (action.type === "confirmSetup") return s.phase === "setup" && s.setupPlayer === action.player;
  return legalActions(s).some((a) =>
    a.type === action.type &&
    (!("uid" in a) || !("uid" in action) || a.uid === action.uid) &&
    (!("choice" in a) || !("choice" in action) || a.choice === action.choice)
  );
}

export function applyAction(state: GameState, action: Action): GameState {
  if (!actionIsLegal(state, action)) return state;
  const s = structuredClone(state);
  const rng = makeRng(s.rngA);

  if (action.type === "chooseTarget") {
    resolveTarget(s, action.uid, rng);
    s.rngA = rng.state();
    return s;
  }
  if (action.type === "chooseTargets") {
    resolveMultiTarget(s, action.uids);
    return s;
  }
  if (action.type === "discard") {
    const p = s.pending;
    if (p?.kind === "discard") {
      const me = s.players[p.player];
      for (const uid of [...new Set(action.uids)].slice(0, p.count)) {
        const c = removeByUid(me.hand, uid);
        if (c) me.discard.push(c);
      }
      const over = me.hand.length - s.cfg.deck.handLimit;
      if (over > 0) s.pending = { kind: "discard", player: me.id, count: over };
      else {
        advancePending(s);
        if (!s.pending) {
          s.turn = other(s.turn);
          beginTurn(s);
        }
      }
    }
    return s;
  }
  if (action.type === "confirmSetup") {
    const p = s.players[action.player];
    const pool: CharPile[] = [];
    if (p.active) pool.push(toPile(p.active));
    for (const c of p.minivan) pool.push(toPile(c));
    for (const c of p.hand) if (isChar(c)) pool.push(c);
    const byUid = new Map(pool.map((c) => [c.uid, c]));
    const active = byUid.get(action.active);
    if (active) {
      const reserves = action.minivan
        .filter((u) => u !== active.uid)
        .slice(0, s.cfg.deck.minivanMax)
        .map((u) => byUid.get(u))
        .filter((c): c is CharPile => !!c);
      const chosen = new Set([active.uid, ...reserves.map((c) => c.uid)]);
      p.hand = p.hand.filter((c) => !isChar(c));
      for (const c of pool) if (!chosen.has(c.uid)) p.hand.push(c);
      p.active = instantiate(active);
      p.minivan = reserves.map(instantiate);
      s.phase = "play";
      s.setupPlayer = null;
      beginTurn(s);
    }
    return s;
  }

  const me = s.players[s.turn];
  const opp = s.players[other(s.turn)];
  switch (action.type) {
    case "placeMinivan": {
      const c = me.hand.find((x): x is CharPile => isChar(x) && x.uid === action.uid);
      if (c) {
        removeByUid(me.hand, c.uid);
        me.minivan.push(instantiate(c));
        s.flags.actionUsed = true;
        s.flags.actionChoiceMade = true;
        emit(s, { t: "deploy", player: me.id, uid: c.uid, to: "minivan" });
      }
      break;
    }
    case "voluntarySwitch":
      if (switchWithMinivan(s, me, action.uid, "voluntary")) {
        s.flags.actionUsed = true;
        s.flags.actionChoiceMade = true;
      }
      break;
    case "playSupport": {
      const c = me.hand.find((x): x is SupportPile => x.kind === "support" && x.uid === action.uid);
      if (c) playMoment(s, me, opp, c, rng);
      break;
    }
    case "pass":
      s.flags.passed = true;
      s.flags.actionChoiceMade = true;
      break;
    case "attack":
      resolveMove(s, "everyday");
      break;
    case "shift":
      resolveMove(s, "shift", action.choice);
      break;
    case "endTurn": {
      const over = me.hand.length - s.cfg.deck.handLimit;
      if (over > 0) s.pending = { kind: "discard", player: me.id, count: over };
      else {
        s.turn = other(s.turn);
        beginTurn(s);
      }
      break;
    }
  }
  s.rngA = rng.state();
  return s;
}

export interface MatchOptions {
  decks: Record<PlayerId, Deck>;
  cards: Map<string, AnyCard>;
  cfg?: RulesConfig;
  seed: number;
  names?: Partial<Record<PlayerId, string>>;
  manualSetup?: PlayerId;
  firstGame?: boolean;
}

function buildPiles(deck: Deck, cards: Map<string, AnyCard>, cfg: RulesConfig, nextUid: () => number): PileCard[] {
  const out: PileCard[] = [];
  for (const entry of deck.entries) {
    const card = cards.get(entry.cardId);
    if (!card) continue;
    for (let i = 0; i < entry.count; i++) {
      if (card.type === "Character") {
        const c = cfg.presets.find((x) => x.id === card.chassisId);
        out.push({
          kind: "char",
          uid: nextUid(),
          cardId: card.id,
          name: card.name,
          chassisId: c?.id ?? card.chassisId ?? "pivot",
          maxHP: c?.hp ?? card.hp,
          dmg: c?.damage ?? card.attack.damage,
          everydayName: card.attack.name || c?.everydayName || "Everyday Move",
          shiftName: card.abilityFlavorName || c?.shiftName || "Shift Move",
        });
      } else {
        out.push({ kind: "support", uid: nextUid(), cardId: card.id, name: card.name, effectId: card.effectId });
      }
    }
  }
  return out;
}

function guaranteeOpeningCharacter(p: PlayerState) {
  if (p.hand.some(isChar)) return;
  const passed: PileCard[] = [];
  while (p.deck.length) {
    const c = p.deck.pop()!;
    if (isChar(c)) {
      p.hand.push(c);
      break;
    }
    passed.push(c);
  }
  p.deck.unshift(...passed);
}

function autoPlace(p: PlayerState, cfg: RulesConfig) {
  const active = bestHandChar(p);
  if (active) {
    removeByUid(p.hand, active.uid);
    p.active = instantiate(active);
  }
  while (p.minivan.length < cfg.deck.minivanMax) {
    const c = bestHandChar(p);
    if (!c) break;
    removeByUid(p.hand, c.uid);
    p.minivan.push(instantiate(c));
  }
}

export function createMatch(opts: MatchOptions): GameState {
  const cfg = opts.firstGame ? firstGameConfig(opts.cfg ?? defaultConfig) : (opts.cfg ?? defaultConfig);
  const rng = makeRng(opts.seed);
  let uid = 0;
  const nextUid = () => ++uid;
  const firstPlayer: PlayerId = rng.value() < 0.5 ? "p0" : "p1";

  const mkPlayer = (id: PlayerId): PlayerState => {
    let deck = rng.shuffle(buildPiles(opts.decks[id], opts.cards, cfg, nextUid));
    if (opts.firstGame) deck = deck.filter(isChar).slice(-3);
    return {
      id,
      name: opts.names?.[id] ?? (id === "p0" ? "Player 1" : "Player 2"),
      deck,
      hand: [],
      discard: [],
      active: null,
      minivan: [],
      kos: 0,
      kosScored: 0,
    };
  };

  const players = { p0: mkPlayer("p0"), p1: mkPlayer("p1") };
  const s: GameState = {
    cfg,
    rngA: rng.state(),
    uidCounter: uid,
    turn: firstPlayer,
    firstPlayer,
    ply: 0,
    flags: freshFlags(),
    players,
    phase: "play",
    setupPlayer: null,
    pending: null,
    pendingQueue: [],
    firstGame: !!opts.firstGame,
    winner: null,
    reason: null,
    log: [],
  };

  for (const id of ["p0", "p1"] as PlayerId[]) {
    const p = players[id];
    const n = opts.firstGame ? 3 : cfg.deck.startingHand + (id === firstPlayer ? 0 : cfg.deck.secondPlayerBonusCards);
    draw(s, p, n);
    if (!opts.firstGame) {
      let mulligans = 0;
      while (!p.hand.some(isChar) && mulligans < cfg.deck.mulliganMax) {
        p.deck.push(...p.hand.splice(0));
        rng.shuffle(p.deck);
        draw(s, p, n);
        mulligans++;
      }
      guaranteeOpeningCharacter(p);
    }
    if (id !== opts.manualSetup) autoPlace(p, cfg);
  }
  s.log = [];
  s.rngA = rng.state();

  if (opts.manualSetup) {
    s.phase = "setup";
    s.setupPlayer = opts.manualSetup;
  } else beginTurn(s);
  return s;
}

export function runMatch(
  state: GameState,
  choose: (s: GameState) => Action,
  maxPly = 120,
  _react?: (s: GameState) => boolean,
  target: (s: GameState) => number | null = defaultTarget,
  discard: (s: GameState) => number[] = defaultDiscard
): GameState {
  let s = state;
  let guard = 0;
  while (!s.winner && s.ply < maxPly && guard++ < maxPly * 30) {
    if (s.pending?.kind === "target") s = applyAction(s, { type: "chooseTarget", uid: target(s) });
    else if (s.pending?.kind === "multi-target") s = applyAction(s, { type: "chooseTargets", uids: defaultTargets(s) });
    else if (s.pending?.kind === "discard") s = applyAction(s, { type: "discard", uids: discard(s) });
    else s = applyAction(s, choose(s));
  }
  return s;
}
