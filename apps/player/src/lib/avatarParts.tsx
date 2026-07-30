import type { ReactNode } from "react";
import type { AvatarFeature, AvatarRecipe } from "@minivanigans/rules-engine";

// A blank-head avatar builder. Everything is procedural SVG in a 100×100 box,
// so there are no image assets to ship. Each feature is drawn in absolute
// coordinates over a head centred at (50,50); the recipe's per-feature dx/dy and
// scale are applied around the feature's anchor by <AvatarSvg/>.

export type AvatarCategory = "hair" | "eyes" | "nose" | "mouth" | "glasses" | "hat";

export const SKIN_TONES = ["#ffe0bd", "#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#5c3a21"];
export const BG_COLORS = ["#bfe3ff", "#ffd6e0", "#d7f5d0", "#ffe9b3", "#e6dbff", "#cfd8e3", "#0f766e", "#e0533a"];
const HAIR_COLORS = ["#2b2118", "#5a3a22", "#8b5a2b", "#c98a3a", "#e8c87a", "#d94f4f", "#9b9b9b", "#101010"];
const EYE_COLORS = ["#5a3a22", "#3b6b8f", "#2e7d32", "#111111", "#6b4f2a", "#7a4a8f"];
const FRAME_COLORS = ["#222222", "#7a4a2a", "#c0392b", "#2f5d8a", "#444444", "#d4af37"];
const HAT_COLORS = ["#2f5d8a", "#c0392b", "#2e7d32", "#5a3a22", "#222222", "#d4af37", "#e67e22"];

export interface CategoryMeta {
  id: AvatarCategory;
  label: string;
  recolor: boolean;
  defaultColor: string;
  palette: string[];
  /** Anchor that the feature's scale/offset pivots around. */
  center: { x: number; y: number };
}

/** Draw order = z-order (earlier is behind). */
export const CATEGORY_ORDER: AvatarCategory[] = ["hair", "eyes", "nose", "mouth", "glasses", "hat"];

export const CATEGORIES: Record<AvatarCategory, CategoryMeta> = {
  hair: { id: "hair", label: "Hair", recolor: true, defaultColor: HAIR_COLORS[0], palette: HAIR_COLORS, center: { x: 50, y: 26 } },
  eyes: { id: "eyes", label: "Eyes", recolor: true, defaultColor: EYE_COLORS[0], palette: EYE_COLORS, center: { x: 50, y: 46 } },
  nose: { id: "nose", label: "Nose", recolor: false, defaultColor: "#00000040", palette: [], center: { x: 50, y: 56 } },
  mouth: { id: "mouth", label: "Mouth", recolor: false, defaultColor: "#c0392b", palette: [], center: { x: 50, y: 67 } },
  glasses: { id: "glasses", label: "Glasses", recolor: true, defaultColor: FRAME_COLORS[0], palette: FRAME_COLORS, center: { x: 50, y: 46 } },
  hat: { id: "hat", label: "Hat", recolor: true, defaultColor: HAT_COLORS[0], palette: HAT_COLORS, center: { x: 50, y: 20 } },
};

export interface PartOption {
  id: string;
  label: string;
  node: (color: string) => ReactNode;
}

const NONE: PartOption = { id: "none", label: "None", node: () => null };

// ---- Hair ----------------------------------------------------------------
const HAIR: PartOption[] = [
  NONE,
  { id: "short", label: "Short", node: (c) => (
    <path d="M18 46 Q16 14 50 13 Q84 14 82 46 Q76 26 50 25 Q24 26 18 46 Z" fill={c} />
  ) },
  { id: "buzz", label: "Buzz", node: (c) => (
    <path d="M20 44 Q21 18 50 17 Q79 18 80 44 Q70 31 50 31 Q30 31 20 44 Z" fill={c} opacity={0.85} />
  ) },
  { id: "spiky", label: "Spiky", node: (c) => (
    <path d="M18 44 L24 16 L31 37 L38 12 L45 35 L50 10 L55 35 L62 12 L69 37 L76 16 L82 44 Q50 31 18 44 Z" fill={c} />
  ) },
  { id: "bob", label: "Bob", node: (c) => (
    <path d="M16 42 Q16 13 50 13 Q84 13 84 42 L84 64 Q79 54 77 47 Q71 30 50 30 Q29 30 23 47 Q21 54 16 64 Z" fill={c} />
  ) },
  { id: "long", label: "Long", node: (c) => (
    <path d="M15 42 Q15 12 50 12 Q85 12 85 42 L85 82 Q81 64 79 50 Q73 30 50 30 Q27 30 21 50 Q19 64 15 82 Z" fill={c} />
  ) },
  { id: "bun", label: "Bun", node: (c) => (
    <g fill={c}>
      <circle cx={50} cy={11} r={7.5} />
      <path d="M19 45 Q19 16 50 15 Q81 16 81 45 Q73 28 50 28 Q27 28 19 45 Z" />
    </g>
  ) },
];

// ---- Eyes ----------------------------------------------------------------
const eyePair = (left: ReactNode, right: ReactNode) => (
  <g>
    <g transform="translate(37 46)">{left}</g>
    <g transform="translate(63 46)">{right}</g>
  </g>
);
const EYES: PartOption[] = [
  NONE,
  { id: "dots", label: "Dots", node: () => eyePair(<circle r={2.4} fill="#222" />, <circle r={2.4} fill="#222" />) },
  { id: "round", label: "Round", node: (c) => {
    const eye = (
      <>
        <ellipse rx={5} ry={6} fill="#fff" stroke="#33333322" strokeWidth={0.6} />
        <circle cy={0.5} r={2.8} fill={c} />
        <circle cy={0.5} r={1.3} fill="#111" />
        <circle cx={-1} cy={-1} r={0.8} fill="#fff" />
      </>
    );
    return eyePair(eye, eye);
  } },
  { id: "almond", label: "Almond", node: (c) => {
    const eye = (
      <>
        <ellipse rx={5.5} ry={3.4} fill="#fff" stroke="#33333322" strokeWidth={0.6} />
        <circle r={2.6} fill={c} />
        <circle r={1.1} fill="#111" />
      </>
    );
    return eyePair(eye, eye);
  } },
  { id: "happy", label: "Happy", node: () => eyePair(
    <path d="M-4 1 Q0 -4 4 1" fill="none" stroke="#222" strokeWidth={1.6} strokeLinecap="round" />,
    <path d="M-4 1 Q0 -4 4 1" fill="none" stroke="#222" strokeWidth={1.6} strokeLinecap="round" />
  ) },
  { id: "wink", label: "Wink", node: (c) => eyePair(
    <>
      <ellipse rx={5} ry={6} fill="#fff" stroke="#33333322" strokeWidth={0.6} />
      <circle cy={0.5} r={2.8} fill={c} />
      <circle cy={0.5} r={1.3} fill="#111" />
    </>,
    <path d="M-4 0 Q0 3 4 0" fill="none" stroke="#222" strokeWidth={1.6} strokeLinecap="round" />
  ) },
];

// ---- Nose ----------------------------------------------------------------
const NOSE: PartOption[] = [
  NONE,
  { id: "button", label: "Button", node: () => (
    <path d="M46 57 Q50 61 54 57" fill="none" stroke="#00000045" strokeWidth={1.8} strokeLinecap="round" />
  ) },
  { id: "dot", label: "Dot", node: () => <ellipse cx={50} cy={57} rx={2.2} ry={1.7} fill="#00000035" /> },
  { id: "long", label: "Long", node: () => (
    <path d="M50 49 L50 57 Q50 60 53 59" fill="none" stroke="#00000040" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  ) },
  { id: "pointed", label: "Pointed", node: () => (
    <path d="M50 49 L46 58 Q50 60 54 58 Z" fill="#00000022" stroke="#00000040" strokeWidth={1} strokeLinejoin="round" />
  ) },
];

// ---- Mouth ---------------------------------------------------------------
const MOUTH: PartOption[] = [
  { id: "smile", label: "Smile", node: () => (
    <path d="M40 65 Q50 73 60 65" fill="none" stroke="#b3402f" strokeWidth={2.4} strokeLinecap="round" />
  ) },
  { id: "neutral", label: "Neutral", node: () => (
    <path d="M42 67 H58" fill="none" stroke="#b3402f" strokeWidth={2.2} strokeLinecap="round" />
  ) },
  { id: "grin", label: "Grin", node: () => (
    <g>
      <path d="M40 64 Q50 75 60 64 Z" fill="#c0392b" />
      <path d="M41.5 65 Q50 68 58.5 65" fill="#fff" />
    </g>
  ) },
  { id: "open", label: "Open", node: () => (
    <g>
      <ellipse cx={50} cy={68} rx={5} ry={6} fill="#c0392b" />
      <path d="M45.5 64 Q50 66 54.5 64 L54.5 66 Q50 67.5 45.5 66 Z" fill="#fff" />
    </g>
  ) },
  { id: "frown", label: "Frown", node: () => (
    <path d="M40 70 Q50 63 60 70" fill="none" stroke="#b3402f" strokeWidth={2.4} strokeLinecap="round" />
  ) },
];

// ---- Glasses -------------------------------------------------------------
const GLASSES: PartOption[] = [
  NONE,
  { id: "round", label: "Round", node: (c) => (
    <g fill="none" stroke={c} strokeWidth={1.8}>
      <circle cx={37} cy={46} r={6.5} />
      <circle cx={63} cy={46} r={6.5} />
      <path d="M43.5 46 H56.5" />
      <path d="M30.5 45 L21 43" />
      <path d="M69.5 45 L79 43" />
    </g>
  ) },
  { id: "square", label: "Square", node: (c) => (
    <g fill="none" stroke={c} strokeWidth={1.8}>
      <rect x={30} y={41} width={13} height={10} rx={2} />
      <rect x={57} y={41} width={13} height={10} rx={2} />
      <path d="M43 45 H57" />
      <path d="M30 44 L21 42" />
      <path d="M70 44 L79 42" />
    </g>
  ) },
  { id: "sun", label: "Sunglasses", node: (c) => (
    <g>
      <rect x={29} y={41} width={15} height={9} rx={4} fill={c} />
      <rect x={56} y={41} width={15} height={9} rx={4} fill={c} />
      <path d="M44 44 H56" stroke={c} strokeWidth={2} />
      <path d="M29 43 L21 41 M71 43 L79 41" stroke={c} strokeWidth={1.8} />
    </g>
  ) },
];

// ---- Hat -----------------------------------------------------------------
const HAT: PartOption[] = [
  NONE,
  { id: "cap", label: "Cap", node: (c) => (
    <g>
      <path d="M22 28 Q24 7 50 7 Q76 7 78 28 Q50 19 22 28 Z" fill={c} />
      <path d="M50 26 Q74 25 86 32 Q70 30 50 30 Z" fill={c} opacity={0.8} />
    </g>
  ) },
  { id: "beanie", label: "Beanie", node: (c) => (
    <g>
      <path d="M19 30 Q19 9 50 9 Q81 9 81 30 Q50 21 19 30 Z" fill={c} />
      <rect x={19} y={28} width={62} height={5} rx={2.5} fill={c} opacity={0.7} />
    </g>
  ) },
  { id: "party", label: "Party", node: (c) => (
    <g>
      <path d="M50 1 L63 29 Q50 22 37 29 Z" fill={c} />
      <circle cx={50} cy={2} r={3} fill="#fff" />
    </g>
  ) },
  { id: "band", label: "Headband", node: (c) => (
    <path d="M19 35 Q50 27 81 35 L81 40 Q50 33 19 40 Z" fill={c} />
  ) },
  { id: "top", label: "Top hat", node: (c) => (
    <g fill={c}>
      <rect x={35} y={2} width={30} height={22} rx={2} />
      <rect x={23} y={22} width={54} height={4} rx={2} />
    </g>
  ) },
];

export const PARTS: Record<AvatarCategory, PartOption[]> = {
  hair: HAIR,
  eyes: EYES,
  nose: NOSE,
  mouth: MOUTH,
  glasses: GLASSES,
  hat: HAT,
};

const feat = (style: string, color?: string): AvatarFeature => ({ style, color, dx: 0, dy: 0, scale: 1 });

export function defaultRecipe(): AvatarRecipe {
  return {
    skin: SKIN_TONES[1],
    bg: BG_COLORS[0],
    hair: feat("short", HAIR_COLORS[0]),
    eyes: feat("round", EYE_COLORS[0]),
    nose: feat("button"),
    mouth: feat("smile"),
    glasses: feat("none"),
    hat: feat("none"),
  };
}

/** The plain head (skin + ears + neck) every avatar starts from. */
function BaseHead({ skin }: { skin: string }) {
  return (
    <g>
      <circle cx={20} cy={52} r={5} fill={skin} />
      <circle cx={80} cy={52} r={5} fill={skin} />
      <rect x={43} y={74} width={14} height={14} rx={4} fill={skin} />
      <ellipse cx={50} cy={50} rx={32} ry={35} fill={skin} />
    </g>
  );
}

/** Compose a recipe into an SVG. `interactive` is unused here but lets callers
 *  pass a ref to the root for rasterisation. */
export function AvatarSvg({
  recipe,
  size,
  className,
  svgRef,
}: {
  recipe: AvatarRecipe;
  size: number;
  className?: string;
  svgRef?: React.Ref<SVGSVGElement>;
}) {
  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" fill={recipe.bg} />
      <BaseHead skin={recipe.skin} />
      {CATEGORY_ORDER.map((cat) => {
        const f = recipe[cat];
        if (!f || f.style === "none") return null;
        const opt = PARTS[cat].find((o) => o.id === f.style);
        if (!opt) return null;
        const color = CATEGORIES[cat].recolor ? f.color ?? CATEGORIES[cat].defaultColor : CATEGORIES[cat].defaultColor;
        const c = CATEGORIES[cat].center;
        const tx = `translate(${f.dx} ${f.dy}) translate(${c.x} ${c.y}) scale(${f.scale}) translate(${-c.x} ${-c.y})`;
        return (
          <g key={cat} transform={tx}>
            {opt.node(color)}
          </g>
        );
      })}
    </svg>
  );
}

/** A small head + single feature, for the option picker thumbnails. */
export function PartThumb({ opt, color }: { opt: PartOption; color: string }) {
  return (
    <svg width={44} height={44} viewBox="0 0 100 100">
      <ellipse cx={50} cy={50} rx={32} ry={35} fill="#00000010" />
      {opt.id === "none" ? (
        <line x1={32} y1={68} x2={68} y2={32} stroke="#9993" strokeWidth={4} strokeLinecap="round" />
      ) : (
        opt.node(color)
      )}
    </svg>
  );
}
