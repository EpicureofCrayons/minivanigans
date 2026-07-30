import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, ImageUp, RotateCcw, Save, Sparkles, Trash2 } from "lucide-react";
import {
  validateCard,
  type AnyCard,
  type CardType,
  type ChassisDef,
} from "@minivanigans/rules-engine";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { Segmented } from "../components/ui/Segmented";
import { CardPreview } from "../components/CardPreview";
import { useLibrary } from "../store/useLibrary";
import { storage } from "../lib/storage";
import { applyChassis, blankCard, DEFAULT_TRANSFORM } from "../lib/card";
import { cn } from "../lib/cn";

const inputCls =
  "w-full rounded-card border border-line bg-surface px-3 py-2 text-sm text-fg outline-none placeholder:text-muted focus:border-brand";

export function CardBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cfg = useLibrary((s) => s.config);
  const cards = useLibrary((s) => s.cards);
  const upsertCard = useLibrary((s) => s.upsertCard);

  const [card, setCard] = useState<AnyCard>(() => blankCard("Character", cfg));
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const editing = Boolean(id);

  // Load an existing card when the route carries an id (used by the Library).
  useEffect(() => {
    if (!id) return;
    const existing = cards.find((c) => c.id === id);
    if (existing) setCard(existing);
  }, [id, cards]);

  const result = useMemo(() => validateCard(card, cfg), [card, cfg]);

  // Typed helper to patch the current card immutably.
  function patch<T extends AnyCard>(updates: Partial<T>) {
    setStatus(null);
    setCard((c) => ({ ...c, ...updates, updatedAt: new Date().toISOString() }) as AnyCard);
  }

  function changeType(type: CardType) {
    setStatus(null);
    setCard((c) => {
      const fresh = blankCard(type, cfg);
      // Carry over identity, name and art across a type switch.
      return {
        ...fresh,
        id: c.id,
        name: c.name,
        imagePath: c.imagePath,
        imageTransform: c.imageTransform,
        createdAt: c.createdAt,
      } as AnyCard;
    });
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const ref = await storage.saveImage(bytes, ext);
    patch({ imagePath: ref, imageTransform: { ...DEFAULT_TRANSFORM } });
  }

  async function onSave() {
    if (!result.ok) return;
    await upsertCard(card);
    setStatus("Saved.");
  }

  const t = card.imageTransform ?? DEFAULT_TRANSFORM;

  return (
    <div>
      <PageHeader
        title={editing ? "Edit Card" : "Card Builder"}
        subtitle="Design a card on the left; the preview updates as you type. Save unlocks once the card is legal."
        actions={
          <Button variant="primary" onClick={onSave} disabled={!result.ok}>
            <Save size={16} /> Save card
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(300px,360px)]">
        {/* ---- Form ---- */}
        <div className="space-y-5">
          <Field label="Card type">
            <Segmented
              options={["Character", "Support"] as CardType[]}
              labels={{ Character: "Character", Support: "Moment" }}
              value={card.type}
              onChange={changeType}
            />
          </Field>

          <Field label="Name" error={fieldError(result.errors, ["name", "Code of Conduct"])}>
            <input
              className={inputCls}
              value={card.name}
              placeholder="e.g. Jogging Dad"
              onChange={(e) => patch({ name: e.target.value })}
            />
          </Field>

          {card.type === "Character" && (
            <>
              <Field
                label="Chassis"
                hint="Fixes Stamina and both standard moves; names and art are yours."
                error={fieldError(result.errors, ["chassis", "Preset Roster", "fixed by the chassis"])}
              >
                <ChassisPicker
                  presets={cfg.presets}
                  value={card.chassisId}
                  onPick={(id) => {
                    setStatus(null);
                    setCard((c) =>
                      c.type === "Character"
                        ? { ...applyChassis(c, id, cfg), updatedAt: new Date().toISOString() }
                        : c
                    );
                  }}
                />
              </Field>

              <div className="rounded-card border border-line bg-surface p-4">
                <div className="mb-3 text-sm font-semibold text-fg">Make it yours</div>
                <Field label="Everyday Move name" error={fieldError(result.errors, ["Everyday Move needs"])}>
                  <input
                    className={inputCls}
                    value={card.attack.name}
                    placeholder="e.g. Espresso Shot"
                    onChange={(e) =>
                      patch({ attack: { ...card.attack, name: e.target.value } })
                    }
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    The card also prints the standard move and its {card.attack.damage} damage.
                  </p>
                </Field>

                {(() => {
                  const a = cfg.abilities.find((x) => x.id === card.abilityId);
                  if (!a || a.id === "none") return null;
                  return (
                    <Field label={`Shift Move — ${a.displayName}`} className="mt-4">
                      <p className="text-xs text-muted">{a.description}</p>
                      <input
                        className={cn(inputCls, "mt-2")}
                        value={card.abilityFlavorName ?? ""}
                        placeholder={`Custom Shift name (optional) — default “${a.displayName}”`}
                        onChange={(e) => patch({ abilityFlavorName: e.target.value || undefined })}
                      />
                      <p className="mt-1.5 text-xs text-muted">
                        Renames are flavor only — the card always shows the real effect underneath.
                      </p>
                    </Field>
                  );
                })()}
              </div>
            </>
          )}

          {card.type === "Support" && (
            <Field label="Standard Moment" error={fieldError(result.errors, ["Moment effect"])}>
              <select
                className={inputCls}
                value={card.effectId}
                onChange={(e) => patch({ effectId: e.target.value })}
              >
                {cfg.supportEffects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName}
                    {s.maxPerDeck ? ` (max ${s.maxPerDeck}/deck)` : ""}
                  </option>
                ))}
              </select>
              {(() => {
                const s = cfg.supportEffects.find((x) => x.id === card.effectId);
                if (!s) return null;
                return (
                  <>
                    <p className="mt-1.5 text-xs text-muted">{s.description}</p>
                    <input
                      className={cn(inputCls, "mt-2")}
                      value={card.effectFlavorName ?? ""}
                      placeholder={`Rename on card (optional) — default “${s.displayName}”`}
                      onChange={(e) => patch({ effectFlavorName: e.target.value || undefined })}
                    />
                  </>
                );
              })()}
            </Field>
          )}

          {/* Artwork */}
          <Field label="Artwork" hint="Drag the image in the preview to reposition.">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickImage}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                <ImageUp size={16} /> {card.imagePath ? "Replace image" : "Upload image"}
              </Button>
              {card.imagePath && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => patch({ imageTransform: { ...DEFAULT_TRANSFORM } })}
                  >
                    <RotateCcw size={16} /> Reset framing
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => patch({ imagePath: undefined })}
                  >
                    <Trash2 size={16} /> Remove
                  </Button>
                </>
              )}
            </div>
            {card.imagePath && (
              <label className="mt-3 flex items-center gap-3 text-xs text-muted">
                <span className="w-10">Zoom</span>
                <input
                  type="range"
                  className="flex-1 accent-[var(--brand)]"
                  min={1}
                  max={3}
                  step={0.05}
                  value={t.scale}
                  onChange={(e) =>
                    patch({ imageTransform: { ...t, scale: Number(e.target.value) } })
                  }
                />
                <span className="w-10 text-right tabular-nums">{t.scale.toFixed(2)}×</span>
              </label>
            )}
          </Field>
        </div>

        {/* ---- Live preview + budget ---- */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface-2 p-6">
            <CardPreview
              card={card}
              cfg={cfg}
              width={300}
              onTransformChange={(imageTransform) => patch({ imageTransform })}
            />

            <div className="w-full space-y-1.5">
              {result.ok ? (
                <p className="flex items-center gap-1.5 text-sm font-medium text-success">
                  <Check size={16} /> Legal card — ready to save.
                </p>
              ) : (
                result.errors.map((err) => (
                  <p key={err} className="flex items-start gap-1.5 text-sm text-danger">
                    <Sparkles size={15} className="mt-0.5 shrink-0" /> {err}
                  </p>
                ))
              )}
            </div>

            {status && (
              <p aria-live="polite" className="flex w-full items-center justify-between text-sm text-fg">
                <span className="text-success">{status}</span>
                <button
                  className="text-muted underline-offset-2 hover:underline"
                  onClick={() => {
                    setCard(blankCard(card.type, cfg));
                    setStatus(null);
                    if (editing) navigate("/builder");
                  }}
                >
                  Start a new card
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-fg">{label}</label>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}

/** First validation error whose text matches one of the given substrings. */
function fieldError(errors: string[], needles: string[]): string | undefined {
  return errors.find((e) => needles.some((n) => e.toLowerCase().includes(n.toLowerCase())));
}

/** The Rules v5 chassis grid. */
function ChassisPicker({
  presets,
  value,
  onPick,
}: {
  presets: ChassisDef[];
  value: string | undefined;
  onPick: (id: string) => void;
}) {
  const cardBtn = (p: ChassisDef) => (
    <button
      key={p.id}
      type="button"
      onClick={() => onPick(p.id)}
      className={cn(
        "rounded-card border p-3 text-left transition",
        value === p.id
          ? "border-brand bg-brand/10 ring-1 ring-brand"
          : "border-line bg-surface hover:border-muted"
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-fg">{p.displayName}</span>
        <span className="text-xs tabular-nums text-muted">
          {p.hp} Stamina
        </span>
      </div>
      <div className="mt-1 text-xs text-fg">
        <span className="font-semibold">{p.everydayName}</span> · {p.damage} damage
      </div>
      <div className="mt-0.5 text-xs text-brand">
        <span className="font-semibold">{p.shiftName}</span> · {p.shiftDamage} damage{p.shiftEffect ? ` · ${p.shiftEffect}` : ""}
      </div>
      <p className="mt-1 text-xs leading-snug text-muted">{p.identity}</p>
    </button>
  );

  return (
    <div className="grid gap-2 sm:grid-cols-2">{presets.map(cardBtn)}</div>
  );
}
