import type { PrinterProfile, PrintSide } from "../store/usePrinterProfiles";

// The print pages are laid out in CSS pixels at 96dpi (1in = 96px), so a
// millimetre is this many px. Offsets stored in mm convert straight to a px
// translate that scales with the on-screen preview and prints at true size.
export const PX_PER_MM = 96 / 25.4;

/** The translate (in CSS px) for a profile's offset on a given side. */
export function offsetPx(
  profile: PrinterProfile | null | undefined,
  side: PrintSide
): { dx: number; dy: number } {
  if (!profile) return { dx: 0, dy: 0 };
  const mmX = side === "front" ? profile.frontDx : profile.backDx;
  const mmY = side === "front" ? profile.frontDy : profile.backDy;
  return { dx: mmX * PX_PER_MM, dy: mmY * PX_PER_MM };
}

/**
 * Build the `transform` for a print grid. Used by BOTH the calibration sheet and
 * the real Print/Card-Backs grids so what you calibrate is exactly what prints.
 * Mirror (card backs only) is applied first, then the alignment translate.
 */
export function gridTransform(dx: number, dy: number, mirror = false): string | undefined {
  const parts: string[] = [];
  if (mirror) parts.push("scaleX(-1)");
  if (dx || dy) parts.push(`translate(${dx}px, ${dy}px)`);
  return parts.length ? parts.join(" ") : undefined;
}
