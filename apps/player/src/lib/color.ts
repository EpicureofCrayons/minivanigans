/** Tiny hex colour helpers shared by the vehicle, playmat, and card-back artwork. */

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Darken (factor < 0) or lighten towards white (factor > 0) a #rrggbb colour. */
export function shade(hex: string, factor: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  const v = m ? parseInt(m[1], 16) : 0x888888;
  let r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  if (factor < 0) {
    const f = 1 + factor;
    r *= f; g *= f; b *= f;
  } else {
    r += (255 - r) * factor; g += (255 - g) * factor; b += (255 - b) * factor;
  }
  return `#${((clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16).padStart(6, "0")}`;
}

/** Pick legible navy or white copy for a solid custom colour. */
export function contrastText(hex: string): "#07172f" | "#ffffff" {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  const value = m ? parseInt(m[1], 16) : 0x078dfb;
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  // Perceived brightness is sufficient for these bold, large labels.
  return (r * 299 + g * 587 + b * 114) / 1000 > 145 ? "#07172f" : "#ffffff";
}
