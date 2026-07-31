import textLogo from "../../../../logo/minivanigans-logo-text-only-green-vanigans-v2 transparent.png";
import fullLogo from "../../../../logo/minivanigans-logo-full-green-vanigans-v1 transparent.png";
import simpleLogo from "../assets/brand/mv-neon-van.png";
import { cn } from "../lib/cn";

/** Compact in-SVG mark used on printable card backs and export frames. */
export function LogoMarkContent() {
  return (
    <image
      href={simpleLogo}
      x="0"
      y="0"
      width="64"
      height="64"
      preserveAspectRatio="xMidYMid meet"
    />
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
