import { useId } from "react";
import type { Avatar } from "@minivanigans/rules-engine";
import { contrastText, shade } from "../lib/color";
import { LogoMarkContent } from "./Logo";
import { BUILTIN_AVATAR_BY_ID } from "../lib/avatars";
import { useImageUrl } from "../lib/useImageUrl";

export type BackPattern = "chevrons" | "dots" | "diagonal" | "emblem";

export const BACK_PATTERNS: { id: BackPattern; label: string }[] = [
  { id: "chevrons", label: "Boost Arrows" },
  { id: "dots", label: "Energy Dots" },
  { id: "diagonal", label: "Speed Lines" },
  { id: "emblem", label: "Logo Focus" },
];

const VB_W = 240;
const VB_H = 336; // 2.5 : 3.5
const LIME = "#baff18";
const ORANGE = "#ff8a00";
const CYAN = "#38c8ff";
const NAVY = "#020714";

/** A printable card back in the same neon game-art language as the app and logo. */
export function CardBack({
  pattern = "chevrons",
  color,
  width,
  bleed = false,
  avatar,
  username,
}: {
  pattern?: BackPattern;
  color: string;
  width: number;
  /** Fill the full rectangle so a slightly-off cut never reveals white. */
  bleed?: boolean;
  /** Optional creator identity for traded cards. */
  avatar?: Avatar;
  username?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const avatarUrl = useImageUrl(avatar?.kind === "image" ? avatar.ref : undefined);
  const builtin = avatar?.kind === "builtin" ? BUILTIN_AVATAR_BY_ID.get(avatar.id) : undefined;
  const rx = bleed ? 0 : 14;
  const light = shade(color, 0.45);
  const deep = shade(color, -0.55);
  const accentText = contrastText(color);
  const patId = `back-pattern-${uid}`;
  const baseId = `back-base-${uid}`;
  const flareId = `back-flare-${uid}`;
  const edgeId = `back-edge-${uid}`;
  const glowId = `back-glow-${uid}`;
  const clipId = `back-avatar-${uid}`;
  const cx = VB_W / 2;
  const cy = 147;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width={width}
      height={width * (VB_H / VB_W)}
      role="img"
      aria-label="Minivanigans card back"
    >
      <defs>
        <linearGradient id={baseId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#071b39" />
          <stop offset="0.52" stopColor={NAVY} />
          <stop offset="1" stopColor="#06132a" />
        </linearGradient>
        <radialGradient id={flareId}>
          <stop offset="0" stopColor={color} stopOpacity="0.34" />
          <stop offset="0.55" stopColor={deep} stopOpacity="0.13" />
          <stop offset="1" stopColor={NAVY} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={edgeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={color} />
          <stop offset="0.5" stopColor={CYAN} />
          <stop offset="0.76" stopColor={LIME} />
          <stop offset="1" stopColor={ORANGE} />
        </linearGradient>
        <filter id={glowId} x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {pattern === "chevrons" && (
          <pattern id={patId} width="54" height="46" patternUnits="userSpaceOnUse">
            <path d="M-8 30 L16 8 L40 30" fill="none" stroke={light} strokeWidth="7" opacity="0.15" />
            <path d="M19 46 L43 24 L67 46" fill="none" stroke={LIME} strokeWidth="3" opacity="0.1" />
          </pattern>
        )}
        {pattern === "dots" && (
          <pattern id={patId} width="34" height="34" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="4" fill="none" stroke={light} strokeWidth="1.6" opacity="0.25" />
            <circle cx="25" cy="25" r="2.5" fill={LIME} opacity="0.15" />
            <circle cx="8" cy="8" r="1.2" fill={CYAN} opacity="0.5" />
          </pattern>
        )}
        {pattern === "diagonal" && (
          <pattern id={patId} width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
            <rect width="7" height="30" fill={light} opacity="0.13" />
            <rect x="9" width="2" height="30" fill={LIME} opacity="0.12" />
          </pattern>
        )}

        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r="44" />
        </clipPath>
      </defs>

      {/* Midnight base, selected-color flare, and optional energy pattern. */}
      <rect width={VB_W} height={VB_H} rx={rx} fill={`url(#${baseId})`} />
      <ellipse cx={cx} cy={cy} rx="116" ry="142" fill={`url(#${flareId})`} />
      {pattern !== "emblem" && <rect width={VB_W} height={VB_H} rx={rx} fill={`url(#${patId})`} />}

      {/* Motion rings echo the light trails around the Minivanigans wordmark. */}
      <path d="M-22 181 C34 103 198 98 263 177" fill="none" stroke={color} strokeWidth="5" opacity="0.18" />
      <path d="M-17 199 C47 126 201 126 257 193" fill="none" stroke={CYAN} strokeWidth="2" opacity="0.24" />
      <path d="M-12 214 C62 160 184 154 252 207" fill="none" stroke={LIME} strokeWidth="2" opacity="0.14" />

      {/* Layered frame and energized edge rail. */}
      <rect x="5" y="5" width="230" height="326" rx={Math.max(0, rx - 5)} fill="none" stroke={color} strokeWidth="4" opacity="0.92" filter={`url(#${glowId})`} />
      <rect x="11" y="11" width="218" height="314" rx={Math.max(0, rx - 8)} fill="none" stroke={CYAN} strokeWidth="1.5" opacity="0.72" />
      <rect x="16" y="16" width="208" height="304" rx={Math.max(0, rx - 10)} fill="none" stroke="#174f87" strokeWidth="1" />
      <rect x="18" y="18" width="204" height="5" rx="2.5" fill={`url(#${edgeId})`} filter={`url(#${glowId})`} />

      {/* Sci-fi corner brackets. */}
      <path d="M25 55 V34 H53" fill="none" stroke={LIME} strokeWidth="3" opacity="0.8" />
      <path d="M187 34 H215 V55" fill="none" stroke={ORANGE} strokeWidth="3" opacity="0.8" />
      <path d="M25 282 V303 H53" fill="none" stroke={color} strokeWidth="3" opacity="0.75" />
      <path d="M187 303 H215 V282" fill="none" stroke={CYAN} strokeWidth="3" opacity="0.75" />

      <text
        x={cx}
        y="43"
        textAnchor="middle"
        fontFamily="'Sora Variable', sans-serif"
        fontSize="7"
        fontWeight="700"
        letterSpacing="2"
        fill={light}
      >
        ORDINARY CHARACTERS
      </text>

      {/* Central player/brand hub. */}
      <circle cx={cx} cy={cy} r="59" fill="#05142c" stroke={color} strokeWidth="4" opacity="0.98" filter={`url(#${glowId})`} />
      <circle cx={cx} cy={cy} r="51" fill="#020916" stroke={LIME} strokeWidth="2" opacity="0.96" />
      {avatar ? (
        builtin ? (
          <>
            <circle cx={cx} cy={cy} r="44" fill={builtin.bg} />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="46">
              {builtin.emoji}
            </text>
          </>
        ) : (
          avatarUrl && (
            <image
              href={avatarUrl}
              x={cx - 44}
              y={cy - 44}
              width="88"
              height="88"
              clipPath={`url(#${clipId})`}
              preserveAspectRatio="xMidYMid slice"
            />
          )
        )
      ) : (
        <g transform="translate(75.2 102.2) scale(1.4)">
          <LogoMarkContent />
        </g>
      )}
      <circle cx={cx} cy={cy} r="44" fill="none" stroke={light} strokeWidth="2.5" />

      {/* Code-rendered wordmark stays sharp at print resolution. */}
      <text
        x={cx}
        y="240"
        textAnchor="middle"
        fontFamily="'Fredoka Variable', sans-serif"
        fontSize="22"
        fontWeight="900"
        fontStyle="italic"
        letterSpacing="-0.8"
      >
        <tspan fill={CYAN}>MINI</tspan>
        <tspan fill={LIME}>VANIGANS</tspan>
        <tspan fill={ORANGE}>!</tspan>
      </text>
      <text
        x={cx}
        y="254"
        textAnchor="middle"
        fontFamily="'Sora Variable', sans-serif"
        fontSize="6.7"
        fontWeight="700"
        letterSpacing="1.2"
        fill="#8fcdf0"
      >
        EXTRAORDINARY SHIFTS
      </text>

      {username ? (
        <>
          <rect x="58" y="274" width="124" height="24" rx="12" fill={color} opacity="0.95" />
          <text
            x={cx}
            y="290"
            textAnchor="middle"
            fontFamily="'Sora Variable', sans-serif"
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.4"
            fill={accentText}
          >
            @{username}
          </text>
        </>
      ) : (
        <text
          x={cx}
          y="289"
          textAnchor="middle"
          fontFamily="'Sora Variable', sans-serif"
          fontSize="7"
          fontWeight="700"
          letterSpacing="1.5"
          fill={light}
        >
          READY · SHIFT · RIDE
        </text>
      )}
    </svg>
  );
}
