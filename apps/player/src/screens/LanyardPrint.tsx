import { Printer } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { Segmented } from "../components/ui/Segmented";
import { Lanyard } from "../components/Lanyard";
import { useLibrary } from "../store/useLibrary";
import { useProfile } from "../store/useProfile";
import { usePrintPrefs, PAPER_PX, type PaperSize } from "../store/usePrintPrefs";
import { openPrintDialog } from "../lib/print";

const PREVIEW_TARGET_W = 440;
const PX_PER_IN = 96; // CSS px per inch

export function LanyardPrint() {
  const cards = useLibrary((s) => s.cards);
  const cfg = useLibrary((s) => s.config);
  const profile = useProfile((s) => s.profile);
  const prefs = usePrintPrefs();

  const favoriteCard = cards.find((c) => c.id === profile.favoriteCardId);
  const { widthIn, heightIn } = cfg.lanyard;
  const paper = PAPER_PX[prefs.paper];
  const scale = PREVIEW_TARGET_W / paper.w;

  return (
    <div>
      <PageHeader
        title="Print Lanyard"
        subtitle={`Your employee badge at ${widthIn}″ × ${heightIn}″ — print it and pop it in a lanyard sleeve.`}
        actions={
          <Button variant="primary" onClick={() => void openPrintDialog()}>
            <Printer size={16} /> Print / Save PDF
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[260px_1fr] print:block">
        {/* controls (hidden when printing) */}
        <div className="no-print space-y-5">
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
          </div>
          <p className="text-sm text-muted">
            One badge per page, centered.
            <br />
            <span className="text-xs">
              In the print dialog choose “Save as PDF” to export. Set scale to 100% / “Actual size”.
            </span>
          </p>
        </div>

        {/* live print preview */}
        <div className="print-area">
          <style>{`@page { size: ${prefs.paper}; margin: 0; }`}</style>
          <div
            className="print-frame mx-auto overflow-hidden rounded-md"
            style={{ width: paper.w * scale, height: paper.h * scale }}
          >
            <div
              className="print-page bg-white"
              style={{
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
              <div style={{ width: `${widthIn}in`, height: `${heightIn}in`, display: "grid", placeItems: "center" }}>
                <Lanyard profile={profile} favoriteCard={favoriteCard} cfg={cfg} width={widthIn * PX_PER_IN} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
