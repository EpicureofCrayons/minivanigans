import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  Check,
  Inbox,
  Layers,
  Minus,
  Plus,
  Save,
  Search,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  validateDeck,
  fillDeck,
  type AnyCard,
  type CardType,
  type Deck,
  type RulesConfig,
} from "@minivanigans/rules-engine";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { Segmented } from "../components/ui/Segmented";
import { CardPreview } from "../components/CardPreview";
import { useLibrary } from "../store/useLibrary";
import { useProfile } from "../store/useProfile";
import { exportShare } from "../lib/share";
import { cn } from "../lib/cn";

type TypeFilter = "All" | CardType;

function blankDeck(): Deck {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), name: "New Deck", entries: [], createdAt: now, updatedAt: now };
}

/** Max copies allowed: a Moment's printed cap, else the chassis cap. */
function copyCap(card: AnyCard | undefined, cfg: RulesConfig): number {
  if (card?.type === "Support") {
    const def = cfg.supportEffects.find((e) => e.id === card.effectId);
    return def?.maxPerDeck ?? cfg.deck.maxCopiesByName;
  }
  return cfg.deck.maxCopiesByName;
}

export function DeckBuilder() {
  const cards = useLibrary((s) => s.cards);
  const cfg = useLibrary((s) => s.config);
  const decks = useLibrary((s) => s.decks);
  const upsertDeck = useLibrary((s) => s.upsertDeck);
  const removeDeck = useLibrary((s) => s.removeDeck);
  const profile = useProfile((s) => s.profile);

  const [deck, setDeck] = useState<Deck>(() => blankDeck());
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("All");
  const [dragId, setDragId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const result = useMemo(() => validateDeck(deck, cardsById, cfg), [deck, cardsById, cfg]);

  const inDeck = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of deck.entries) m.set(e.cardId, e.count);
    return m;
  }, [deck]);

  const filteredLibrary = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards
      .filter((c) => (type === "All" ? true : c.type === type))
      .filter((c) => (q ? c.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [cards, search, type]);

  function patchDeck(entries: Deck["entries"]) {
    setStatus(null);
    setDeck((d) => ({ ...d, entries, updatedAt: new Date().toISOString() }));
  }

  function fill() {
    const { entries, added } = fillDeck(deck, cardsById, cfg);
    patchDeck(entries);
    const v = validateDeck({ ...deck, entries }, cardsById, cfg);
    if (added === 0) {
      setStatus(v.ok ? "Deck is already complete." : "Couldn't fill — add more cards in the Card Builder first.");
    } else {
      const n = `${added} card${added === 1 ? "" : "s"}`;
      setStatus(v.ok ? `Filled ${n} — legal deck!` : `Added ${n}. Make a few more cards to finish the deck.`);
    }
  }

  function addCard(cardId: string) {
    const cap = copyCap(cardsById.get(cardId), cfg);
    const entries = deck.entries.slice();
    const i = entries.findIndex((e) => e.cardId === cardId);
    if (i >= 0) {
      if (entries[i]!.count >= cap) return; // copy cap
      entries[i] = { ...entries[i]!, count: entries[i]!.count + 1 };
    } else {
      entries.push({ cardId, count: 1 });
    }
    patchDeck(entries);
  }

  function setCount(cardId: string, count: number) {
    const cap = copyCap(cardsById.get(cardId), cfg);
    const clamped = Math.max(0, Math.min(cap, count));
    const entries = deck.entries
      .map((e) => (e.cardId === cardId ? { ...e, count: clamped } : e))
      .filter((e) => e.count > 0);
    patchDeck(entries);
  }

  function loadDeck(id: string) {
    const found = decks.find((d) => d.id === id);
    if (found) {
      setDeck(structuredClone(found));
      setStatus(null);
    }
  }

  async function save() {
    await upsertDeck(deck);
    setStatus("Saved.");
  }

  async function del() {
    if (!confirm(`Delete deck "${deck.name}"?`)) return;
    await removeDeck(deck.id);
    setDeck(blankDeck());
    setStatus(null);
  }

  async function shareDeck() {
    if (deck.entries.length === 0) return;
    const ids = new Set(deck.entries.map((e) => e.cardId));
    const deckCards = cards.filter((c) => ids.has(c.id));
    const favoriteCard = cards.find((c) => c.id === profile.favoriteCardId);
    await exportShare({
      cards: deckCards,
      decks: [deck],
      profile,
      favoriteCard,
      defaultName: `${deck.name || "deck"}.share.json`,
    });
  }

  function onDragStart(e: DragStartEvent) {
    setDragId(String(e.active.id));
  }
  function onDragEnd(e: DragEndEvent) {
    setDragId(null);
    if (e.over?.id === "deck-drop") addCard(String(e.active.id));
  }

  return (
    <div>
      <PageHeader
        title="Deck Builder"
        subtitle="Drag cards from your library into the deck. The legality panel checks every limit live."
        actions={
          <>
            <Button variant="secondary" onClick={() => { setDeck(blankDeck()); setStatus(null); }}>
              <Plus size={16} /> New deck
            </Button>
            <Button variant="secondary" onClick={fill} disabled={cards.length === 0} title="Intelligently complete the deck within the rules">
              <Sparkles size={16} /> Fill deck
            </Button>
            <Button variant="secondary" onClick={shareDeck} disabled={deck.entries.length === 0}>
              <Share2 size={16} /> Share deck
            </Button>
            <Button variant="primary" onClick={save}>
              <Save size={16} /> Save deck
            </Button>
          </>
        }
      />

      {/* Deck identity bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          className="min-w-[14rem] flex-1 rounded-card border border-line bg-surface px-3 py-2 text-lg font-semibold text-fg outline-none focus:border-brand"
          value={deck.name}
          onChange={(e) => { setDeck((d) => ({ ...d, name: e.target.value })); setStatus(null); }}
          placeholder="Deck name"
        />
        {decks.length > 0 && (
          <select
            className="rounded-card border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-brand"
            value={decks.some((d) => d.id === deck.id) ? deck.id : ""}
            onChange={(e) => e.target.value && loadDeck(e.target.value)}
          >
            <option value="">Open a saved deck…</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
        {decks.some((d) => d.id === deck.id) && (
          <Button variant="ghost" onClick={del}><Trash2 size={16} /> Delete</Button>
        )}
        {status && <span aria-live="polite" className="text-sm text-success">{status}</span>}
      </div>

      {cards.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-surface/40 px-6 py-12 text-center text-sm text-muted">
          You have no cards yet. Make some in the Card Builder first — they'll appear here to drag into a deck.
        </p>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_minmax(220px,260px)]">
            {/* Library panel */}
            <Panel title="Library" count={filteredLibrary.length}>
              <div className="mb-3 space-y-2">
                <div className="relative">
                  <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    data-search
                    className="w-full rounded-card border border-line bg-surface py-1.5 pl-8 pr-2 text-sm outline-none focus:border-brand"
                    placeholder="Search cards…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Segmented
                  options={["All", "Character", "Support"] as TypeFilter[]}
                  labels={{ All: "All", Character: "Characters", Support: "Moments" }}
                  value={type}
                  onChange={setType}
                />
              </div>
              <div
                className="grid justify-center gap-3"
                style={{ gridTemplateColumns: `repeat(auto-fill, ${THUMB_W}px)` }}
              >
                {filteredLibrary.map((card) => (
                  <LibraryCard
                    key={card.id}
                    card={card}
                    cfg={cfg}
                    inDeck={inDeck.get(card.id) ?? 0}
                    atCap={(inDeck.get(card.id) ?? 0) >= copyCap(card, cfg)}
                    onAdd={() => addCard(card.id)}
                  />
                ))}
                {filteredLibrary.length === 0 && (
                  <p className="col-span-full py-6 text-center text-sm text-muted">No cards match.</p>
                )}
              </div>
            </Panel>

            {/* Deck panel (drop zone) */}
            <DeckPanel
              deck={deck}
              cardsById={cardsById}
              cfg={cfg}
              total={result.counts.total}
              onInc={(id) => addCard(id)}
              onDec={(id) => setCount(id, (inDeck.get(id) ?? 0) - 1)}
              onRemove={(id) => setCount(id, 0)}
            />

            {/* Legality panel */}
            <div className="lg:sticky lg:top-4 lg:self-start">
              <LegalityPanel result={result} cfg={cfg} />
            </div>
          </div>

          <DragOverlay>
            {dragId && cardsById.get(dragId) ? (
              <div className="rotate-3 drop-shadow-xl">
                <CardPreview card={cardsById.get(dragId)!} cfg={cfg} width={THUMB_W} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

function Panel({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface-2 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-semibold text-fg">{title}</h2>
        {count !== undefined && <span className="text-xs text-muted">{count}</span>}
      </div>
      {children}
    </section>
  );
}

/** Width of a card thumbnail in both panels. */
const THUMB_W = 108;

/** A draggable library card thumbnail with an Add affordance + in-deck badge. */
function LibraryCard({
  card,
  cfg,
  inDeck,
  atCap,
  onAdd,
}: {
  card: AnyCard;
  cfg: RulesConfig;
  inDeck: number;
  atCap: boolean;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative cursor-grab rounded-[14px] transition active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
      title={`Drag, or use +, to add ${card.name || "card"}`}
    >
      <CardPreview card={card} cfg={cfg} width={THUMB_W} />
      {inDeck > 0 && (
        <span className="absolute -left-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-brand-fg shadow">
          ×{inDeck}
        </span>
      )}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onAdd}
        disabled={atCap}
        className={cn(
          "absolute inset-x-1.5 bottom-1.5 flex items-center justify-center gap-1 rounded-md py-1 text-xs font-semibold shadow backdrop-blur transition",
          atCap
            ? "bg-surface-2/90 text-muted"
            : "bg-brand/90 text-brand-fg opacity-0 group-hover:opacity-100"
        )}
      >
        {atCap ? "Max" : <><Plus size={13} /> Add</>}
      </button>
    </div>
  );
}

function DeckPanel({
  deck,
  cardsById,
  cfg,
  total,
  onInc,
  onDec,
  onRemove,
}: {
  deck: Deck;
  cardsById: Map<string, AnyCard>;
  cfg: RulesConfig;
  total: number;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "deck-drop" });

  const groups: { label: string; type: CardType }[] = [
    { label: "Characters", type: "Character" },
    { label: "Moments", type: "Support" },
  ];

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "rounded-card border-2 bg-surface-2 p-4 transition",
        isOver ? "border-brand bg-brand/5" : "border-dashed border-line"
      )}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-semibold text-fg">Deck</h2>
        <span className="text-xs text-muted">{total} / {cfg.deck.size.min}–{cfg.deck.size.max}</span>
      </div>

      {deck.entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line py-14 text-center text-muted">
          <Inbox size={28} strokeWidth={1.5} />
          <p className="text-sm">Drag cards here, or use the + buttons.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ label, type }) => {
            const rows = deck.entries
              .map((e) => ({ card: cardsById.get(e.cardId), count: e.count }))
              .filter((r): r is { card: AnyCard; count: number } => !!r.card && r.card.type === type);
            if (rows.length === 0) return null;
            return (
              <div key={type}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {label} · {rows.reduce((n, r) => n + r.count, 0)}
                </div>
                <div
                  className="grid justify-center gap-3"
                  style={{ gridTemplateColumns: `repeat(auto-fill, ${THUMB_W}px)` }}
                >
                  {rows.map(({ card, count }) => (
                    <DeckCard
                      key={card.id}
                      card={card}
                      cfg={cfg}
                      count={count}
                      onInc={() => onInc(card.id)}
                      onDec={() => onDec(card.id)}
                      onRemove={() => onRemove(card.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Stepper({ icon: Icon, onClick, disabled, label }: { icon: typeof Plus; onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-6 w-6 place-items-center rounded bg-surface-2 text-fg transition hover:bg-line disabled:opacity-30"
    >
      <Icon size={13} />
    </button>
  );
}

/** A card thumbnail inside the deck, with a copy-count badge and +/−/remove. */
function DeckCard({
  card,
  cfg,
  count,
  onInc,
  onDec,
  onRemove,
}: {
  card: AnyCard;
  cfg: RulesConfig;
  count: number;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative">
      <CardPreview card={card} cfg={cfg} width={THUMB_W} />
      <span className="absolute -left-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-brand-fg shadow">
        ×{count}
      </span>
      <button
        onClick={onRemove}
        aria-label={`Remove ${card.name || "card"}`}
        className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-line bg-surface text-muted shadow transition hover:text-danger"
      >
        <X size={12} />
      </button>
      <div className="mt-1.5 flex items-center justify-center gap-1.5">
        <Stepper icon={Minus} label={`Remove one ${card.name || "card"}`} onClick={onDec} />
        <span className="w-4 text-center text-sm font-semibold tabular-nums">{count}</span>
        <Stepper
          icon={Plus}
          label={`Add one ${card.name || "card"}`}
          disabled={count >= copyCap(card, cfg)}
          onClick={onInc}
        />
      </div>
    </div>
  );
}

function LegalityPanel({
  result,
  cfg,
}: {
  result: ReturnType<typeof validateDeck>;
  cfg: RulesConfig;
}) {
  const c = result.counts;
  const d = cfg.deck;
  const range = (m: { min: number; max: number }) => (m.min === m.max ? `${m.min}` : `${m.min}–${m.max}`);
  const rows = [
    { label: "Total", value: c.total, ok: c.total >= d.size.min && c.total <= d.size.max, target: range(d.size) },
    { label: "Characters", value: c.character, ok: c.character >= d.character.min && c.character <= d.character.max, target: range(d.character) },
    { label: "Moments", value: c.support, ok: c.support >= d.support.min && c.support <= d.support.max, target: range(d.support) },
  ];

  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div
        className={cn(
          "mb-3 flex items-center gap-2 rounded-card px-3 py-2 text-sm font-semibold",
          result.ok ? "bg-success/15 text-success" : "bg-danger/10 text-danger"
        )}
      >
        {result.ok ? <Check size={16} /> : <Layers size={16} />}
        {result.ok ? "Legal deck — ready to play" : "Not legal yet"}
      </div>

      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", r.ok ? "bg-success" : "bg-danger")} />
              <span className="text-fg">{r.label}</span>
            </span>
            <span className={cn("tabular-nums", r.ok ? "text-muted" : "text-danger font-semibold")}>
              {r.value} <span className="text-muted">/ {r.target}</span>
            </span>
          </li>
        ))}
      </ul>

      {result.errors.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-line pt-3">
          {result.errors.map((e) => (
            <li key={e} className="text-xs text-danger">{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
