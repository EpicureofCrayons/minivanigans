import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Crosshair,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { Button } from "../components/ui/Button";
import { Segmented } from "../components/ui/Segmented";
import { usePrintPrefs, PAPER_PX, LAYOUTS, type CardLayout, type PaperSize } from "../store/usePrintPrefs";
import {
  usePrinterProfiles,
  type OffsetField,
  type PrintSide,
} from "../store/usePrinterProfiles";
import { offsetPx, gridTransform } from "../lib/printerOffset";
import { openPrintDialog } from "../lib/print";

const PREVIEW_TARGET_W = 440;
const STEP = 0.5; // mm per nudge
const LIMIT = 12; // mm clamp

// Cell drawn in mm: 2.5in = 63.5mm wide, 3.5in = 88.9mm tall.
const CW = 63.5;
const CH = 88.9;
const round1 = (n: number) => Math.round(n * 10) / 10;
const clampMm = (n: number) => Math.max(-LIMIT, Math.min(LIMIT, round1(n)));

export function PrinterCalibration() {
  const prefs = usePrintPrefs();
  const profiles = usePrinterProfiles((s) => s.profiles);
  const activeId = usePrinterProfiles((s) => s.activeId);
  const addProfile = usePrinterProfiles((s) => s.addProfile);
  const renameProfile = usePrinterProfiles((s) => s.renameProfile);
  const updateOffsets = usePrinterProfiles((s) => s.updateOffsets);
  const removeProfile = usePrinterProfiles((s) => s.removeProfile);
  const setActive = usePrinterProfiles((s) => s.setActive);

  const active = profiles.find((p) => p.id === activeId) ?? null;
  const paper = PAPER_PX[prefs.paper];
  const scale = PREVIEW_TARGET_W / paper.w;
  const perPage = LAYOUTS[prefs.layout].perPage; // test sheet mirrors the real card grid

  const [newName, setNewName] = useState("");

  function nudge(field: OffsetField, delta: number) {
    if (!active) return;
    updateOffsets(active.id, { [field]: clampMm(active[field] + delta) });
  }
  function resetSide(side: PrintSide) {
    if (!active) return;
    updateOffsets(
      active.id,
      side === "front" ? { frontDx: 0, frontDy: 0 } : { backDx: 0, backDy: 0 }
    );
  }

  const front = offsetPx(active, "front");
  const back = offsetPx(active, "back");

  return (
    <div>
      <PageHeader
        title="Printer Setup"
        subtitle="Line up card fronts and backs for double-sided printing — calibrate once per printer and the app remembers it."
        actions={
          <Button variant="primary" onClick={() => void openPrintDialog()} disabled={!active}>
            <Printer size={16} /> Print test sheet
          </Button>
        }
      />

      {profiles.length === 0 ? (
        <EmptyState
          icon={Crosshair}
          title="Add your printer"
          description="Name the printer you'll calibrate (e.g. “Office HP”). You can add more later if you print from more than one."
          action={
            <div className="mx-auto flex max-w-sm items-center gap-2">
              <input
                className="flex-1 rounded-card border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-brand"
                placeholder="Printer name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newName.trim()) {
                    addProfile(newName);
                    setNewName("");
                  }
                }}
              />
              <Button
                variant="primary"
                disabled={!newName.trim()}
                onClick={() => {
                  addProfile(newName);
                  setNewName("");
                }}
              >
                <Plus size={16} /> Add
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[320px_1fr] print:block">
          {/* ---- Controls (hidden when printing) ---- */}
          <div className="no-print space-y-5">
            {/* Printer picker */}
            <div className="space-y-2 rounded-card border border-line bg-surface p-4">
              <div className="text-sm font-semibold text-fg">Printer</div>
              <select
                className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-brand"
                value={activeId ?? ""}
                onChange={(e) => setActive(e.target.value)}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {active && (
                <input
                  className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-brand"
                  value={active.name}
                  aria-label="Rename printer"
                  onChange={(e) => renameProfile(active.id, e.target.value)}
                />
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="secondary" onClick={() => addProfile(`Printer ${profiles.length + 1}`)}>
                  <Plus size={15} /> Add
                </Button>
                {active && (
                  <Button variant="ghost" onClick={() => removeProfile(active.id)}>
                    <Trash2 size={15} /> Remove
                  </Button>
                )}
              </div>
            </div>

            {active && (
              <>
                <OffsetPad
                  title="Front offset"
                  dx={active.frontDx}
                  dy={active.frontDy}
                  onNudge={(f, d) => nudge(f, d)}
                  fields={{ x: "frontDx", y: "frontDy" }}
                  onReset={() => resetSide("front")}
                />
                <OffsetPad
                  title="Back offset"
                  dx={active.backDx}
                  dy={active.backDy}
                  onNudge={(f, d) => nudge(f, d)}
                  fields={{ x: "backDx", y: "backDy" }}
                  onReset={() => resetSide("back")}
                />
              </>
            )}

            {/* Paper + layout */}
            <div className="space-y-3 rounded-card border border-line bg-surface p-4">
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
                <p className="mt-1 text-xs text-muted">The test sheet uses the same grid as your cards.</p>
              </div>
            </div>

            {/* How-to */}
            <div className="rounded-card border border-line bg-surface p-4 text-xs leading-relaxed text-muted">
              <div className="mb-1 font-semibold text-fg">How to calibrate</div>
              1. Print this test sheet double-sided exactly how you print cards (flip
              left-to-right). Keep scale at 100% / “Actual size”.
              <br />
              2. Hold the sheet to a light. The <span className="font-medium" style={{ color: FRONT_COLOR }}>teal</span> front
              crosshairs and <span className="font-medium" style={{ color: BACK_COLOR }}>orange</span> back crosshairs should
              sit on top of each other.
              <br />
              3. If the back is off, nudge <span className="font-medium text-fg">Back offset</span> by the gap you
              measure on the ruler, then reprint to confirm. Your settings save automatically.
            </div>
          </div>

          {/* ---- Print preview: page 1 front, page 2 back ---- */}
          <div className="print-area">
            <style>{`@page { size: ${prefs.paper}; margin: 0; }`}</style>
            {(["front", "back"] as PrintSide[]).map((side) => {
              const o = side === "front" ? front : back;
              return (
                <div
                  key={side}
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
                        gap: "0",
                        transform: gridTransform(o.dx, o.dy),
                      }}
                    >
                      {Array.from({ length: perPage }).map((_, j) => (
                        <CalibrationCell key={j} color={side === "front" ? FRONT_COLOR : BACK_COLOR} />
                      ))}
                    </div>
                    <div
                      className="pointer-events-none absolute"
                      style={{
                        left: "0.4in",
                        bottom: "0.3in",
                        fontSize: "10pt",
                        color: side === "front" ? FRONT_COLOR : BACK_COLOR,
                        fontWeight: 600,
                      }}
                    >
                      {side === "front" ? "FRONT — page 1" : "BACK — page 2 (flip left-to-right)"}
                      {active ? ` · ${active.name}` : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const FRONT_COLOR = "#0f766e";
const BACK_COLOR = "#ea8c0b";

/** A 4-way nudge pad + readout for one side's offset. */
function OffsetPad({
  title,
  dx,
  dy,
  onNudge,
  fields,
  onReset,
}: {
  title: string;
  dx: number;
  dy: number;
  onNudge: (field: OffsetField, delta: number) => void;
  fields: { x: OffsetField; y: OffsetField };
  onReset: () => void;
}) {
  const fmt = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}`;
  const padBtn =
    "grid h-9 w-9 place-items-center rounded-card bg-surface-2 text-fg transition hover:bg-line active:scale-95";
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-fg">{title}</span>
        <button className="text-xs text-muted underline-offset-2 hover:underline" onClick={onReset}>
          Reset
        </button>
      </div>
      <div className="flex items-center gap-4">
        {/* d-pad */}
        <div className="grid grid-cols-3 grid-rows-3 gap-1">
          <span />
          <button className={padBtn} aria-label="Up" onClick={() => onNudge(fields.y, -STEP)}>
            <ArrowUp size={16} />
          </button>
          <span />
          <button className={padBtn} aria-label="Left" onClick={() => onNudge(fields.x, -STEP)}>
            <ArrowLeft size={16} />
          </button>
          <span className="grid place-items-center text-[10px] text-muted">mm</span>
          <button className={padBtn} aria-label="Right" onClick={() => onNudge(fields.x, STEP)}>
            <ArrowRight size={16} />
          </button>
          <span />
          <button className={padBtn} aria-label="Down" onClick={() => onNudge(fields.y, STEP)}>
            <ArrowDown size={16} />
          </button>
          <span />
        </div>
        {/* readout */}
        <div className="space-y-1 text-sm tabular-nums">
          <div className="flex items-center gap-2">
            <span className="w-4 text-muted">X</span>
            <span className="font-semibold text-fg">{fmt(dx)} mm</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 text-muted">Y</span>
            <span className="font-semibold text-fg">{fmt(dy)} mm</span>
          </div>
          <button
            className="flex items-center gap-1 pt-1 text-xs text-muted hover:text-fg"
            onClick={onReset}
          >
            <RotateCcw size={12} /> zero
          </button>
        </div>
      </div>
    </div>
  );
}

/** A registration cell: centre crosshair + a ±15mm ruler, drawn in mm units. */
function CalibrationCell({ color }: { color: string }) {
  const cx = CW / 2;
  const cy = CH / 2;
  const ticks: number[] = [];
  for (let i = -15; i <= 15; i++) ticks.push(i);
  return (
    <svg width="2.5in" height="3.5in" viewBox={`0 0 ${CW} ${CH}`} style={{ display: "block" }}>
      {/* cell border (hairline, light) */}
      <rect x={0.1} y={0.1} width={CW - 0.2} height={CH - 0.2} fill="none" stroke="#ddd" strokeWidth={0.15} />
      {/* crosshair */}
      <line x1={cx} y1={0} x2={cx} y2={CH} stroke={color} strokeWidth={0.18} />
      <line x1={0} y1={cy} x2={CW} y2={cy} stroke={color} strokeWidth={0.18} />
      <circle cx={cx} cy={cy} r={2} fill="none" stroke={color} strokeWidth={0.18} />
      {/* horizontal ruler ticks (along the vertical centre line) */}
      {ticks.map((i) => {
        const major = i % 5 === 0;
        const len = major ? 3 : 1.5;
        return (
          <line
            key={`h${i}`}
            x1={cx + i}
            y1={cy}
            x2={cx + i}
            y2={cy - len}
            stroke={color}
            strokeWidth={0.12}
          />
        );
      })}
      {/* vertical ruler ticks (along the horizontal centre line) */}
      {ticks.map((i) => {
        const major = i % 5 === 0;
        const len = major ? 3 : 1.5;
        return (
          <line
            key={`v${i}`}
            x1={cx}
            y1={cy + i}
            x2={cx + len}
            y2={cy + i}
            stroke={color}
            strokeWidth={0.12}
          />
        );
      })}
      {/* mm labels at ±5, ±10 */}
      {[-10, -5, 5, 10].map((i) => (
        <text key={`lx${i}`} x={cx + i} y={cy - 4} fontSize={2.4} fill={color} textAnchor="middle">
          {Math.abs(i)}
        </text>
      ))}
      {/* corner registration ticks */}
      {[
        [4, 4, 1, 0],
        [4, 4, 0, 1],
        [CW - 4, 4, -1, 0],
        [CW - 4, 4, 0, 1],
        [4, CH - 4, 1, 0],
        [4, CH - 4, 0, -1],
        [CW - 4, CH - 4, -1, 0],
        [CW - 4, CH - 4, 0, -1],
      ].map(([x, y, ux, uy], k) => (
        <line
          key={`c${k}`}
          x1={x}
          y1={y}
          x2={x + ux * 3}
          y2={y + uy * 3}
          stroke={color}
          strokeWidth={0.15}
        />
      ))}
    </svg>
  );
}
