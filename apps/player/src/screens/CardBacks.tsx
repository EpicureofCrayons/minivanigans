import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crosshair, Printer } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { Segmented } from "../components/ui/Segmented";
import { Toggle } from "../components/ui/Toggle";
import { CardBack, BACK_PATTERNS, type BackPattern } from "../components/CardBack";
import { PrintInstructions } from "../components/PrintInstructions";
import {
  usePrintPrefs,
  PAPER_PX,
  LAYOUTS,
  type CardLayout,
  type PaperSize,
  type InstructionsPosition,
} from "../store/usePrintPrefs";
import { useProfile } from "../store/useProfile";
import { usePrinterProfiles } from "../store/usePrinterProfiles";
import { offsetPx, gridTransform } from "../lib/printerOffset";
import { cn } from "../lib/cn";
import { openPrintDialog } from "../lib/print";

const DOUBLE_SIDED_BACK_TEXT =
  "Double-sided cards: reload your printed fronts, flip the stack left-to-right " +
  "(like turning a book page), then print these backs. Keep print scale at 100% (Actual size).";

const PREVIEW_TARGET_W = 440;

const COLORS = ["#078dfb", "#00bde9", "#9cd900", "#ff8a00", "#6657e8", "#e044d3", "#ef4444", "#64748b"];

export function CardBacks() {
  const prefs = usePrintPrefs();
  const navigate = useNavigate();
  const profile = useProfile((s) => s.profile);
  const printers = usePrinterProfiles((s) => s.profiles);
  const activePrinterId = usePrinterProfiles((s) => s.activeId);
  const setActivePrinter = usePrinterProfiles((s) => s.setActive);
  const activePrinter = printers.find((p) => p.id === activePrinterId) ?? null;
  const back = offsetPx(activePrinter, "back");
  // Stamp the back with the player's avatar + username so traded cards show who
  // made them. On by default; off prints a plain logo back.
  const [personalize, setPersonalize] = useState(true);
  const [pattern, setPattern] = useState<BackPattern>("chevrons");
  const [color, setColor] = useState("#078dfb");
  const [pages, setPages] = useState(1);
  // Optional left-right mirror. The backs are identical and centred, so they
  // already align on a left-right flip — mirroring is only useful to match a
  // *directional* pattern (e.g. diagonal) after flipping, and it reverses the
  // logo, so it's off by default.
  const [mirror, setMirror] = useState(false);
  // Full-bleed: square corners + no gap so identical backgrounds tile into one
  // continuous field — cuts don't need to line up exactly. On by default.
  const [bleedEdges, setBleedEdges] = useState(true);

  const paper = PAPER_PX[prefs.paper];
  const scale = PREVIEW_TARGET_W / paper.w;
  const perPage = LAYOUTS[prefs.layout].perPage;
  const showInstructions = prefs.printInstructions && prefs.layout !== "3x3";

  return (
    <div>
      <PageHeader
        title="Card Backs"
        subtitle={`Print a matching back design — ${perPage} per page at exactly 2.5″ × 3.5″, the same grid as your card fronts.`}
        actions={
          <Button variant="primary" onClick={() => void openPrintDialog()}>
            <Printer size={16} /> Print / Save PDF
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[300px_1fr] print:block">
        {/* ---- Controls (hidden when printing) ---- */}
        <div className="no-print brand-panel space-y-5 rounded-[1.25rem] p-5">
          <div>
            <div className="mb-1.5 text-sm font-medium text-fg">Pattern</div>
            <Segmented
              options={BACK_PATTERNS.map((p) => p.id)}
              labels={Object.fromEntries(BACK_PATTERNS.map((p) => [p.id, p.label])) as Record<BackPattern, string>}
              value={pattern}
              onChange={setPattern}
            />
          </div>

          <div className="rounded-card border border-brand/20 bg-brand/5 p-4">
            <Toggle
              label="Personalise with my profile"
              checked={personalize}
              onChange={setPersonalize}
            />
            <p className="mt-1.5 text-xs text-muted">
              Prints your avatar and <span className="font-medium text-fg">@{profile.username}</span> on
              each back, so traded cards show who made them.
            </p>
          </div>

          <div>
            <div className="mb-1.5 text-sm font-medium text-fg">Card-back glow</div>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Use ${c}`}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 border-white/70 ring-2 ring-offset-2 ring-offset-bg transition",
                    color === c ? "scale-110 ring-brand shadow-[0_0_14px_currentColor]" : "ring-transparent hover:ring-line"
                  )}
                  style={{ background: c, color: c }}
                />
              ))}
              <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full ring-2 ring-line ring-offset-2 ring-offset-bg">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span className="block h-full w-full" style={{ background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
              </label>
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-sm font-medium text-fg">Pages</div>
            <Segmented
              options={[1, 2, 3, 4]}
              labels={{ 1: "1", 2: "2", 3: "3", 4: "4" } as Record<number, string>}
              value={pages}
              onChange={setPages}
            />
            <p className="mt-1 text-xs text-muted">{pages * perPage} backs total.</p>
          </div>

          <div className="space-y-3 rounded-card border border-line bg-surface/70 p-4">
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
              <p className="mt-1 text-xs text-muted">Must match your printed fronts — shared with Print / Export.</p>
            </div>
            <Toggle label="Bleed over edges (no exact cutting)" checked={bleedEdges} onChange={setBleedEdges} />
            <Toggle label="Cut guides" checked={prefs.cutGuides} onChange={prefs.setCutGuides} />
            {!bleedEdges && (
              <Toggle label="Spacing for cutting" checked={prefs.bleed} onChange={prefs.setBleed} />
            )}
            <Toggle label="Mirror (directional patterns only)" checked={mirror} onChange={setMirror} />
            {prefs.layout === "3x3" ? (
              <p className="text-xs text-muted">The double-sided how-to strip is off in 3×3 — no margin left for it.</p>
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

          <div className="rounded-card border border-brand/20 bg-brand/5 p-4 text-xs text-muted">
            <div className="mb-1 font-semibold text-fg">Double-sided cards</div>
            Print your card fronts from <span className="font-medium text-fg">Print / Export</span>,
            then put the same sheets back in the printer, <span className="font-medium text-fg">flip
            left-to-right</span> (like turning a book page), and print these backs. The grid matches
            the fronts, so each back lands behind its card. Keep scale at 100% / “Actual size”.
          </div>
        </div>

        {/* ---- Live print preview ---- */}
        <div className="print-area">
          <style>{`@page { size: ${prefs.paper}; margin: 0; }`}</style>
          {Array.from({ length: pages }).map((_, p) => (
            <div
              key={p}
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
                    gap: bleedEdges ? "0" : prefs.bleed ? "0.12in" : "0",
                    transform: gridTransform(back.dx, back.dy, mirror),
                  }}
                >
                  {Array.from({ length: perPage }).map((_, j) => (
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
                      <CardBack
                        pattern={pattern}
                        color={color}
                        width={240}
                        bleed={bleedEdges}
                        avatar={personalize ? profile.avatar : undefined}
                        username={personalize ? profile.username : undefined}
                      />
                    </div>
                  ))}
                </div>
                {showInstructions && (
                  <PrintInstructions
                    text={DOUBLE_SIDED_BACK_TEXT}
                    position={prefs.instructionsPosition}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
