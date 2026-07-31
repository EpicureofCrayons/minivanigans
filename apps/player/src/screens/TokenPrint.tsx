import { useState } from "react";
import { Printer } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { Segmented } from "../components/ui/Segmented";
import { Toggle } from "../components/ui/Toggle";
import {
  PAPER_PX,
  usePrintPrefs,
  type PaperSize,
} from "../store/usePrintPrefs";
import { openPrintDialog } from "../lib/print";

type SheetKind = "game" | "damage";
type TokenKind = "damage-1" | "damage-2" | "shield" | "ko";

const PREVIEW_TARGET_W = 540;

const GAME_SET: TokenKind[] = [
  ...repeat("damage-1", 24),
  ...repeat("damage-2", 8),
  ...repeat("shield", 4),
  ...repeat("ko", 6),
];

const DAMAGE_SET: TokenKind[] = [
  ...repeat("damage-1", 36),
  ...repeat("damage-2", 12),
];

export function TokenPrint() {
  const prefs = usePrintPrefs();
  const [sheet, setSheet] = useState<SheetKind>("game");
  const tokens = sheet === "game" ? GAME_SET : DAMAGE_SET;
  const paper = PAPER_PX[prefs.paper];
  const scale = PREVIEW_TARGET_W / paper.w;

  return (
    <div>
      <PageHeader
        title="Printable Game Tokens"
        subtitle="Print sturdy counters for damage, Shields, and KO Stars—no loose change required."
        actions={
          <Button variant="primary" onClick={() => void openPrintDialog()}>
            <Printer size={16} /> Print / Save PDF
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[280px_1fr] print:block">
        <div className="no-print brand-panel space-y-5 rounded-[1.25rem] p-5">
          <div>
            <div className="mb-1.5 text-sm font-medium text-fg">Token sheet</div>
            <Segmented
              options={["game", "damage"] as SheetKind[]}
              labels={{ game: "Full game", damage: "Damage only" }}
              value={sheet}
              onChange={setSheet}
            />
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {sheet === "game"
                ? "One shared two-player set: 24 one-damage, 8 two-damage, 4 Shield 1, and 6 KO Star tokens."
                : "Extra damage supply: 36 one-damage and 12 two-damage tokens."}
            </p>
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
            <Toggle label="Dotted cut guides" checked={prefs.cutGuides} onChange={prefs.setCutGuides} />
          </div>

          <div className="rounded-card border border-brand/20 bg-brand/5 p-4 text-xs leading-relaxed text-muted">
            Print at 100% / “Actual size,” glue the page to thin cardboard, then cut around the dotted circles.
            Each finished token is approximately 0.9″ wide.
          </div>
        </div>

        <div className="print-area">
          <style>{`@page { size: ${prefs.paper}; margin: 0; }`}</style>
          <div
            className="print-frame mx-auto overflow-hidden rounded-md"
            style={{ width: paper.w * scale, height: paper.h * scale }}
          >
            <div
              className="print-page token-sheet bg-white"
              style={{
                position: "relative",
                width: paper.w,
                height: paper.h,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 1px 10px rgb(0 0 0 / 0.15)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 0.98in)",
                  gridAutoRows: "0.98in",
                  gap: "0.08in",
                }}
              >
                {tokens.map((kind, index) => (
                  <GameToken key={`${kind}-${index}`} kind={kind} cutGuide={prefs.cutGuides} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GameToken({ kind, cutGuide }: { kind: TokenKind; cutGuide: boolean }) {
  const details = tokenDetails(kind);

  return (
    <svg
      viewBox="0 0 100 100"
      width="0.9in"
      height="0.9in"
      role="img"
      aria-label={details.label}
    >
      {cutGuide && (
        <circle cx="50" cy="50" r="48" fill="none" stroke="#64748b" strokeWidth="0.8" strokeDasharray="3 2" />
      )}
      <circle cx="50" cy="50" r="43" fill="#030b1c" stroke={details.color} strokeWidth="5" />
      <circle cx="50" cy="50" r="36.5" fill="none" stroke="#38c8ff" strokeWidth="1.5" opacity="0.65" />
      {kind === "ko" ? (
        <>
          <text x="50" y="51" textAnchor="middle" dominantBaseline="middle" fontSize="43" fill="#baff18">★</text>
          <text x="50" y="78" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fontWeight="800" letterSpacing="1.5" fill="#fff">KO</text>
        </>
      ) : (
        <>
          <text
            x="50"
            y="51"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="sans-serif"
            fontSize={kind === "shield" ? "28" : "42"}
            fontWeight="900"
            fill="#fff"
          >
            {details.value}
          </text>
          <text
            x="50"
            y="77"
            textAnchor="middle"
            fontFamily="sans-serif"
            fontSize="8.5"
            fontWeight="800"
            letterSpacing="1"
            fill={details.color}
          >
            {details.caption}
          </text>
        </>
      )}
    </svg>
  );
}

function tokenDetails(kind: TokenKind) {
  switch (kind) {
    case "damage-1":
      return { value: "1", caption: "DAMAGE", label: "1 damage token", color: "#ff5b3d" };
    case "damage-2":
      return { value: "2", caption: "DAMAGE", label: "2 damage token", color: "#ff9f1c" };
    case "shield":
      return { value: "1", caption: "SHIELD", label: "Shield 1 token", color: "#38c8ff" };
    case "ko":
      return { value: "★", caption: "KO", label: "KO Star token", color: "#baff18" };
  }
}

function repeat(kind: TokenKind, count: number): TokenKind[] {
  return Array.from({ length: count }, () => kind);
}
