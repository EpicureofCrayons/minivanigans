import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  Download,
  ImageDown,
  Layers,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import {
  canAddCardToDeck,
  type AnyCard,
  type CardType,
  type Deck,
  type RulesConfig,
} from "@minivanigans/rules-engine";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { Button } from "../components/ui/Button";
import { Segmented } from "../components/ui/Segmented";
import { CardPreview } from "../components/CardPreview";
import { useLibrary } from "../store/useLibrary";
import { useProfile } from "../store/useProfile";
import { exportBackup } from "../lib/backup";
import { exportShare } from "../lib/share";
import { exportCardPng } from "../lib/exportImage";
import { cn } from "../lib/cn";

type TypeFilter = "All" | CardType;

const TILE_W = 168;

export function CardLibrary() {
  const navigate = useNavigate();
  const cards = useLibrary((s) => s.cards);
  const decks = useLibrary((s) => s.decks);
  const cfg = useLibrary((s) => s.config);
  const removeCard = useLibrary((s) => s.removeCard);
  const upsertDeck = useLibrary((s) => s.upsertDeck);
  const profile = useProfile((s) => s.profile);

  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("All");
  const [sharedOnly, setSharedOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<AnyCard | null>(null);

  const hasShared = useMemo(() => cards.some((c) => c.sharedBy), [cards]);
  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  async function addCardToDeck(deck: Deck, card: AnyCard) {
    const entries = deck.entries.slice();
    const i = entries.findIndex((e) => e.cardId === card.id);
    if (i >= 0) entries[i] = { ...entries[i], count: entries[i].count + 1 };
    else entries.push({ cardId: card.id, count: 1 });
    await upsertDeck({ ...deck, entries, updatedAt: new Date().toISOString() });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards
      .filter((c) => (type === "All" ? true : c.type === type))
      .filter((c) => (sharedOnly ? !!c.sharedBy : true))
      .filter((c) => (q ? matchesSearch(c, q, cfg) : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [cards, search, type, sharedOnly, cfg]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDelete(card: AnyCard): Promise<boolean> {
    const usedIn = decks.filter((d) => d.entries.some((e) => e.cardId === card.id)).length;
    const usage = usedIn > 0 ? ` It's used in ${usedIn} deck${usedIn === 1 ? "" : "s"} — it will be removed from ${usedIn === 1 ? "it" : "them"} too.` : "";
    if (!confirm(`Delete "${card.name || "this card"}"?${usage} This can't be undone.`)) return false;
    await removeCard(card.id);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(card.id);
      return next;
    });
    return true;
  }

  async function shareOne(card: AnyCard) {
    const favoriteCard = cards.find((c) => c.id === profile.favoriteCardId);
    await exportShare({
      cards: [card],
      profile,
      favoriteCard,
      defaultName: `minivanigans-${(card.name || "card").replace(/\s+/g, "-").toLowerCase()}.json`,
    });
  }

  async function exportSelected() {
    const picked = cards.filter((c) => selected.has(c.id));
    await exportBackup(
      { cards: picked, decks: [], config: null },
      null,
      `minivanigans-cards-${picked.length}.json`
    );
  }

  async function shareSelected() {
    const picked = cards.filter((c) => selected.has(c.id));
    if (picked.length === 0) return;
    const favoriteCard = cards.find((c) => c.id === profile.favoriteCardId);
    await exportShare({
      cards: picked,
      profile,
      favoriteCard,
      defaultName: `minivanigans-share-${picked.length}.json`,
    });
  }

  async function deleteSelected() {
    if (!confirm(`Delete ${selected.size} selected card(s)? This can't be undone.`)) return;
    for (const id of selected) await removeCard(id);
    setSelected(new Set());
  }

  return (
    <div>
      <PageHeader
        title="Card Library"
        subtitle="Every card you've made. Click a card to view it, then edit or add it to a deck."
        actions={
          <Button variant="primary" onClick={() => navigate("/builder")}>
            <Plus size={16} /> New Card
          </Button>
        }
      />

      {cards.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No cards yet"
          description="Create your first card in the Card Builder — it'll show up here."
          action={
            <Button variant="primary" onClick={() => navigate("/builder")}>
              <Plus size={16} /> Create a card
            </Button>
          }
        />
      ) : (
        <>
          {/* Toolbar: search + filters */}
          <div className="mb-5 space-y-3">
            <div className="relative max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                data-search
                className="w-full rounded-card border border-line bg-surface py-2 pl-9 pr-3 text-sm text-fg outline-none placeholder:text-muted focus:border-brand"
                placeholder="Search by name, chassis, or move…   ( / )"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <FilterRow label="Type">
                <Segmented
                  options={["All", "Character", "Support"] as TypeFilter[]}
                  labels={{ All: "All", Character: "Characters", Support: "Moments" }}
                  value={type}
                  onChange={setType}
                />
              </FilterRow>
              {hasShared && (
                <button
                  onClick={() => setSharedOnly((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-card border px-2.5 py-1 text-xs font-medium transition",
                    sharedOnly
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-line text-muted hover:text-fg"
                  )}
                >
                  <Share2 size={13} /> Shared with me
                </button>
              )}
            </div>
          </div>

          {/* Bulk-selection bar */}
          {selected.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-card border border-brand/40 bg-surface px-4 py-2.5 shadow-[var(--shadow-soft)]">
              <span className="text-sm font-medium text-fg">{selected.size} selected</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button variant="primary" onClick={shareSelected}>
                  <Share2 size={16} /> Share
                </Button>
                <Button variant="secondary" onClick={exportSelected}>
                  <Download size={16} /> Export
                </Button>
                <Button variant="danger" onClick={deleteSelected}>
                  <Trash2 size={16} /> Delete
                </Button>
                <Button variant="ghost" onClick={() => setSelected(new Set())}>
                  <X size={16} /> Clear
                </Button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">No cards match those filters.</p>
          ) : (
            <div
              className="grid gap-x-5 gap-y-6"
              style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${TILE_W}px, 1fr))` }}
            >
              {filtered.map((card, i) => (
                <CardTile
                  key={card.id}
                  card={card}
                  cfg={cfg}
                  index={i}
                  selected={selected.has(card.id)}
                  onToggle={() => toggle(card.id)}
                  onOpen={() => setViewing(card)}
                  onDelete={() => handleDelete(card)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {viewing && (
        <CardViewModal
          card={viewing}
          cfg={cfg}
          decks={decks}
          cardsById={cardsById}
          onClose={() => setViewing(null)}
          onEdit={() => navigate(`/builder/${viewing.id}`)}
          onAddToDeck={addCardToDeck}
          onNewDeck={() => navigate("/decks")}
          onShare={() => shareOne(viewing)}
          onDelete={async () => {
            if (await handleDelete(viewing)) setViewing(null);
          }}
        />
      )}
    </div>
  );
}

function CardViewModal({
  card,
  cfg,
  decks,
  cardsById,
  onClose,
  onEdit,
  onAddToDeck,
  onNewDeck,
  onShare,
  onDelete,
}: {
  card: AnyCard;
  cfg: RulesConfig;
  decks: Deck[];
  cardsById: Map<string, AnyCard>;
  onClose: () => void;
  onEdit: () => void;
  onAddToDeck: (deck: Deck, card: AnyCard) => Promise<void>;
  onNewDeck: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const [deckId, setDeckId] = useState(decks[0]?.id ?? "");
  const [status, setStatus] = useState<
    { kind: "ok" | "error"; text: string; reasons?: string[] } | null
  >(null);
  const [exporting, setExporting] = useState(false);

  async function exportPng() {
    setExporting(true);
    try {
      const result = await exportCardPng(card, cfg);
      if (result === "saved") setStatus({ kind: "ok", text: "Saved card image." });
    } catch (err) {
      setStatus({ kind: "error", text: `Couldn't export image: ${String(err)}` });
    } finally {
      setExporting(false);
    }
  }

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const deck = decks.find((d) => d.id === deckId);
  /** How many copies of this card sit in each deck. */
  const countInDeck = (d: Deck) =>
    d.entries.find((e) => e.cardId === card.id)?.count ?? 0;
  const inDecksCount = decks.filter((d) => countInDeck(d) > 0).length;

  async function send() {
    if (!deck) return;
    const check = canAddCardToDeck(deck, card, cardsById, cfg);
    if (!check.ok) {
      setStatus({ kind: "error", text: `Can't add to "${deck.name}":`, reasons: check.reasons });
      return;
    }
    await onAddToDeck(deck, card);
    setStatus({ kind: "ok", text: `Added to "${deck.name}".` });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-pop relative w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-[var(--shadow-soft)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center">
          <CardPreview card={card} cfg={cfg} width={260} />
          <h2 className="mt-3 text-center font-display text-lg font-semibold text-fg">
            {card.name || "Untitled"}
          </h2>
          {card.sharedBy && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-brand">
              <Share2 size={11} /> Shared by {card.sharedBy}
            </div>
          )}
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onEdit}>
              <Pencil size={16} /> Edit
            </Button>
            <Button variant="secondary" className="flex-1" onClick={onShare}>
              <Share2 size={16} /> Share
            </Button>
            <Button variant="danger" onClick={onDelete} aria-label="Delete card">
              <Trash2 size={16} />
            </Button>
          </div>

          <Button variant="secondary" className="w-full" onClick={exportPng} disabled={exporting}>
            <ImageDown size={16} /> {exporting ? "Exporting…" : "Export PNG"}
          </Button>

          <div className="rounded-card border border-line bg-surface-2/40 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-fg">
              <Layers size={15} /> Add to a deck
              {inDecksCount > 0 && (
                <span className="ml-auto text-xs font-normal text-muted">
                  in {inDecksCount} {inDecksCount === 1 ? "deck" : "decks"}
                </span>
              )}
            </div>
            {decks.length === 0 ? (
              <div className="text-sm text-muted">
                You haven't made any decks yet.{" "}
                <button onClick={onNewDeck} className="font-medium text-brand hover:underline">
                  Create one
                </button>
                .
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  className="min-w-0 flex-1 rounded-card border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-brand"
                  value={deckId}
                  onChange={(e) => {
                    setDeckId(e.target.value);
                    setStatus(null);
                  }}
                >
                  {decks.map((d) => {
                    const n = countInDeck(d);
                    return (
                      <option key={d.id} value={d.id}>
                        {d.name}
                        {n > 0 ? ` — ${n} in deck` : ""}
                      </option>
                    );
                  })}
                </select>
                <Button variant="primary" onClick={send}>
                  <Plus size={16} /> Add
                </Button>
              </div>
            )}

            {status && (
              <div
                className={cn(
                  "mt-2.5 rounded-card px-3 py-2 text-sm",
                  status.kind === "ok"
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger"
                )}
              >
                <div className="flex items-center gap-1.5 font-medium">
                  {status.kind === "ok" ? <Check size={14} /> : <AlertTriangle size={14} />}
                  {status.text}
                </div>
                {status.reasons && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                    {status.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardTile({
  card,
  cfg,
  index,
  selected,
  onToggle,
  onOpen,
  onDelete,
}: {
  card: AnyCard;
  cfg: ReturnType<typeof useLibrary.getState>["config"];
  index: number;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="animate-rise group relative flex flex-col items-center"
      style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}
    >
      <button
        onClick={onOpen}
        className={cn(
          "block rounded-[18px] outline-none transition duration-200 will-change-transform hover:-translate-y-1 hover:drop-shadow-lg focus-visible:ring-2 focus-visible:ring-brand",
          selected && "ring-2 ring-brand ring-offset-2 ring-offset-bg"
        )}
        title={`View ${card.name || "card"}`}
      >
        <CardPreview card={card} cfg={cfg} width={TILE_W} />
      </button>

      {/* Select checkbox */}
      <button
        onClick={onToggle}
        aria-label={selected ? "Deselect" : "Select"}
        className={cn(
          "absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-md border transition",
          selected
            ? "border-brand bg-brand text-brand-fg"
            : "border-line bg-surface/90 text-transparent opacity-0 group-hover:opacity-100"
        )}
      >
        <Check size={14} />
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        aria-label="Delete card"
        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md border border-line bg-surface/90 text-muted opacity-0 transition hover:text-danger group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>

      <div className="mt-2 max-w-full truncate text-center text-xs text-muted" title={card.name}>
        {card.name || "Untitled"}
      </div>
      {card.sharedBy && (
        <div className="mt-0.5 flex max-w-full items-center gap-1 truncate text-[10px] text-brand" title={`Shared by ${card.sharedBy}`}>
          <Share2 size={10} /> {card.sharedBy}
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
    </div>
  );
}

/** Match a card against a lowercased query across its visible text fields. */
function matchesSearch(card: AnyCard, q: string, cfg: RulesConfig): boolean {
  const parts = [card.name];
  if (card.type === "Character") {
    parts.push(card.attack.name, card.abilityFlavorName ?? "", card.abilityId);
    // Chassis is the primary v4.1 build axis — "the tank" should find Tank cards.
    const chassis = cfg.presets.find((p) => p.id === card.chassisId);
    if (chassis) parts.push(chassis.displayName, chassis.id);
  } else if (card.type === "Support") {
    parts.push(card.effectFlavorName ?? "", card.effectId);
  }
  return parts.join(" ").toLowerCase().includes(q);
}
