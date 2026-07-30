import type { CSSProperties } from "react";
import type { InstructionsPosition } from "../store/usePrintPrefs";

/**
 * A printable double-sided how-to strip, pinned to the top or bottom margin of a
 * print page. It lives INSIDE the scaled `.print-page` (which must be
 * position:relative) so it scales with the on-screen preview and prints at full
 * size. Being absolutely positioned, it sits in the page margin without
 * disturbing the centred card grid.
 */
export function PrintInstructions({
  text,
  position,
}: {
  text: string;
  position: InstructionsPosition;
}) {
  const style: CSSProperties = {
    position: "absolute",
    left: "0.4in",
    right: "0.4in",
    top: position === "top" ? "0.3in" : undefined,
    bottom: position === "bottom" ? "0.3in" : undefined,
    textAlign: "center",
    fontSize: "10pt",
    lineHeight: 1.35,
    color: "#444",
  };
  return <div style={style}>{text}</div>;
}
