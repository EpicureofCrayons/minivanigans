import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarFront, RotateCcw, Settings2, Shield, Sparkles, Undo2 } from "lucide-react";
import {
  legalActions,
  type Action,
  type AnyCard,
  type CardInPlay,
  type CharPile,
  type GameState,
  type PlayerId,
  type PlayerState,
  type RulesConfig,
} from "@minivanigans/rules-engine";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { CardPreview } from "../components/CardPreview";
import { useLibrary } from "../store/useLibrary";
import { useMatch } from "../store/useMatch";
import { cn } from "../lib/cn";

const other = (id: PlayerId): PlayerId => id === "p0" ? "p1" : "p0";

export function PlayMatch() {
  const navigate = useNavigate();
  const game = useMatch((s) => s.game);
  const thinking = useMatch((s) => s.thinking);
  const human = useMatch((s) => s.human);
  const dispatch = useMatch((s) => s.dispatch);
  const rematch = useMatch((s) => s.rematch);
  const undo = useMatch((s) => s.undo);
  const history = useMatch((s) => s.history);
  const cards = useLibrary((s) => s.cards);
  const cfg = useLibrary((s) => s.config);
  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  useEffect(() => {
    if (!game) navigate("/play", { replace: true });
  }, [game, navigate]);
  if (!game) return null;

  const me = game.players[human];
  const bot = game.players[other(human)];

  if (game.phase === "setup") {
    return (
      <SetupView
        me={me}
        cardsById={cardsById}
        cfg={cfg}
        onConfirm={(active, minivan) => dispatch({ type: "confirmSetup", player: human, active, minivan })}
      />
    );
  }

  const myTurn = game.turn === human && !game.winner;
  const actions = myTurn && !thinking ? legalActions(game) : [];
  const playMoment = new Set(actions.filter((a) => a.type === "playSupport").map((a) => a.uid));
  const bench = new Set(actions.filter((a) => a.type === "placeMinivan").map((a) => a.uid));
  const switches = new Set(actions.filter((a) => a.type === "voluntarySwitch").map((a) => a.uid));
  const canPass = actions.some((a) => a.type === "pass");
  const canEveryday = actions.some((a) => a.type === "attack");
  const shifts = actions.filter((a): a is Extract<Action, { type: "shift" }> => a.type === "shift");
  const canEnd = actions.some((a) => a.type === "endTurn");

  return (
    <div className="pb-6">
      <PageHeader
        title={game.firstGame ? "First Game Match" : "Minivanigans! Match"}
        subtitle={`First to ${game.cfg.rules.winKnockouts} KO Stars wins. Take an Action for an Everyday Move, or pass to Shift.`}
        actions={<Button variant="ghost" onClick={() => navigate("/play")}><Settings2 size={16} /> New match</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-fg">
            {game.winner ? (game.winner === human ? "You win!" : "The Bot wins") : thinking ? "Bot is choosing…" : myTurn ? "Your turn" : "Bot's turn"}
          </div>
          {!game.winner && (
            <div className="text-xs text-muted">
              {stepLabel(game)}
              {game.ply === 1 && game.turn === game.firstPlayer ? " · Opening player: Everyday only" : ""}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" disabled={history.length === 0 || thinking} onClick={undo}><Undo2 size={15} /> Undo</Button>
          {game.winner && <Button variant="primary" onClick={() => rematch(Date.now())}><RotateCcw size={15} /> Rematch</Button>}
        </div>
      </div>

      <div className="space-y-5">
        <PlayerBoard player={bot} cfg={cfg} cardsById={cardsById} opponent />

        <div className="rounded-card border border-brand/25 bg-brand/5 p-4">
          {game.winner ? (
            <div className="py-3 text-center">
              <Sparkles className="mx-auto mb-2 text-brand" />
              <div className="font-display text-2xl font-semibold">{game.winner === human ? "Extraordinary shift!" : "The van will ride again."}</div>
              <p className="mt-1 text-sm text-muted">{game.reason === "no-characters" ? "No replacement Character remained." : "Three KO Stars decided the match."}</p>
            </div>
          ) : game.pending && game.pending.player === human ? (
            <PendingChoice game={game} me={me} cardsById={cardsById} cfg={cfg} dispatch={dispatch} />
          ) : myTurn && !thinking ? (
            <TurnControls
              game={game}
              me={me}
              playMoment={playMoment}
              bench={bench}
              switches={switches}
              canPass={canPass}
              canEveryday={canEveryday}
              shifts={shifts}
              canEnd={canEnd}
              dispatch={dispatch}
            />
          ) : (
            <p className="py-2 text-center text-sm text-muted">{thinking ? "The Bot is planning its van rotation…" : "Waiting for the other player…"}</p>
          )}
        </div>

        <PlayerBoard player={me} cfg={cfg} cardsById={cardsById}
          switchable={switches} onSwitch={(uid) => dispatch({ type: "voluntarySwitch", uid })} />

        {!game.firstGame && (
          <Hand
            player={me}
            cfg={cfg}
            cardsById={cardsById}
            momentUids={playMoment}
            benchUids={bench}
            onMoment={(uid) => dispatch({ type: "playSupport", uid })}
            onBench={(uid) => dispatch({ type: "placeMinivan", uid })}
          />
        )}
      </div>
    </div>
  );
}

function stepLabel(game: GameState): string {
  if (game.pending) return "Resolve the highlighted choice";
  if (!game.flags.actionChoiceMade) return game.firstGame ? "Choose whether to switch or stay" : "Step 3 · Take one Action or pass";
  if (!game.flags.moved) return game.flags.passed ? "Step 4 · Use an Everyday or ready Shift Move" : "Step 4 · Use an Everyday Move";
  return "Step 5 · End your turn";
}

function TurnControls({
  game, me, playMoment, bench, switches, canPass, canEveryday, shifts, canEnd, dispatch,
}: {
  game: GameState;
  me: PlayerState;
  playMoment: Set<number>;
  bench: Set<number>;
  switches: Set<number>;
  canPass: boolean;
  canEveryday: boolean;
  shifts: Extract<Action, { type: "shift" }>[];
  canEnd: boolean;
  dispatch: (a: Action) => void;
}) {
  if (!game.flags.actionChoiceMade) {
    return (
      <div>
        <div className="mb-3 text-center">
          <div className="font-semibold">Action or Pass?</div>
          <p className="text-xs text-muted">
            {game.firstGame ? "Switch to use that Character's Everyday Move, or stay to unlock a ready Shift." : "Bench, switch, or play a Moment for an Everyday Move. Pass to unlock a ready Shift."}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="primary" disabled={!canPass} onClick={() => dispatch({ type: "pass" })}>
            <Sparkles size={16} /> Pass Action
          </Button>
          {(playMoment.size > 0 || bench.size > 0 || switches.size > 0) && (
            <span className="self-center text-xs text-muted">or choose a highlighted card below</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mb-3 font-semibold">{game.flags.moved ? "Move resolved" : "Choose your move"}</div>
      <div className="flex flex-wrap justify-center gap-2">
        {canEveryday && me.active && (
          <Button variant="secondary" onClick={() => dispatch({ type: "attack" })}>
            {me.active.everydayName} · {me.active.dmg + (game.flags.runningLateUid === me.active.uid ? 1 : 0)} damage
          </Button>
        )}
        {shifts.map((a) => (
          <Button key={a.choice ?? "shift"} variant="primary" onClick={() => dispatch(a)}>
            <Sparkles size={15} />
            {me.active?.shiftName}{a.choice ? ` · ${a.choice}` : ""}
          </Button>
        ))}
        {canEnd && <Button variant="ghost" onClick={() => dispatch({ type: "endTurn" })}>End turn</Button>}
      </div>
    </div>
  );
}

function PlayerBoard({
  player, cfg, cardsById, opponent = false, switchable = new Set(), onSwitch,
}: {
  player: PlayerState;
  cfg: RulesConfig;
  cardsById: Map<string, AnyCard>;
  opponent?: boolean;
  switchable?: Set<number>;
  onSwitch?: (uid: number) => void;
}) {
  return (
    <section className={cn("rounded-card border p-4", opponent ? "border-line bg-surface/70" : "border-brand/30 bg-surface")}>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold">{player.name}</div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>Deck {player.deck.length}</span>
          <span>Hand {player.hand.length}</span>
          <span className="font-semibold text-fg">KO Stars {"★".repeat(player.kos)}{"☆".repeat(Math.max(0, cfg.rules.winKnockouts - player.kos))}</span>
        </div>
      </div>
      <div className="grid items-center gap-4 md:grid-cols-[180px_1fr]">
        <div>
          <div className="mb-1 text-center text-[10px] font-semibold uppercase tracking-widest text-muted">Active</div>
          {player.active ? <Fighter card={player.active} source={cardsById.get(player.active.cardId)} cfg={cfg} /> : <EmptySlot label="No Active" />}
        </div>
        <div>
          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted"><CarFront size={12} /> Minivan</div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: cfg.deck.minivanMax }, (_, i) => {
              const c = player.minivan[i];
              return c ? (
                <button key={c.uid} disabled={!switchable.has(c.uid)} onClick={() => onSwitch?.(c.uid)}
                  className={cn("rounded-card text-left", switchable.has(c.uid) && "ring-2 ring-brand hover:scale-[1.02]")}>
                  <Fighter card={c} source={cardsById.get(c.cardId)} cfg={cfg} compact />
                  {switchable.has(c.uid) && <div className="mt-1 text-center text-[10px] font-semibold text-brand">Switch in</div>}
                </button>
              ) : <EmptySlot key={i} label="Open seat" />;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Fighter({ card, source, cfg, compact = false }: { card: CardInPlay; source?: AnyCard; cfg: RulesConfig; compact?: boolean }) {
  const chassis = cfg.presets.find((p) => p.id === card.chassisId);
  const damage = card.maxHP - card.hp;
  return (
    <div className={cn("relative rounded-card border border-line bg-surface-2 p-2", !card.shiftReady && "opacity-80")}>
      {source && <CardPreview card={source} cfg={cfg} width={compact ? 98 : 150} className="mx-auto" />}
      {!source && <div className="py-5 text-center font-semibold">{card.name}</div>}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1 text-[10px]">
        <span className="rounded-full bg-danger/10 px-2 py-0.5 text-danger">Damage {damage}/{card.maxHP}</span>
        <span className={cn("rounded-full px-2 py-0.5 font-semibold", card.shiftReady ? "bg-success/15 text-success" : "bg-muted/15 text-muted")}>
          {card.shiftReady ? "Ready" : "Spent"}
        </span>
        {card.shield > 0 && <span className="flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-brand"><Shield size={10} /> Shield {card.shield}</span>}
      </div>
      <div className="mt-1 text-center text-[10px] text-muted">{chassis?.displayName}</div>
    </div>
  );
}

function Hand({
  player, cfg, cardsById, momentUids, benchUids, onMoment, onBench,
}: {
  player: PlayerState;
  cfg: RulesConfig;
  cardsById: Map<string, AnyCard>;
  momentUids: Set<number>;
  benchUids: Set<number>;
  onMoment: (uid: number) => void;
  onBench: (uid: number) => void;
}) {
  return (
    <section>
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Your hand · {player.hand.length}</div>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {player.hand.map((c) => {
          const card = cardsById.get(c.cardId);
          const enabled = momentUids.has(c.uid) || benchUids.has(c.uid);
          return (
            <button key={c.uid} disabled={!enabled}
              onClick={() => c.kind === "support" ? onMoment(c.uid) : onBench(c.uid)}
              className={cn("shrink-0 rounded-card text-left", enabled && "ring-2 ring-brand hover:-translate-y-1")}>
              {card ? <CardPreview card={card} cfg={cfg} width={118} /> : <div className="h-40 w-28 rounded-card bg-surface p-2">{c.name}</div>}
              {enabled && <div className="mt-1 text-center text-[10px] font-semibold text-brand">{c.kind === "support" ? "Play Moment" : "Bench"}</div>}
            </button>
          );
        })}
        {player.hand.length === 0 && <p className="text-sm text-muted">Your hand is empty.</p>}
      </div>
    </section>
  );
}

function PendingChoice({
  game, me, cardsById, cfg, dispatch,
}: {
  game: GameState;
  me: PlayerState;
  cardsById: Map<string, AnyCard>;
  cfg: RulesConfig;
  dispatch: (a: Action) => void;
}) {
  const p = game.pending!;
  const [selected, setSelected] = useState<number[]>([]);

  if (p.kind === "discard") {
    return (
      <div className="text-center">
        <div className="font-semibold">Discard {p.count} card{p.count === 1 ? "" : "s"} to reach the hand limit</div>
        <ChoiceCards options={me.hand.map((c) => c.uid)} player={me} cardsById={cardsById} cfg={cfg}
          selected={selected} onToggle={(uid) => setSelected(toggle(selected, uid, p.count))} />
        <Button variant="primary" disabled={selected.length !== p.count} onClick={() => dispatch({ type: "discard", uids: selected })}>Discard selected</Button>
      </div>
    );
  }

  const title = pendingTitle(p.effectId);
  if (p.kind === "multi-target") {
    return (
      <div className="text-center">
        <div className="font-semibold">{title}</div>
        <p className="text-xs text-muted">Choose up to {p.max} different Characters.</p>
        <ChoiceFighters player={me} options={p.options} selected={selected}
          onToggle={(uid) => setSelected(toggle(selected, uid, p.max))} />
        <Button variant="primary" onClick={() => dispatch({ type: "chooseTargets", uids: selected })}>Confirm</Button>
      </div>
    );
  }

  const owner = game.players[p.player];
  const pool = [...owner.hand, ...owner.deck, ...owner.discard];
  const inPlay = [owner.active, ...owner.minivan].filter((c): c is CardInPlay => !!c);
  const options = p.options;
  return (
    <div className="text-center">
      <div className="font-semibold">{title}</div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {options.map((uid) => {
          const live = inPlay.find((c) => c.uid === uid);
          const pile = pool.find((c) => c.uid === uid);
          const name = live?.name ?? pile?.name ?? "Character";
          return <Button key={uid} variant="secondary" onClick={() => dispatch({ type: "chooseTarget", uid })}>{name}</Button>;
        })}
        {p.optional && <Button variant="ghost" onClick={() => dispatch({ type: "chooseTarget", uid: null })}>Skip</Button>}
      </div>
    </div>
  );
}

function pendingTitle(effect: string): string {
  if (effect === "new-active") return "Choose your new Active";
  if (effect.includes("ready")) return "Choose a spent Minivan Character to ready";
  if (effect.includes("group-chat")) return "Choose a Character from your deck";
  if (effect.includes("carpool-character")) return "Choose a Character to add to the Minivan";
  if (effect.includes("good-vibes")) return "Choose Characters for Good Vibes";
  if (effect.includes("switch")) return "Choose a Character to switch in";
  return "Choose a Character";
}

function toggle(current: number[], uid: number, max: number): number[] {
  if (current.includes(uid)) return current.filter((x) => x !== uid);
  return current.length >= max ? [...current.slice(1), uid] : [...current, uid];
}

function ChoiceCards({ options, player, cardsById, cfg, selected, onToggle }: {
  options: number[]; player: PlayerState; cardsById: Map<string, AnyCard>; cfg: RulesConfig; selected: number[]; onToggle: (uid: number) => void;
}) {
  return <div className="my-3 flex flex-wrap justify-center gap-2">{options.map((uid) => {
    const p = player.hand.find((c) => c.uid === uid);
    const card = p && cardsById.get(p.cardId);
    return <button key={uid} onClick={() => onToggle(uid)} className={cn("rounded-card", selected.includes(uid) && "ring-2 ring-danger")}>
      {card ? <CardPreview card={card} cfg={cfg} width={92} /> : p?.name}
    </button>;
  })}</div>;
}

function ChoiceFighters({ player, options, selected, onToggle }: {
  player: PlayerState; options: number[]; selected: number[]; onToggle: (uid: number) => void;
}) {
  return <div className="my-3 flex flex-wrap justify-center gap-2">{options.map((uid) => {
    const c = [player.active, ...player.minivan].find((x) => x?.uid === uid);
    return <Button key={uid} variant={selected.includes(uid) ? "primary" : "secondary"} onClick={() => onToggle(uid)}>{c?.name ?? "Character"}</Button>;
  })}</div>;
}

function SetupView({ me, cardsById, cfg, onConfirm }: {
  me: PlayerState; cardsById: Map<string, AnyCard>; cfg: RulesConfig; onConfirm: (active: number, minivan: number[]) => void;
}) {
  const chars = useMemo(() => me.hand.filter((c): c is CharPile => c.kind === "char"), [me.hand]);
  const [active, setActive] = useState<number | null>(chars[0]?.uid ?? null);
  const [minivan, setMinivan] = useState<number[]>(() => chars.slice(1, 4).map((c) => c.uid));

  function choose(uid: number) {
    if (active === uid) {
      setActive(null);
      return;
    }
    if (minivan.includes(uid)) {
      setMinivan((v) => v.filter((x) => x !== uid));
      return;
    }
    if (active == null) setActive(uid);
    else if (minivan.length < cfg.deck.minivanMax) setMinivan((v) => [...v, uid]);
  }

  return (
    <div>
      <PageHeader title="Pack your Minivan" subtitle="Choose one Active, then up to three face-up Characters for your Minivan." />
      <div className="mb-4 rounded-card border border-line bg-surface p-4 text-sm">
        <span className="font-semibold">Active:</span> {chars.find((c) => c.uid === active)?.name ?? "Choose one"}
        <span className="ml-4 font-semibold">Minivan:</span> {minivan.length}/{cfg.deck.minivanMax}
      </div>
      <div className="flex flex-wrap gap-4">
        {chars.map((c) => {
          const card = cardsById.get(c.cardId);
          const role = active === c.uid ? "Active" : minivan.includes(c.uid) ? "Minivan" : "";
          return (
            <button key={c.uid} onClick={() => choose(c.uid)}
              className={cn("rounded-card p-1", role && "ring-2 ring-brand")}>
              {card ? <CardPreview card={card} cfg={cfg} width={145} /> : c.name}
              <div className="mt-1 text-xs font-semibold text-brand">{role || "In hand"}</div>
            </button>
          );
        })}
      </div>
      <Button className="mt-5" variant="primary" disabled={active == null}
        onClick={() => active != null && onConfirm(active, minivan)}>Start match</Button>
    </div>
  );
}

function EmptySlot({ label }: { label: string }) {
  return <div className="grid min-h-28 place-items-center rounded-card border border-dashed border-line bg-surface-2/40 text-xs text-muted">{label}</div>;
}
