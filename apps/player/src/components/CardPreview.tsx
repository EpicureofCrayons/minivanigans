import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { ImagePlus } from "lucide-react";
import {
  defaultTemplates,
  templateKey,
  type AnyCard,
  type CardTemplate,
  type RulesConfig,
  type SlotId,
  type SlotRect,
} from "@minivanigans/rules-engine";
import { cn } from "../lib/cn";
import { FitText } from "./FitText";
import { DEFAULT_TRANSFORM } from "../lib/card";
import { useImageUrl } from "../lib/useImageUrl";
import { useLibrary } from "../store/useLibrary";

const DESIGN_W = 320;
const DESIGN_H = 448;
const ACCENTS: Record<string, string> = {
  anchor: "#2563eb",
  cannon: "#dc2626",
  pivot: "#0891b2",
  sustainer: "#16a34a",
  trickster: "#7c3aed",
  captain: "#ca8a04",
  wildcard: "#db2777",
  underdog: "#ea580c",
};

interface Props {
  card: AnyCard;
  cfg: RulesConfig;
  width?: number;
  onTransformChange?: (t: { x: number; y: number; scale: number }) => void;
  className?: string;
  flat?: boolean;
}

const pct = (r: SlotRect) => ({
  position: "absolute" as const,
  left: `${r.x}%`,
  top: `${r.y}%`,
  width: `${r.w}%`,
  height: `${r.h}%`,
});
const fontPx = (h: number, frac: number) => (h / 100) * DESIGN_H * frac;
const fontH = (h: number, frac: number) => `${fontPx(h, frac)}px`;
const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function CardPreview({ card, cfg, width = DESIGN_W, onTransformChange, className, flat = false }: Props) {
  const templates = useLibrary((s) => s.templates);
  const url = useImageUrl(card.imagePath);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const scale = width / DESIGN_W;
  const set = templates ?? defaultTemplates;
  const rarity = card.type === "Character" ? card.rarity : undefined;
  const key = templateKey(card.type, rarity);
  const template: CardTemplate = set.templates[key] ?? defaultTemplates.templates[key];
  const chassis = card.type === "Character" ? cfg.presets.find((p) => p.id === card.chassisId) : undefined;
  const accent = card.type === "Character" ? (ACCENTS[card.chassisId ?? ""] ?? "#0f766e") : "#f59e0b";
  const ribbon = template.frame === "ribbon";
  const premium = template.frame === "borderless";
  const t = card.imageTransform ?? DEFAULT_TRANSFORM;
  const editable = !!onTransformChange;
  const nameSlot = template.slots.name;
  const fullBleed = card.type === "Character" && !!card.fullBleedArt && !!url;

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!editable || !url) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: t.x, y: t.y };
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current || !onTransformChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.px) / rect.width) * 100;
    const dy = ((e.clientY - drag.current.py) / rect.height) * 100;
    onTransformChange({ x: clamp(drag.current.x - dx), y: clamp(drag.current.y - dy), scale: t.scale });
  }
  function onPointerUp() {
    drag.current = null;
  }

  const textTone = fullBleed ? "text-white" : "text-fg";

  function renderSlot(id: SlotId, h: number) {
    switch (id) {
      case "name":
        return (
          <FitText max={fontPx(h, 0.6)} fitKey={card.name} boxClassName="flex h-full w-full items-center overflow-hidden"
            className={cn("font-display font-semibold leading-tight", ribbon || fullBleed ? "text-white" : "text-fg")}>
            <span>{card.name || "Untitled card"}</span>
          </FitText>
        );
      case "hp":
        return card.type === "Character" ? (
          <div className="flex h-full items-center justify-center rounded-full font-bold text-white"
            style={{ background: accent, fontSize: fontH(h, 0.4) }}>
            {card.hp} STA
          </div>
        ) : null;
      case "art":
        if (fullBleed) return null;
        return (
          <div className={cn("relative h-full w-full overflow-hidden rounded-[10px] bg-surface-2", editable && url && "cursor-grab active:cursor-grabbing")}
            style={{ boxShadow: `inset 0 0 0 2px ${accent}44` }}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
            {url ? (
              <div className="h-full w-full" style={{
                backgroundImage: `url(${url})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                backgroundPosition: `${t.x}% ${t.y}%`,
                transform: t.scale !== 1 ? `scale(${t.scale})` : undefined,
              }} />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted">
                <div className="text-center"><ImagePlus className="mx-auto" size={24} /><span className="text-xs">Add art</span></div>
              </div>
            )}
          </div>
        );
      case "attackName":
        return card.type === "Character" ? (
          <FitText max={fontPx(h, 0.55)} fitKey={`${card.attack.name} ${chassis?.everydayName}`}
            boxClassName="h-full w-full overflow-hidden" className={textTone}>
            <div className="font-semibold">{card.attack.name || chassis?.everydayName || "Everyday Move"}</div>
            <div className={cn("text-[0.62em] font-normal", fullBleed ? "text-white/75" : "text-muted")}>
              {chassis?.everydayName} — {card.attack.damage} damage
            </div>
          </FitText>
        ) : null;
      case "attackDamage":
        return card.type === "Character" ? (
          <div className={cn("flex h-full flex-col items-end justify-center leading-none", textTone)}>
            <span className="font-bold tabular-nums" style={{ fontSize: fontH(h, 0.62) }}>{card.attack.damage}</span>
            <span className="font-semibold uppercase tracking-widest opacity-70" style={{ fontSize: fontH(h, 0.15) }}>Everyday</span>
          </div>
        ) : null;
      case "ability": {
        if (card.type !== "Character") return null;
        const def = cfg.abilities.find((a) => a.id === card.abilityId);
        if (!def) return null;
        const custom = card.abilityFlavorName?.trim() || chassis?.shiftName || def.displayName;
        return (
          <div className={cn("h-full overflow-hidden rounded-[8px] p-[3%]", !fullBleed && "bg-surface-2")}
            style={{ background: fullBleed ? "rgb(0 0 0 / 0.46)" : undefined, boxShadow: `inset 3px 0 0 ${accent}` }}>
            <FitText max={fontPx(h, 0.15)} fitKey={`${custom} ${def.displayName} ${def.description}`}
              boxClassName="h-full w-full overflow-hidden">
              <div className={cn("font-semibold", textTone)}>{custom}</div>
              <div className={cn("mt-[2%] leading-snug", fullBleed ? "text-white/85" : "text-muted")} style={{ fontSize: "0.81em" }}>
                <span className="font-medium">{chassis?.shiftName ?? def.displayName}</span> — {def.description}
              </div>
            </FitText>
          </div>
        );
      }
      case "effect": {
        if (card.type !== "Support") return null;
        const def = cfg.supportEffects.find((e) => e.id === card.effectId);
        const custom = card.effectFlavorName?.trim() || def?.displayName || "Moment";
        return (
          <FitText max={fontPx(h, 0.11)} fitKey={`${custom} ${def?.displayName} ${def?.description}`}
            boxClassName="h-full w-full overflow-hidden">
            <div className="font-semibold text-fg">{custom}</div>
            <div className="mt-[2%] leading-snug text-muted" style={{ fontSize: "0.82em" }}>
              <span className="font-medium">{def?.displayName}</span>{def ? ` — ${def.description}` : "No effect selected."}
            </div>
          </FitText>
        );
      }
      case "classMarker":
        return card.type === "Character" ? (
          <div className="flex h-full items-center justify-center rounded-full font-bold uppercase tracking-wide text-white"
            style={{ background: accent, fontSize: fontH(h, 0.32) }}>
            {chassis?.displayName.replace(/^The /, "") ?? "Character"}
          </div>
        ) : null;
      case "rarityMarker":
        return card.type === "Character" ? (
          <div className="flex h-full items-center justify-center rounded-full bg-surface-2 font-bold uppercase tracking-wide text-muted"
            style={{ boxShadow: "inset 0 0 0 1px var(--border)", fontSize: fontH(h, 0.35) }}>
            Shift
          </div>
        ) : null;
      case "typeLabel":
        return <div className="flex h-full items-center justify-center font-semibold uppercase tracking-widest text-muted" style={{ fontSize: fontH(h, 0.6) }}>Moment</div>;
    }
  }

  return (
    <div className={cn("shrink-0", className)} style={{ width, height: width * (DESIGN_H / DESIGN_W) }}>
      <div className="relative origin-top-left overflow-hidden bg-surface text-fg" style={{
        width: DESIGN_W,
        height: DESIGN_H,
        transform: `scale(${scale})`,
        borderRadius: template.cornerRadius,
        border: premium ? "2px solid transparent" : `3px solid ${accent}`,
        background: premium
          ? `linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(140deg, ${accent}, #f59e0b) border-box`
          : "var(--surface)",
        boxShadow: flat ? undefined : "0 12px 28px -10px rgb(0 0 0 / 0.45), 0 3px 8px -2px rgb(0 0 0 / 0.18)",
      }}>
        {fullBleed && (
          <>
            <div className={cn("absolute inset-0", editable && "cursor-grab active:cursor-grabbing")}
              style={{ backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: `${t.x}% ${t.y}%`, transform: t.scale !== 1 ? `scale(${t.scale})` : undefined }}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[26%] bg-gradient-to-b from-black/60 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/75 to-transparent" />
          </>
        )}
        {!flat && !fullBleed && <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(120% 70% at 50% 30%, ${accent}22, transparent 70%)` }} />}
        {ribbon && nameSlot && (
          <div className="pointer-events-none absolute" style={{
            left: 0, top: `${nameSlot.y - 1}%`, width: `${nameSlot.x + nameSlot.w}%`, height: `${nameSlot.h + 2}%`,
            background: `linear-gradient(180deg, ${accent}, ${accent}dd)`, borderTopRightRadius: 999, borderBottomRightRadius: 999,
          }} />
        )}
        {(Object.keys(template.slots) as SlotId[]).map((id) => {
          const r = template.slots[id];
          return r ? <div key={id} style={pct(r)}>{renderSlot(id, r.h)}</div> : null;
        })}
      </div>
    </div>
  );
}
