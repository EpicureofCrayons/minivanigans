import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface Props {
  /** Largest font size (design px). Text starts here and shrinks until it fits. */
  max: number;
  /** Smallest font size to allow before giving up (design px). */
  min?: number;
  /** One line, fit by width (e.g. a card name). Otherwise wraps and fits by height. */
  singleLine?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Tailwind classes controlling how the text sits in its box (alignment, etc). */
  boxClassName?: string;
  /** Changes when the rendered text changes, to re-run the fit. */
  fitKey?: unknown;
  children: ReactNode;
}

/**
 * Shrinks its contents to the largest font size that fits the available box, so
 * long card names and ability text scale down instead of being clipped.
 *
 * It measures the *committed* render (real fonts, real wrap width) and shrinks
 * proportionally over a couple of renders until the content genuinely fits.
 * Measuring what actually paints — rather than a throwaway pre-measurement —
 * avoids the off-by-a-line clipping that web-font metrics and flex centering
 * cause. Measuring happens at the card's fixed design size, so every render
 * scale (mini tile, hero, export) lands on the same font size.
 */
export function FitText({ max, min = 5, singleLine, className, style, boxClassName, fitKey, children }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(max);

  // When the text, the cap, or the layout mode changes, restart from the
  // largest size; the measuring effect below shrinks it back down to fit.
  useLayoutEffect(() => {
    setSize(max);
  }, [max, fitKey, singleLine]);

  // After each render, if the real content overflows the clipping box, shrink
  // toward a fit and let the next render re-check. `text` grows to its content
  // size (it isn't height-constrained), so its own box is the true content size
  // regardless of how the box centers it.
  useLayoutEffect(() => {
    const b = box.current;
    const t = text.current;
    if (!b || !t || size <= min) return;
    const overH = t.offsetHeight - b.clientHeight;
    const overW = t.scrollWidth - b.clientWidth;
    if (overH <= 1 && overW <= 1) return;
    const ratio = Math.min(
      overH > 1 ? b.clientHeight / t.offsetHeight : 1,
      overW > 1 ? b.clientWidth / t.scrollWidth : 1
    );
    const next = Math.max(min, size * ratio * 0.97); // a hair of headroom
    if (next < size - 0.2) setSize(next);
  });

  // Web fonts change text metrics after first paint; re-fit from the top once
  // they're ready so the measurement reflects the real font.
  useEffect(() => {
    let done = false;
    document.fonts?.ready
      .then(() => {
        if (!done) setSize(max);
      })
      .catch(() => {});
    return () => {
      done = true;
    };
  }, [max, fitKey, singleLine]);

  return (
    <div ref={box} className={boxClassName ?? "flex h-full w-full items-center overflow-hidden"}>
      <div
        ref={text}
        className={className}
        style={{ fontSize: size, ...(singleLine ? { whiteSpace: "nowrap" } : {}), ...style }}
      >
        {children}
      </div>
    </div>
  );
}
