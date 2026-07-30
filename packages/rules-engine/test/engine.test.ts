import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config";
import type { CardInPlay, GameState, PileCard, PlayerId, PlayerState } from "../src/game/types";
import {
  applyAction,
  chooseAction,
  createMatch,
  legalActions,
  runMatch,
  shiftDamage,
} from "../src/game";
import { deck, fromChassis, indexCards, support } from "./helpers";

let UID = 0;
const ch = (chassisId = "pivot", over: Partial<CardInPlay> = {}): CardInPlay => {
  const def = defaultConfig.presets.find((c) => c.id === chassisId)!;
  return {
    uid: ++UID,
    cardId: chassisId,
    name: def.displayName,
    chassisId,
    maxHP: def.hp,
    hp: def.hp,
    dmg: def.damage,
    everydayName: def.everydayName!,
    shiftName: def.shiftName!,
    shiftReady: true,
    shield: 0,
    ...over,
  };
};
const pile = (chassisId = "pivot"): PileCard => {
  const c = ch(chassisId);
  return {
    kind: "char", uid: c.uid, cardId: c.cardId, name: c.name, chassisId,
    maxHP: c.maxHP, dmg: c.dmg, everydayName: c.everydayName, shiftName: c.shiftName,
  };
};
const moment = (effectId: string): PileCard => ({ kind: "support", uid: ++UID, cardId: effectId, name: effectId, effectId });
const player = (id: PlayerId, over: Partial<PlayerState> = {}): PlayerState => ({
  id, name: id, deck: [], hand: [], discard: [], active: ch(), minivan: [], kos: 0, kosScored: 0, ...over,
});
const flags = (over: Partial<GameState["flags"]> = {}): GameState["flags"] => ({
  actionUsed: false, passed: true, actionChoiceMade: true, moved: false,
  encore: false, runningLateUid: null, backseatSwitch: false, ...over,
});
const state = (over: Partial<GameState> = {}): GameState => ({
  cfg: defaultConfig,
  rngA: 1,
  uidCounter: 1000,
  turn: "p0",
  firstPlayer: "p1",
  ply: 2,
  flags: flags(),
  players: { p0: player("p0"), p1: player("p1") },
  phase: "play",
  setupPlayer: null,
  pending: null,
  pendingQueue: [],
  firstGame: false,
  winner: null,
  reason: null,
  log: [],
  ...over,
});

describe("Action-or-Pass move gate", () => {
  it("does not offer a move until Action or Pass is chosen", () => {
    const s = state({ flags: flags({ passed: false, actionChoiceMade: false }) });
    const types = legalActions(s).map((a) => a.type);
    expect(types).toContain("pass");
    expect(types).not.toContain("attack");
    expect(types).not.toContain("shift");
  });

  it("an Action unlocks only the Everyday Move", () => {
    const c = pile("anchor");
    const s = state({
      flags: flags({ passed: false, actionChoiceMade: false }),
      players: { p0: player("p0", { hand: [c], minivan: [] }), p1: player("p1") },
    });
    const after = applyAction(s, { type: "placeMinivan", uid: c.uid });
    expect(legalActions(after).some((a) => a.type === "attack")).toBe(true);
    expect(legalActions(after).some((a) => a.type === "shift")).toBe(false);
  });

  it("passing unlocks Everyday and a ready Shift", () => {
    const s = state({ flags: flags({ passed: false, actionChoiceMade: false }) });
    const after = applyAction(s, { type: "pass" });
    expect(legalActions(after).map((a) => a.type)).toEqual(expect.arrayContaining(["attack", "shift"]));
  });

  it("the opening player cannot Shift on turn one", () => {
    const s = state({ firstPlayer: "p0", ply: 1 });
    expect(legalActions(s).some((a) => a.type === "shift")).toBe(false);
    expect(legalActions(s).some((a) => a.type === "attack")).toBe(true);
  });
});

describe("Shift effects and recovery", () => {
  it("spends a Shift immediately and readies it only after resting in the Minivan", () => {
    const shifted = applyAction(state(), { type: "shift" });
    expect(shifted.players.p0.active!.shiftReady).toBe(false);

    const reserveUid = shifted.players.p0.active!.uid;
    shifted.players.p0.minivan.push(shifted.players.p0.active!);
    shifted.players.p0.active = ch("anchor");
    shifted.flags = flags({ moved: true });
    const next = applyAction(shifted, { type: "endTurn" });
    const back = applyAction({ ...next, flags: flags({ moved: true }) }, { type: "endTurn" });
    expect(back.players.p0.minivan.find((c) => c.uid === reserveUid)?.shiftReady).toBe(true);
  });

  it("Anchor grants Shield 1 and the next hit consumes it", () => {
    const s = state({ players: { p0: player("p0", { active: ch("anchor") }), p1: player("p1", { active: ch("cannon") }) } });
    const shifted = applyAction(s, { type: "shift" });
    expect(shifted.players.p0.active!.shield).toBe(1);
    shifted.turn = "p1";
    shifted.flags = flags();
    const hit = applyAction(shifted, { type: "attack" });
    expect(hit.players.p0.active!.hp).toBe(5); // 7 - (3 Everyday - Shield 1)
    expect(hit.players.p0.active!.shield).toBe(0);
  });

  it("Sustainer heals after damage", () => {
    const s = state({ players: { p0: player("p0", { active: ch("sustainer", { hp: 2 }) }), p1: player("p1") } });
    expect(applyAction(s, { type: "shift" }).players.p0.active!.hp).toBe(4);
  });

  it("Trickster spends the opposing Active unless it was Knocked Out", () => {
    const s = state({ players: { p0: player("p0", { active: ch("trickster") }), p1: player("p1", { active: ch("anchor") }) } });
    expect(applyAction(s, { type: "shift" }).players.p1.active!.shiftReady).toBe(false);
  });

  it("Captain offers only spent Minivan Characters to ready", () => {
    const spent = ch("cannon", { shiftReady: false });
    const ready = ch("anchor");
    const s = state({ players: { p0: player("p0", { active: ch("captain"), minivan: [spent, ready] }), p1: player("p1") } });
    const after = applyAction(s, { type: "shift" });
    expect(after.pending?.kind).toBe("target");
    expect(after.pending?.kind === "target" && after.pending.options).toEqual([spent.uid]);
  });

  it("Wildcard choices and Underdog comeback damage use the printed values", () => {
    expect(shiftDamage(ch("wildcard"), 0, 0, "damage")).toBe(3);
    expect(shiftDamage(ch("wildcard"), 0, 0, "heal")).toBe(2);
    expect(shiftDamage(ch("underdog"), 2, 1)).toBe(4);
    expect(shiftDamage(ch("underdog"), 1, 1)).toBe(3);
  });
});

describe("damage, KOs, and afterward ordering", () => {
  it("the third KO wins immediately without a comeback draw", () => {
    const s = state({
      players: {
        p0: player("p0", { active: ch("cannon"), kos: 2, kosScored: 2 }),
        p1: player("p1", { active: ch("cannon", { hp: 4 }), hand: [moment("snack-break")] }),
      },
    });
    const r = applyAction(s, { type: "shift" });
    expect(r.winner).toBe("p0");
    expect(r.players.p0.kos).toBe(3);
    expect(r.players.p1.hand).toHaveLength(1);
  });

  it("the defender chooses a replacement from multiple Minivan Characters", () => {
    const r1 = ch("anchor");
    const r2 = ch("pivot");
    const s = state({
      players: {
        p0: player("p0", { active: ch("cannon") }),
        p1: player("p1", { active: ch("cannon", { hp: 4 }), minivan: [r1, r2] }),
      },
    });
    const ko = applyAction(s, { type: "shift" });
    expect(ko.pending?.kind).toBe("target");
    const replaced = applyAction(ko, { type: "chooseTarget", uid: r2.uid });
    expect(replaced.players.p1.active?.uid).toBe(r2.uid);
  });

  it("Pivot's optional switch waits behind a KO replacement", () => {
    const s = state({
      players: {
        p0: player("p0", { active: ch("pivot"), minivan: [ch("anchor")] }),
        p1: player("p1", { active: ch("pivot", { hp: 2 }), minivan: [ch("anchor"), ch("cannon")] }),
      },
    });
    const after = applyAction(s, { type: "shift" });
    expect(after.pending?.kind === "target" && after.pending.effectId).toBe("new-active");
    expect(after.pendingQueue[0]?.kind === "target" && after.pendingQueue[0].effectId).toBe("after-move-switch");
  });

  it("an empty deck is not a loss", () => {
    const s = state({ flags: flags({ moved: true }), players: { p0: player("p0"), p1: player("p1", { deck: [] }) } });
    const r = applyAction(s, { type: "endTurn" });
    expect(r.winner).toBeNull();
    expect(r.turn).toBe("p1");
  });
});

describe("Moments", () => {
  const beforeAction = () => flags({ passed: false, actionChoiceMade: false });

  it("Encore readies the Active and permits a Shift after using the Action", () => {
    const encore = moment("encore");
    const s = state({
      flags: beforeAction(),
      players: { p0: player("p0", { active: ch("anchor", { shiftReady: false }), hand: [encore] }), p1: player("p1") },
    });
    const r = applyAction(s, { type: "playSupport", uid: encore.uid });
    expect(r.players.p0.active!.shiftReady).toBe(true);
    expect(legalActions(r).some((a) => a.type === "shift")).toBe(true);
  });

  it("Running Late switches and buffs only that Active's Everyday Move", () => {
    const card = moment("running-late");
    const incoming = ch("cannon");
    const s = state({
      flags: beforeAction(),
      players: { p0: player("p0", { active: ch("anchor"), minivan: [incoming], hand: [card] }), p1: player("p1", { active: ch("anchor") }) },
    });
    const declared = applyAction(s, { type: "playSupport", uid: card.uid });
    const switched = applyAction(declared, { type: "chooseTarget", uid: incoming.uid });
    const hit = applyAction(switched, { type: "attack" });
    expect(hit.players.p1.active!.hp).toBe(3); // 7 - (3 + 1)
  });

  it("Good Vibes heals up to two different Characters", () => {
    const card = moment("good-vibes");
    const active = ch("anchor", { hp: 4 });
    const reserve = ch("pivot", { hp: 2 });
    const s = state({
      flags: beforeAction(),
      players: { p0: player("p0", { active, minivan: [reserve], hand: [card] }), p1: player("p1") },
    });
    const declared = applyAction(s, { type: "playSupport", uid: card.uid });
    const healed = applyAction(declared, { type: "chooseTargets", uids: [active.uid, reserve.uid] });
    expect(healed.players.p0.active!.hp).toBe(5);
    expect(healed.players.p0.minivan[0]!.hp).toBe(3);
  });

  it("Group Chat can still be played when no Character remains in the deck", () => {
    const groupChat = moment("group-chat");
    const deckMoment = moment("snack-break");
    const s = state({
      flags: beforeAction(),
      players: {
        p0: player("p0", { hand: [groupChat], deck: [deckMoment] }),
        p1: player("p1"),
      },
    });

    expect(legalActions(s)).toContainEqual({ type: "playSupport", uid: groupChat.uid });
    const played = applyAction(s, { type: "playSupport", uid: groupChat.uid });
    expect(played.players.p0.hand).toHaveLength(0);
    expect(played.players.p0.discard).toContainEqual(groupChat);
    expect(played.pending).toBeNull();
  });

  it("Detour is decided by the opponent", () => {
    const detour = moment("detour");
    const reserve = ch("anchor");
    const s = state({
      flags: beforeAction(),
      players: { p0: player("p0", { hand: [detour] }), p1: player("p1", { minivan: [reserve] }) },
    });
    const r = applyAction(s, { type: "playSupport", uid: detour.uid });
    expect(r.pending?.kind === "target" && r.pending.player).toBe("p1");
  });
});

describe("match setup and headless play", () => {
  function fixtureDeck() {
    const chars = defaultConfig.presets.map((c) => fromChassis(c.id, defaultConfig));
    const moments = [
      support({ effectId: "snack-break" }),
      support({ effectId: "running-late" }),
      support({ effectId: "carpool" }),
    ];
    const cards = [...chars, ...moments];
    const d = deck([
      ...chars.map((c, i) => ({ cardId: c.id, count: i < 4 ? 2 : 1 })),
      ...moments.map((c) => ({ cardId: c.id, count: 2 })),
    ]);
    return { cards, d };
  }

  it("First Game Mode uses three Characters, no draw deck, and two KO Stars", () => {
    const { cards, d } = fixtureDeck();
    const s = createMatch({ decks: { p0: d, p1: d }, cards: indexCards(cards), seed: 2, firstGame: true });
    expect(s.cfg.rules.winKnockouts).toBe(2);
    expect(s.players.p0.deck).toHaveLength(0);
    expect(1 + s.players.p0.minivan.length).toBe(3);
  });

  it("automated v5 games terminate", () => {
    const { cards, d } = fixtureDeck();
    for (let seed = 1; seed <= 10; seed++) {
      const start = createMatch({ decks: { p0: d, p1: d }, cards: indexCards(cards), seed });
      const end = runMatch(start, chooseAction, 120);
      expect(end.winner, `seed ${seed}`).not.toBeNull();
      expect(end.ply).toBeLessThan(120);
    }
  });
});
