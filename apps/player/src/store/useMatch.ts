import { create } from "zustand";
import {
  createMatch,
  applyAction,
  chooseAction,
  chooseTarget,
  chooseTargets,
  chooseDiscard,
  pendingDecider,
  type Action,
  type AnyCard,
  type Deck,
  type Difficulty,
  type GameState,
  type PlayerId,
  type RulesConfig,
} from "@minivanigans/rules-engine";

const BOT_DELAY = 1000; // ms between the bot's individual moves — long enough for the battle effects to read

/** Where the in-progress match is checkpointed so it survives an app restart. */
const MATCH_KEY = "minivanigans-match-v5";

interface SavedMatch {
  game: GameState;
  human: PlayerId;
  /** MatchSetup with the cards Map flattened to an array for JSON. */
  setup: Omit<MatchSetup, "cards"> & { cards: AnyCard[] };
}

function persistMatch(game: GameState | null, setup: MatchSetup | null, human: PlayerId) {
  try {
    if (!game || game.winner || !setup) {
      localStorage.removeItem(MATCH_KEY);
      return;
    }
    const saved: SavedMatch = { game, human, setup: { ...setup, cards: [...setup.cards.values()] } };
    localStorage.setItem(MATCH_KEY, JSON.stringify(saved));
  } catch {
    // Persistence is best-effort — a full disk or blocked storage never breaks play.
  }
}

function loadSavedMatch(): SavedMatch | null {
  try {
    const raw = localStorage.getItem(MATCH_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedMatch;
    if (!saved?.game || saved.game.winner || !saved.setup) return null;
    return saved;
  } catch {
    return null;
  }
}

export interface MatchSetup {
  decks: Record<PlayerId, Deck>;
  cards: Map<string, AnyCard>;
  cfg: RulesConfig;
  difficulty: Difficulty;
  /** Display names per seat. */
  names: Record<PlayerId, string>;
  /** v5 tutorial: three Characters, no deck or Moments, first to 2 KOs. */
  firstGame?: boolean;
}

/** How many human-decision snapshots to keep for Undo. */
const HISTORY_CAP = 100;

interface MatchState {
  game: GameState | null;
  /** Which seat the human controls (always p0 for now). */
  human: PlayerId;
  /** True while the bot is taking its turn. */
  thinking: boolean;
  setup: MatchSetup | null;
  /** Bumped on every (re)start so stale bot timeouts bail out. */
  epoch: number;
  /** Snapshots taken just before each human action, newest last. Undo pops one.
   * GameState is immutable (applyAction returns fresh objects), so these are
   * cheap references, not clones. */
  history: GameState[];
  start: (setup: MatchSetup, seed: number) => void;
  rematch: (seed: number) => void;
  dispatch: (action: Action) => void;
  undo: () => void;
  clear: () => void;
  /** Rehydrate a checkpointed match after an app restart. True if one was restored. */
  restore: () => boolean;
}

export const useMatch = create<MatchState>((set, get) => {
  // Drive the game forward: auto-resolve the bot's reactions and turns one step
  // at a time (with a delay so it's followable), and stop whenever it's the
  // human's move — either a normal turn or a reaction they must answer.
  function pump(epoch: number) {
    if (get().epoch !== epoch) return;
    const g = get().game;
    const human = get().human;
    if (!g || g.winner || g.phase === "setup") {
      set({ thinking: false }); // setup waits on the human; nothing for the bot to do
      return;
    }
    const diff = get().setup?.difficulty ?? "normal";

    if (g.pending) {
      if (pendingDecider(g) === human) {
        set({ thinking: false }); // wait for the human's decision
        return;
      }
      set({ thinking: true });
      setTimeout(() => {
        if (get().epoch !== epoch) return;
        const cur = get().game;
        if (!cur || !cur.pending) {
          pump(epoch);
          return;
        }
        const action: Action =
          cur.pending.kind === "target"
            ? { type: "chooseTarget", uid: chooseTarget(cur, diff) }
            : cur.pending.kind === "multi-target"
              ? { type: "chooseTargets", uids: chooseTargets(cur, diff) }
              : { type: "discard", uids: chooseDiscard(cur, diff) };
        set({ game: applyAction(cur, action) });
        pump(epoch);
      }, BOT_DELAY);
      return;
    }

    if (g.turn === human) {
      set({ thinking: false }); // the human's move
      return;
    }

    set({ thinking: true });
    setTimeout(() => {
      if (get().epoch !== epoch) return;
      const cur = get().game;
      if (!cur || cur.winner) {
        set({ thinking: false });
        return;
      }
      if (cur.pending || cur.turn === human) {
        pump(epoch);
        return;
      }
      set({ game: applyAction(cur, chooseAction(cur, diff)) });
      pump(epoch);
    }, BOT_DELAY);
  }

  function begin(setup: MatchSetup, seed: number) {
    const epoch = get().epoch + 1;
    const game = createMatch({
      decks: setup.decks,
      cards: setup.cards,
      cfg: setup.cfg,
      seed,
      names: setup.names,
      manualSetup: "p0", // the human picks their opening
      firstGame: setup.firstGame,
    });
    set({ game, setup, human: "p0", thinking: false, epoch, history: [] });
    pump(epoch);
  }

  /** Record the pre-action state so the human can take the move back. */
  function checkpoint(g: GameState) {
    const hist = get().history;
    const next = hist.length >= HISTORY_CAP ? hist.slice(1) : hist.slice();
    next.push(g);
    set({ history: next });
  }

  return {
    game: null,
    human: "p0",
    thinking: false,
    setup: null,
    epoch: 0,
    history: [],
    start: (setup, seed) => begin(setup, seed),
    rematch: (seed) => {
      const setup = get().setup;
      if (setup) begin(setup, seed);
    },
    dispatch: (action) => {
      const g = get().game;
      if (!g || g.winner) return;
      const human = get().human;
      if (g.phase === "setup") {
        if (action.type === "confirmSetup" && action.player === human) {
          checkpoint(g);
          set({ game: applyAction(g, action) });
          pump(get().epoch);
        }
        return;
      }
      if (g.pending) {
        // The only human move while paused is their own reaction / target choice.
        if ((action.type === "chooseTarget" || action.type === "chooseTargets" || action.type === "discard") && pendingDecider(g) === human) {
          checkpoint(g);
          set({ game: applyAction(g, action) });
          pump(get().epoch);
        }
        return;
      }
      if (g.turn !== human) return;
      checkpoint(g);
      set({ game: applyAction(g, action) });
      pump(get().epoch);
    },
    undo: () => {
      const hist = get().history;
      if (hist.length === 0) return;
      const prev = hist[hist.length - 1];
      // Bump the epoch so any in-flight bot timeout from the discarded future
      // bails out, then restore. Every snapshot is itself a human-decision
      // point, so there's nothing for the bot to do — no pump needed.
      const epoch = get().epoch + 1;
      set({ history: hist.slice(0, -1), game: prev, thinking: false, epoch });
    },
    clear: () => set({ game: null, setup: null, thinking: false, history: [] }),
    restore: () => {
      if (get().game) return false; // never clobber a live match
      const saved = loadSavedMatch();
      if (!saved) return false;
      const setup: MatchSetup = { ...saved.setup, cards: new Map(saved.setup.cards.map((c) => [c.id, c])) };
      const epoch = get().epoch + 1;
      set({ game: saved.game, setup, human: saved.human, thinking: false, epoch, history: [] });
      pump(epoch); // resume the bot mid-turn if that's where we left off
      return true;
    },
  };
});

// Checkpoint the match on every state change (cheap: one JSON write), so a
// crash or app restart never loses a game in progress.
useMatch.subscribe((s) => persistMatch(s.game, s.setup, s.human));
