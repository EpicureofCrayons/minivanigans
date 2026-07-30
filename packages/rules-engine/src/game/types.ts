// Deterministic match-state types for Minivanigans! Rules v5.

import type { RulesConfig } from "../types";

export type PlayerId = "p0" | "p1";
export type WildcardChoice = "damage" | "heal" | "switch";

export type PileCard =
  | {
      kind: "char";
      uid: number;
      cardId: string;
      name: string;
      chassisId: string;
      maxHP: number;
      dmg: number;
      everydayName: string;
      shiftName: string;
    }
  | {
      kind: "support";
      uid: number;
      cardId: string;
      name: string;
      effectId: string;
    };

export type CharPile = Extract<PileCard, { kind: "char" }>;
export type SupportPile = Extract<PileCard, { kind: "support" }>;

/** hp is remaining Stamina. Damage counters shown in the UI are maxHP - hp. */
export interface CardInPlay {
  uid: number;
  cardId: string;
  name: string;
  chassisId: string;
  maxHP: number;
  hp: number;
  dmg: number;
  everydayName: string;
  shiftName: string;
  shiftReady: boolean;
  shield: number;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  deck: PileCard[];
  hand: PileCard[];
  discard: PileCard[];
  active: CardInPlay | null;
  minivan: CardInPlay[];
  kos: number;
  kosScored: number;
}

export interface TurnFlags {
  /** An Action was taken (bench, switch, or Moment). */
  actionUsed: boolean;
  /** The player explicitly passed the Action. */
  passed: boolean;
  /** Action or Pass has been chosen, unlocking the Move step. */
  actionChoiceMade: boolean;
  /** One Everyday or Shift Move has resolved. */
  moved: boolean;
  /** Encore's deliberate exception to the normal Action/Shift rule. */
  encore: boolean;
  /** Running Late: +1 only to the switched-in Active's Everyday Move. */
  runningLateUid: number | null;
  /** Backseat Driver: offer a free switch after this turn's Everyday Move. */
  backseatSwitch: boolean;
}

export type GameEvent =
  | { t: "turn"; player: PlayerId; ply: number }
  | { t: "draw"; player: PlayerId; count: number }
  | { t: "deploy"; player: PlayerId; uid: number; to: "active" | "minivan" }
  | { t: "switch"; player: PlayerId; kind: "voluntary" | "moment" | "shift" | "forced"; uid: number }
  | { t: "support"; player: PlayerId; effectId: string }
  | { t: "move"; player: PlayerId; attackerUid: number; move: "everyday" | "shift"; dealt: number }
  | { t: "shield"; player: PlayerId; uid: number; amount: number }
  | { t: "ready"; player: PlayerId; uid: number }
  | { t: "spent"; player: PlayerId; uid: number }
  | { t: "ko"; player: PlayerId; victimUid: number }
  | { t: "heal"; player: PlayerId; uid: number; amount: number }
  | { t: "win"; player: PlayerId; reason: string }
  | { t: "info"; message: string };

export interface PendingTarget {
  kind: "target";
  player: PlayerId;
  effectId: string;
  options: number[];
  optional: boolean;
}

export interface PendingMultiTarget {
  kind: "multi-target";
  player: PlayerId;
  effectId: string;
  options: number[];
  min: number;
  max: number;
}

export interface PendingDiscard {
  kind: "discard";
  player: PlayerId;
  count: number;
}

export type Pending = PendingTarget | PendingMultiTarget | PendingDiscard;

export interface GameState {
  cfg: RulesConfig;
  rngA: number;
  uidCounter: number;
  turn: PlayerId;
  firstPlayer: PlayerId;
  ply: number;
  flags: TurnFlags;
  players: Record<PlayerId, PlayerState>;
  phase: "setup" | "play";
  setupPlayer: PlayerId | null;
  pending: Pending | null;
  /** Follow-up choices wait here when a KO replacement must resolve first. */
  pendingQueue: Pending[];
  firstGame: boolean;
  winner: PlayerId | null;
  reason: string | null;
  log: GameEvent[];
}

export type Action =
  | { type: "placeMinivan"; uid: number }
  | { type: "playSupport"; uid: number }
  | { type: "voluntarySwitch"; uid: number }
  | { type: "pass" }
  | { type: "attack" }
  | { type: "shift"; choice?: WildcardChoice }
  | { type: "endTurn" }
  | { type: "chooseTarget"; uid: number | null }
  | { type: "chooseTargets"; uids: number[] }
  | { type: "discard"; uids: number[] }
  | { type: "confirmSetup"; player: PlayerId; active: number; minivan: number[] };

export type Difficulty = "easy" | "normal";
