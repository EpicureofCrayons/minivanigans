import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ImageUp, Printer, Wand2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { AvatarView } from "../components/AvatarView";
import { Lanyard } from "../components/Lanyard";
import { useLibrary } from "../store/useLibrary";
import { useProfile } from "../store/useProfile";
import { storage } from "../lib/storage";
import { BUILTIN_AVATARS } from "../lib/avatars";
import { cn } from "../lib/cn";

const inputCls =
  "w-full rounded-card border border-line bg-surface px-3 py-2 text-sm text-fg outline-none placeholder:text-muted focus:border-brand";
const MAX_AVATAR_BYTES = 8 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function Profile() {
  const navigate = useNavigate();
  const cards = useLibrary((s) => s.cards);
  const cfg = useLibrary((s) => s.config);
  const profile = useProfile((s) => s.profile);
  const patch = useProfile((s) => s.patch);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);

  const characters = cards.filter((c) => c.type === "Character");
  const favoriteCard = cards.find((c) => c.id === profile.favoriteCardId);
  const selectedBuiltin = profile.avatar.kind === "builtin" ? profile.avatar.id : null;

  async function onUploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!AVATAR_TYPES.has(file.type)) {
      setAvatarMessage("Choose a PNG, JPG, or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarMessage("That image is larger than 8 MB. Choose a smaller file.");
      return;
    }

    setUploadingAvatar(true);
    setAvatarMessage(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const ref = await storage.saveImage(bytes, ext);
      await patch({ avatar: { kind: "image", ref } });
      setAvatarMessage("Your image is now your avatar.");
    } catch (error) {
      setAvatarMessage(
        `Could not save that image: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Set up your employee badge — it's printable for your lanyard and travels with anything you share."
        actions={
          <Button variant="primary" onClick={() => navigate("/lanyard")}>
            <Printer size={16} /> Print lanyard
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(300px,360px)]">
        {/* form */}
        <div className="space-y-6">
          <Field label="Username">
            <input
              className={inputCls}
              value={profile.username}
              placeholder="e.g. Sam from Shipping"
              onChange={(e) => patch({ username: e.target.value })}
            />
          </Field>

          <Field label="Avatar">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onUploadAvatar}
            />
            <div className="flex flex-wrap gap-2">
              {BUILTIN_AVATARS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setAvatarMessage(null);
                    void patch({ avatar: { kind: "builtin", id: a.id } });
                  }}
                  title={a.label}
                  aria-label={`Use ${a.label} avatar`}
                  className={cn(
                    "rounded-full p-0.5 transition",
                    selectedBuiltin === a.id ? "ring-2 ring-brand ring-offset-2 ring-offset-bg" : "hover:opacity-80"
                  )}
                >
                  <AvatarView avatar={{ kind: "builtin", id: a.id }} size={44} />
                </button>
              ))}
            </div>

            <div
              className={cn(
                "mt-4 flex flex-col gap-4 rounded-card border bg-surface-2 p-4 sm:flex-row sm:items-center",
                profile.avatar.kind === "image" ? "border-brand/60" : "border-line"
              )}
            >
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-surface text-muted">
                {profile.avatar.kind === "image" ? (
                  <AvatarView avatar={profile.avatar} size={64} />
                ) : (
                  <ImageUp size={24} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-fg">
                  Use your own image
                  {profile.avatar.kind === "image" && <Check size={15} className="text-success" />}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Choose a PNG, JPG, or WebP up to 8 MB. It will be cropped to a circle automatically.
                </p>
              </div>

              <Button
                variant={profile.avatar.kind === "image" ? "secondary" : "primary"}
                disabled={uploadingAvatar}
                onClick={() => fileRef.current?.click()}
                className="shrink-0"
              >
                <ImageUp size={16} />
                {uploadingAvatar
                  ? "Saving…"
                  : profile.avatar.kind === "image"
                    ? "Replace image"
                    : "Upload an image"}
              </Button>
            </div>

            {avatarMessage && (
              <p
                role="status"
                className={cn(
                  "mt-2 text-xs",
                  avatarMessage.startsWith("Could not") || avatarMessage.startsWith("Choose") || avatarMessage.startsWith("That")
                    ? "text-danger"
                    : "text-success"
                )}
              >
                {avatarMessage}
              </p>
            )}

            <div className="mt-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">or</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <Button variant="secondary" className="mt-3" onClick={() => navigate("/avatar")}>
              <Wand2 size={16} /> {profile.avatarRecipe ? "Edit your custom avatar" : "Build your own avatar"}
            </Button>
          </Field>

          <Field label="Favorite character" hint="Shown as your 'Assigned Fighter' on the badge.">
            {characters.length === 0 ? (
              <p className="text-sm text-muted">
                You have no Character cards yet — make one in the Card Builder and it'll show up here.
              </p>
            ) : (
              <select
                className={inputCls}
                value={profile.favoriteCardId ?? ""}
                onChange={(e) => patch({ favoriteCardId: e.target.value || undefined })}
              >
                <option value="">None</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || "Untitled"} — {c.type === "Character" ? c.cardClass : ""}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <p className="flex items-center gap-1.5 text-sm text-success">
            <Check size={15} /> Saved automatically.
          </p>
        </div>

        {/* live lanyard preview */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface-2 p-6">
            <Lanyard profile={profile} favoriteCard={favoriteCard} cfg={cfg} width={300} />
            <p className="text-xs text-muted">Your lanyard badge (4″ × 6″)</p>
          </div>
        </div>
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
