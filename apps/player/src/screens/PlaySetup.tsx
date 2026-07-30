import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Swords } from "lucide-react";
import type { Difficulty, PlayerId } from "@minivanigans/rules-engine";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { Button } from "../components/ui/Button";
import { Segmented } from "../components/ui/Segmented";
import { useLibrary } from "../store/useLibrary";
import { useMatch } from "../store/useMatch";

const selectCls =
  "w-full rounded-card border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-brand";

export function PlaySetup() {
  const navigate = useNavigate();
  const cards = useLibrary((s) => s.cards);
  const decks = useLibrary((s) => s.decks);
  const cfg = useLibrary((s) => s.config);
  const start = useMatch((s) => s.start);
  const restore = useMatch((s) => s.restore);
  const inProgress = useMatch((s) => s.game && !s.game.winner);

  // After an app restart, rehydrate any checkpointed match so the Resume
  // banner appears (restore() is a no-op when a match is already live).
  useEffect(() => {
    restore();
  }, [restore]);

  const [yourDeckId, setYourDeckId] = useState(decks[0]?.id ?? "");
  const [botDeckId, setBotDeckId] = useState(decks[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [firstGame, setFirstGame] = useState(false);

  // The starter deck seeds asynchronously on first launch, after this mounts —
  // so default the selectors once decks become available.
  useEffect(() => {
    if (!decks[0]) return;
    setYourDeckId((id) => id || decks[0]!.id);
    setBotDeckId((id) => id || decks[0]!.id);
  }, [decks]);

  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  function play() {
    const yours = decks.find((d) => d.id === yourDeckId);
    const theirs = decks.find((d) => d.id === botDeckId);
    if (!yours || !theirs) return;
    useMatch.getState().clear();
    start(
      {
        decks: { p0: yours, p1: theirs } as Record<PlayerId, typeof yours>,
        cards: cardsById,
        cfg,
        difficulty,
        names: { p0: "You", p1: "Bot" },
        firstGame,
      },
      Date.now()
    );
    navigate("/play/match");
  }

  if (decks.length === 0) {
    return (
      <div>
        <PageHeader title="Play vs Bot" subtitle="Practice the game and test your decks against the computer." />
        <EmptyState
          icon={Layers}
          title="Build a deck first"
          description="You need at least one saved deck to play. Pop over to the Deck Builder, then come back."
          action={
            <Button variant="primary" onClick={() => navigate("/decks")}>
              <Layers size={16} /> Go to Deck Builder
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Play vs Bot"
        subtitle="Pick your deck and an opponent deck, then battle the computer. A great way to learn the game or test a build."
      />

      <div className="max-w-md space-y-5">
        {inProgress && (
          <div className="flex items-center justify-between gap-3 rounded-card border border-brand/40 bg-brand/10 px-4 py-3">
            <span className="text-sm font-medium text-fg">You have a match in progress.</span>
            <Button variant="primary" onClick={() => navigate("/play/match")}>
              <Swords size={16} /> Resume
            </Button>
          </div>
        )}

        <Field label="Your deck">
          <select className={selectCls} value={yourDeckId} onChange={(e) => setYourDeckId(e.target.value)}>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Opponent deck" hint="Can be the same deck for a mirror match.">
          <select className={selectCls} value={botDeckId} onChange={(e) => setBotDeckId(e.target.value)}>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Difficulty">
          <Segmented
            options={["easy", "normal"] as Difficulty[]}
            labels={{ easy: "Easy", normal: "Normal" }}
            value={difficulty}
            onChange={setDifficulty}
          />
        </Field>

        <Field label="First Game Mode" hint="For brand-new or very young players.">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-fg">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--brand)]"
              checked={firstGame}
              onChange={(e) => setFirstGame(e.target.checked)}
            />
            3 Characters · no deck or Moments · first to 2 KO Stars
          </label>
        </Field>

        <Button variant="primary" onClick={play} disabled={!yourDeckId || !botDeckId}>
          <Swords size={16} /> Start match
        </Button>

        <p className="text-xs text-muted">
          Each turn: ready your Minivan, draw, then take an Action for an Everyday Move—or
          pass to use a ready Shift Move. First to {cfg.rules.winKnockouts} KO Stars wins.
        </p>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-fg">{label}</label>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
