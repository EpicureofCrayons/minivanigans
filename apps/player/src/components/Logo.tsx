import textLogo from "../../../../logo/minivanigans-logo-text-only-green-vanigans-v2 transparent.png";
import fullLogo from "../../../../logo/minivanigans-logo-full-green-vanigans-v1 transparent.png";
import { cn } from "../lib/cn";

/** Compact in-SVG mark used on printable card backs and export frames. */
export function LogoMarkContent({ onLight = false }: { onLight?: boolean }) {
  return (
    <g>
      <rect x="5" y="12" width="54" height="40" rx="12" fill={onLight ? "#0f766e" : "#f4f7ff"} />
      <path d="M15 39V24l9 10 8-12 8 12 9-10v15" fill="none" stroke={onLight ? "#d9f99d" : "#84cc16"} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="48" r="5" fill="#f59e0b" />
      <circle cx="46" cy="48" r="5" fill="#f59e0b" />
    </g>
  );
}

export function Logo({
  size = 64,
  badge = false,
  className,
}: {
  size?: number;
  badge?: boolean;
  onLight?: boolean;
  className?: string;
}) {
  return (
    <img
      src={badge ? fullLogo : textLogo}
      alt="Minivanigans!"
      className={cn("object-contain", className)}
      style={{ width: badge ? size * 1.55 : size * 2.8, height: size }}
    />
  );
}
