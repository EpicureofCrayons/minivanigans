import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PaperSize = "letter" | "a4";

/** Paper dimensions in CSS pixels (1in = 96px). Used for the print-page box. */
export const PAPER_PX: Record<PaperSize, { w: number; h: number; label: string }> = {
  letter: { w: 8.5 * 96, h: 11 * 96, label: 'US Letter (8.5" × 11")' },
  a4: { w: (210 / 25.4) * 96, h: (297 / 25.4) * 96, label: "A4 (210 × 297 mm)" },
};

export type InstructionsPosition = "top" | "bottom";

/**
 * Cards-per-page layout. SHARED by fronts, backs, and the calibration sheet —
 * double-sided alignment only works when all three use the same grid.
 * 3×3 puts a whole 18-card deck on exactly 2 sheets (the rules doc's promise)
 * but leaves only ~0.25″ margins on Letter; 3×2 is the safe-margin option.
 */
export type CardLayout = "3x2" | "3x3";

export const LAYOUTS: Record<CardLayout, { perPage: number; rows: number; label: string }> = {
  "3x3": { perPage: 9, rows: 3, label: "9 / page" },
  "3x2": { perPage: 6, rows: 2, label: "6 / page" },
};

interface PrintPrefs {
  paper: PaperSize;
  /** Cards-per-page grid, shared across fronts / backs / calibration. */
  layout: CardLayout;
  /** Gap between cards so there's room to cut cleanly. */
  bleed: boolean;
  /** Hairline cut guides around each card. */
  cutGuides: boolean;
  /** Print a double-sided how-to strip in the page margin. */
  printInstructions: boolean;
  /** Which margin the instruction strip sits in. */
  instructionsPosition: InstructionsPosition;
  setPaper: (p: PaperSize) => void;
  setLayout: (l: CardLayout) => void;
  setBleed: (b: boolean) => void;
  setCutGuides: (c: boolean) => void;
  setPrintInstructions: (v: boolean) => void;
  setInstructionsPosition: (p: InstructionsPosition) => void;
}

export const usePrintPrefs = create<PrintPrefs>()(
  persist(
    (set) => ({
      paper: "letter",
      layout: "3x3", // 18-card decks print on exactly 2 sheets
      bleed: false,
      cutGuides: true,
      printInstructions: true,
      instructionsPosition: "bottom",
      setPaper: (paper) => set({ paper }),
      setLayout: (layout) => set({ layout }),
      setBleed: (bleed) => set({ bleed }),
      setCutGuides: (cutGuides) => set({ cutGuides }),
      setPrintInstructions: (printInstructions) => set({ printInstructions }),
      setInstructionsPosition: (instructionsPosition) => set({ instructionsPosition }),
    }),
    { name: "day-shifters:print" }
  )
);
