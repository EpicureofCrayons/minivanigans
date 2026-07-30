import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Crosshair, Minus, Plus, Printer } from "lucide-react";
import {
  validateDeck,
  type AnyCard,
  type RulesConfig,
} from "@minivanigans/rules-engine";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { Button } from "../components/ui/Button";
import { Segmented } from "../components/ui/Segmented";
import { Toggle } from "../components/ui/Toggle";
import { CardPreview } from "../components/CardPreview";
import { PrintInstructions } from "../components/PrintInstructions";
import { useLibrary } from "../store/useLibrary";
import {
  usePrintPrefs,
  PAPER_PX,
  LAYOUTS,
  type CardLayout,
  type PaperSize,
  type InstructionsPosition,
} from "../store/usePrintPrefs";
import { usePrinterProfiles } from "../store/usePrinterProfiles";
import { offsetPx, gridTransform } from "../lib/printerOffset";
import { cn } from "../lib/cn";
import { openPrintDialog } from "../lib/print";

const DOUBLE_SIDED_FRONT_TEXT =
  "Double-sided cards: print these fronts, then reload the sheets, flip them left-to-right " +
  "(like turning a book page), and print matching Card Backs. Keep print scale at 100% (Actual size).";

const PREVIEW_TARGET_W = 440; // px the on-screen page preview aims for

type Source = "deck" | "all" | "pick";

export function PrintExport() {
  const cards = useLibrary((s) => s.cards);
  const decks = useLibrary((s) => s.decks);
  const cfg = useLibrary((s) => s.config);
  const prefs = usePrintPrefs();
  const navigate = useNavigate();
  const printers = usePrinterProfiles((s) => s.profiles);
  const activePrinterId = usePrinterProfiles((s) => s.activeId);
  const setActivePrinter = usePrinterProfiles((s) => s.setActive);
  const activePrinter = printers.find((p) => p.id === activePrinterId) ?? null;
  const front = offsetPx(activePrinter, "front");

  const [source, setSource] = useState<Source>(decks.length > 0 ? "deck" : "all");
  const [deckId, setDeckId] = useState<string>(decks[0]?.id ?? "");
  const [qty, setQty] = useState<Map<string, number>>(new Map());

  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const selectedDeck = decks.find((d) => d.id === deckId);

  // Expand the chosen source into a flat list of cards to print (with repeats).
  const printList = useMemo<AnyCard[]>(() => {
    if (source === "all") return cards;
    if (source === "pick") {
      const out: AnyCard[] = [];
      for (const [id, n] of qty) {
        const card = cardsById.get(id);
        if (card) for (let i = 0; i < n; i++) out.push(card);
      }
      return out;
    }
    // deck
    if (!selectedDeck) return [];
    const out: AnyCard[] = [];
    for (const e of selectedDeck.entries) {
      const card = cardsById.get(e.cardId);
      if (card) for (let i = 0; i < e.count; i++) out.push(card);
    }
    return out;
  }, [source, cards, qty, cardsById, selectedDeck]);

  const perPage = LAYOUTS[prefs.layout].perPage;
  const pages = useMemo(() => chunk(printList, perPage), [printList, perPage]);
  const deckLegality = selectedDeck
    ? validateDeck(selectedDeck, cardsById, cfg)
    : null;

  const paper = PAPER_PX[prefs.paper];
  const scale = PREVIEW_TARGET_W / paper.w;
  // 3×3 fills the page (≈0.25″ margins) — there's no room for the how-to strip.
  const showInstructions = prefs.printInstructions && prefs.layout !== "3x3";

  function bumpQty(id: string, delta: number) {
    setQty((prev) => {
      const next = new Map(prev);
      const v = Math.max(0, (next.get(id) ?? 0) + delta);
      v === 0 ? next.delete(id) : next.set(id, v);
      return next;
    });
  }

  if (cards.length === 0) {
    return (
      <div>
        <PageHeader title="Print / Export" subtitle="Lay cards out at exactly 2.5″ × 3.5″ with cut guides." />
        <EmptyState
          icon={Printer}
          title="Nothing to print yet"
          description="Create some cards first — then come back to lay them out and print or save a PDF."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Print / Export"
        subtitle={`Lay cards out at exactly 2.5″ × 3.5″, ${perPage} per page, with cut guides — print or save as PDF.${prefs.layout === "3x3" ? " An 18-card deck fits on exactly 2 sheets." : ""}`}
        actions={
          <Button variant="primary" onClick={() => void openPrintDialog()} disabled={printList.length === 0}>
            <Printer size={16} /> Print / Save PDF
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[300px_1fr] print:block">
        {/* ---- Controls (hidden when printing) ---- */}
        <div className="no-print space-y-5">
          <div>
            <div className="mb-1.5 text-sm font-medium text-fg">What to print</div>
            <Segmented
              options={["deck", "all", "pick"] as Source[]}
              labels={{ deck: "A deck", all: "All cards", pick: "Pick cards" }}
              value={source}
              onChange={setSource}
            />
          </div>

          {source === "deck" && (
            <div>
              <div className="mb-1.5 text-sm font-medium text-fg">Deck</div>
              {decks.length === 0 ? (
                <p className="text-sm text-muted">You haven't saved any decks yet.</p>
              ) : (
                <select
                  className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-brand"
                  value={deckId}
                  onChange={(e) => setDeckId(e.target.value)}
                >
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )}
              {deckLegality && !deckLegality.ok && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-warning">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  This deck isn't legal yet — you can still print it as a draft.
                </p>
              )}
            </div>
          )}

          {source === "pick" && (
            <div>
              <div className="mb-1.5 text-sm font-medium text-fg">
                Choose cards & copies
              </div>
              <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                {cards.map((card) => {
                  const n = qty.get(card.id) ?? 0;
                  return (
                    <div
                      key={card.id}
                      className={cn(
                        "flex items-center gap-2 rounded-card border border-line bg-surface px-2.5 py-1.5",
                        n > 0 && "border-brand/40"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-fg">
                        {card.name || "Untitled"}
                      </span>
                      <button
                        onClick={() => bumpQty(card.id, -1)}
                        className="grid h-6 w-6 place-items-center rounded bg-surface-2 hover:bg-line disabled:opacity-30"
                        disabled={n === 0}
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold tabular-nums">{n}</span>
                      <button
                        onClick={() => bumpQty(card.id, 1)}
                        className="grid h-6 w-6 place-items-center rounded bg-surface-2 hover:bg-line"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Page options */}
          <div className="space-y-3 rounded-card border border-line bg-surface p-4">
            <div className="text-sm font-semibold text-fg">Page options</div>
            <div>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Paper</div>
              <Segmented
                options={["letter", "a4"] as PaperSize[]}
                labels={{ letter: "Letter", a4: "A4" }}
                value={prefs.paper}
                onChange={prefs.setPaper}
              />
            </div>
            <div>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Cards per page</div>
              <Segmented
                options={["3x3", "3x2"] as CardLayout[]}
                labels={{ "3x3": "9 (3×3)", "3x2": "6 (3×2)" }}
                value={prefs.layout}
                onChange={prefs.setLayout}
              />
              <p className="mt-1 text-xs text-muted">
                {prefs.layout === "3x3"
                  ? "A deck on 2 sheets. Margins are ~0.25″ — if your printer clips the edges, switch to 6."
                  : "Safe margins on any printer; a deck takes 3 sheets."}
                {" "}Backs and the calibration sheet use the same grid automatically.
              </p>
            </div>
            <Toggle label="Cut guides" checked={prefs.cutGuides} onChange={prefs.setCutGuides} />
            <Toggle label="Spacing for cutting (bleed)" checked={prefs.bleed} onChange={prefs.setBleed} />
            {prefs.layout === "3x3" ? (
              <p className="text-xs text-muted">
                The double-sided how-to strip is off in 3×3 — there's no margin left for it.
              </p>
            ) : (
              <>
                <Toggle
                  label="Double-sided instructions"
                  checked={prefs.printInstructions}
                  onChange={prefs.setPrintInstructions}
                />
                {prefs.printInstructions && (
                  <Segmented
                    options={["top", "bottom"] as InstructionsPosition[]}
                    labels={{ top: "Top", bottom: "Bottom" }}
                    value={prefs.instructionsPosition}
                    onChange={prefs.setInstructionsPosition}
                  />
                )}
              </>
            )}
            <div className="border-t border-line pt-3">
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Printer alignment</div>
              {printers.length === 0 ? (
                <button
                  className="flex items-center gap-1.5 text-sm text-brand underline-offset-2 hover:underline"
                  onClick={() => navigate("/calibrate")}
                >
                  <Crosshair size={14} /> Set up a printer…
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    className="min-w-0 flex-1 rounded-card border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-brand"
                    value={activePrinterId ?? ""}
                    onChange={(e) => setActivePrinter(e.target.value || null)}
                  >
                    <option value="">No alignment</option>
                    {printers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-card bg-surface-2 text-muted hover:text-fg"
                    title="Printer setup"
                    onClick={() => navigate("/calibrate")}
                  >
                    <Crosshair size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-muted">
            {printList.length} card{printList.length === 1 ? "" : "s"} ·{" "}
            {pages.length} page{pages.length === 1 ? "" : "s"}
            <br />
            <span className="text-xs">
              In the print dialog, choose “Save as PDF” to export. Set scale to 100% / “Actual size”.
            </span>
          </p>
        </div>

        {/* ---- Live print preview ---- */}
        <div>
          {printList.length === 0 ? (
            <p className="rounded-card border border-dashed border-line py-16 text-center text-sm text-muted">
              Nothing selected to print yet.
            </p>
          ) : (
            <div className="print-area">
              {/* Dynamic page size for the print job. */}
              <style>{`@page { size: ${prefs.paper}; margin: 0; }`}</style>
              {pages.map((pageCards, i) => (
                <div
                  key={i}
                  className="print-frame mx-auto mb-6 overflow-hidden rounded-md"
                  style={{ width: paper.w * scale, height: paper.h * scale }}
                >
                  <div
                    className="print-page card-sheet bg-white"
                    style={{
                      position: "relative",
                      width: paper.w,
                      height: paper.h,
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 10px rgb(0 0 0 / 0.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 2.5in)",
                        gridAutoRows: "3.5in",
                        gap: prefs.bleed ? "0.12in" : "0",
                        transform: gridTransform(front.dx, front.dy),
                      }}
                    >
                      {pageCards.map((card, j) => (
                        <div
                          key={j}
                          style={{
                            width: "2.5in",
                            height: "3.5in",
                            display: "grid",
                            placeItems: "center",
                            outline: prefs.cutGuides ? "0.5pt solid #999" : "none",
                            outlineOffset: "-0.5pt",
                          }}
                        >
                          <CardPreview card={card} cfg={cfg as RulesConfig} width={240} />
                        </div>
                      ))}
                    </div>
                    {showInstructions && (
                      <PrintInstructions
                        text={DOUBLE_SIDED_FRONT_TEXT}
                        position={prefs.instructionsPosition}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
