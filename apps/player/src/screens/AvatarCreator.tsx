import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Check, RotateCcw, Save } from "lucide-react";
import type { AvatarRecipe } from "@minivanigans/rules-engine";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { useProfile } from "../store/useProfile";
import { storage } from "../lib/storage";
import { cn } from "../lib/cn";
import {
  AvatarSvg,
  PartThumb,
  PARTS,
  CATEGORIES,
  CATEGORY_ORDER,
  SKIN_TONES,
  BG_COLORS,
  defaultRecipe,
  type AvatarCategory,
} from "../lib/avatarParts";

const PREVIEW = 300;
const EXPORT_SIZE = 256;
const POS_LIMIT = 28; // dx/dy clamp in avatar units

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function AvatarCreator() {
  const navigate = useNavigate();
  const profile = useProfile((s) => s.profile);
  const patch = useProfile((s) => s.patch);

  const [recipe, setRecipe] = useState<AvatarRecipe>(() => profile.avatarRecipe ?? defaultRecipe());
  const [activeCat, setActiveCat] = useState<AvatarCategory>("hair");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const exportRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ px: number; py: number; dx: number; dy: number } | null>(null);

  const meta = CATEGORIES[activeCat];
  const feature = recipe[activeCat];
  const placeable = feature.style !== "none";

  function updateFeature(cat: AvatarCategory, p: Partial<AvatarRecipe[AvatarCategory]>) {
    setStatus(null);
    setRecipe((r) => ({ ...r, [cat]: { ...r[cat], ...p } }));
  }

  // --- drag the active feature on the preview ---
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!placeable) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, dx: feature.dx, dy: feature.dy };
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const f = 100 / PREVIEW; // px → avatar units
    const nx = clamp(drag.current.dx + (e.clientX - drag.current.px) * f, -POS_LIMIT, POS_LIMIT);
    const ny = clamp(drag.current.dy + (e.clientY - drag.current.py) * f, -POS_LIMIT, POS_LIMIT);
    updateFeature(activeCat, { dx: Math.round(nx * 10) / 10, dy: Math.round(ny * 10) / 10 });
  }
  function onPointerUp() {
    drag.current = null;
  }

  async function onSave() {
    const svg = exportRef.current;
    if (!svg || saving) return;
    setSaving(true);
    setStatus(null);
    try {
      const bytes = await rasterize(svg, EXPORT_SIZE);
      const ref = await storage.saveImage(bytes, "png");
      await patch({ avatar: { kind: "image", ref }, avatarRecipe: recipe });
      setStatus("Saved as your profile picture.");
    } catch (e) {
      setStatus(`Couldn't save: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  const swatchCls = (selected: boolean) =>
    cn(
      "h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-surface-2 transition",
      selected ? "ring-fg" : "ring-transparent hover:ring-line"
    );

  return (
    <div>
      <PageHeader
        title="Avatar Creator"
        subtitle="Build a face from scratch — pick parts, recolour them, and drag them into place. Saves as your profile picture."
        actions={
          <Button variant="primary" onClick={onSave} disabled={saving}>
            <Save size={16} /> {saving ? "Saving…" : "Save as avatar"}
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(280px,340px)]">
        {/* ---- Controls ---- */}
        <div className="space-y-6">
          {/* Skin + background */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Skin tone">
              <div className="flex flex-wrap gap-2">
                {SKIN_TONES.map((c) => (
                  <button key={c} className={swatchCls(recipe.skin === c)} style={{ background: c }}
                    onClick={() => { setStatus(null); setRecipe((r) => ({ ...r, skin: c })); }} aria-label={`Skin ${c}`} />
                ))}
              </div>
            </Field>
            <Field label="Background">
              <div className="flex flex-wrap gap-2">
                {BG_COLORS.map((c) => (
                  <button key={c} className={swatchCls(recipe.bg === c)} style={{ background: c }}
                    onClick={() => { setStatus(null); setRecipe((r) => ({ ...r, bg: c })); }} aria-label={`Background ${c}`} />
                ))}
              </div>
            </Field>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={cn(
                  "rounded-card px-3 py-1.5 text-sm font-medium transition",
                  activeCat === cat ? "bg-brand text-brand-fg" : "bg-surface-2 text-muted hover:text-fg"
                )}
              >
                {CATEGORIES[cat].label}
              </button>
            ))}
          </div>

          {/* Style options */}
          <Field label={`${meta.label} style`}>
            <div className="flex flex-wrap gap-2">
              {PARTS[activeCat].map((opt) => {
                const selected = feature.style === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => updateFeature(activeCat, { style: opt.id })}
                    title={opt.label}
                    className={cn(
                      "grid h-14 w-14 place-items-center rounded-card border bg-surface transition",
                      selected ? "border-brand ring-2 ring-brand/40" : "border-line hover:border-muted"
                    )}
                  >
                    <PartThumb opt={opt} color={feature.color ?? meta.defaultColor} />
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Colour palette */}
          {meta.recolor && placeable && (
            <Field label={`${meta.label} colour`}>
              <div className="flex flex-wrap gap-2">
                {meta.palette.map((c) => (
                  <button key={c} className={swatchCls((feature.color ?? meta.defaultColor) === c)} style={{ background: c }}
                    onClick={() => updateFeature(activeCat, { color: c })} aria-label={`${meta.label} ${c}`} />
                ))}
              </div>
            </Field>
          )}

          {/* Placement */}
          {placeable && (
            <Field label="Placement" hint="Drag the part on the preview to move it.">
              <div className="flex items-center gap-3">
                <span className="w-10 text-xs text-muted">Size</span>
                <input
                  type="range"
                  className="flex-1 accent-[var(--brand)]"
                  min={0.5}
                  max={1.8}
                  step={0.05}
                  value={feature.scale}
                  onChange={(e) => updateFeature(activeCat, { scale: Number(e.target.value) })}
                />
                <span className="w-10 text-right text-xs tabular-nums">{feature.scale.toFixed(2)}×</span>
                <button
                  className="flex items-center gap-1 text-xs text-muted hover:text-fg"
                  onClick={() => updateFeature(activeCat, { dx: 0, dy: 0, scale: 1 })}
                >
                  <RotateCcw size={13} /> reset
                </button>
              </div>
            </Field>
          )}

          <button
            className="text-sm text-muted underline-offset-2 hover:text-fg hover:underline"
            onClick={() => { setRecipe(defaultRecipe()); setStatus(null); }}
          >
            Start over from a blank face
          </button>
        </div>

        {/* ---- Live preview ---- */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface-2 p-6">
            <div
              className={cn("overflow-hidden rounded-full shadow-[var(--shadow-soft)]", placeable && "cursor-move")}
              style={{ width: PREVIEW, height: PREVIEW, touchAction: "none" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              <AvatarSvg recipe={recipe} size={PREVIEW} />
            </div>
            <p className="text-xs text-muted">
              {placeable ? `Drag to move “${PARTS[activeCat].find((o) => o.id === feature.style)?.label}”.` : "Pick a style, then drag to place it."}
            </p>
            {status && (
              <p aria-live="polite" className="flex items-center gap-1.5 text-sm text-success">
                <Check size={15} /> {status}
              </p>
            )}
            <button className="text-sm text-muted hover:text-fg" onClick={() => navigate("/profile")}>
              Back to profile
            </button>
          </div>
        </div>
      </div>

      {/* Hidden, fixed-size copy used only for rasterising to PNG. */}
      <div style={{ position: "absolute", left: -9999, top: -9999, width: EXPORT_SIZE, height: EXPORT_SIZE }} aria-hidden>
        <AvatarSvg recipe={recipe} size={EXPORT_SIZE} svgRef={exportRef} />
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-fg">{label}</label>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/** Rasterise a self-contained SVG element to PNG bytes via an offscreen canvas. */
async function rasterize(svg: SVGSVGElement, size: number): Promise<Uint8Array> {
  const xml = new XMLSerializer().serializeToString(svg);
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("could not render the avatar"));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(img, 0, 0, size, size);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), "image/png"));
  if (!blob) throw new Error("export failed");
  return new Uint8Array(await blob.arrayBuffer());
}
