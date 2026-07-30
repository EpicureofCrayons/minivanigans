import { type AnyCard, type RulesConfig } from "@minivanigans/rules-engine";
import { CardPreview } from "./CardPreview";
import { LogoMarkContent } from "./Logo";
import { CLASS_THEME } from "../lib/card";

const CARD_W = 460; // card render width inside the scene (px, before export upscale)
const PAD_X = 96;
const PAD_TOP = 96;
const PAD_BOTTOM = 132;

/**
 * A shareable "hero" framing of a single card: the card floating on a class-tinted
 * gradient with a soft glow and the game wordmark. Rendered off-screen and
 * rasterized to PNG by lib/exportImage. It deliberately avoids app theme tokens
 * (CSS variables) so the exported image looks the same regardless of light/dark.
 */
export function CardShowcase({ card, cfg }: { card: AnyCard; cfg: RulesConfig }) {
  const cls = card.type === "Character" ? card.cardClass : undefined;
  const accent = cls ? CLASS_THEME[cls].ring : "#0f766e";
  const width = CARD_W + PAD_X * 2;

  return (
    <div
      style={{
        width,
        padding: `${PAD_TOP}px ${PAD_X}px ${PAD_BOTTOM}px`,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: `radial-gradient(120% 80% at 50% 18%, ${accent}40, transparent 60%), linear-gradient(160deg, #14181f 0%, #0b0d12 55%, #070809 100%)`,
        fontFamily: '"Fredoka Variable", system-ui, sans-serif',
      }}
    >
      {/* Glow pooled behind the card */}
      <div
        style={{
          position: "absolute",
          top: PAD_TOP - 24,
          width: CARD_W + 80,
          height: CARD_W * (448 / 320) + 80,
          background: `radial-gradient(50% 50% at 50% 50%, ${accent}55, transparent 70%)`,
          filter: "blur(28px)",
        }}
      />
      <div style={{ position: "relative", filter: "drop-shadow(0 30px 50px rgba(0,0,0,0.55))" }}>
        <CardPreview card={card} cfg={cfg} width={CARD_W} flat />
      </div>

      {/* Wordmark */}
      <div
        style={{
          position: "absolute",
          bottom: PAD_BOTTOM - 76,
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: 0.92,
        }}
      >
        <svg viewBox="0 0 64 64" width={34} height={34} aria-hidden>
          <LogoMarkContent />
        </svg>
        <span
          style={{
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "#f4f6f8",
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}
        >
          Minivanigans!
        </span>
      </div>
    </div>
  );
}
