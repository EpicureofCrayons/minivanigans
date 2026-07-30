import type { AnyCard, Profile, RulesConfig } from "@minivanigans/rules-engine";
import { AvatarView } from "./AvatarView";
import { CardPreview } from "./CardPreview";
import { cn } from "../lib/cn";

// Designed at a fixed 4:6 size and scaled to the requested width, so the printed
// badge and the on-screen preview stay identical in proportion.
const DESIGN_W = 400;
const DESIGN_H = 600; // 4" × 6" portrait

/** A stable, friendly-looking fake employee number derived from the username. */
function employeeId(username: string): string {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) & 0xffff;
  return `DS-${String(1000 + (h % 9000))}`;
}

export function Lanyard({
  profile,
  favoriteCard,
  cfg,
  width = DESIGN_W,
  className,
}: {
  profile: Profile;
  favoriteCard?: AnyCard;
  cfg: RulesConfig;
  width?: number;
  className?: string;
}) {
  const scale = width / DESIGN_W;
  const name = profile.username.trim() || "New Employee";
  const id = employeeId(profile.username.trim() || "unknown");

  return (
    <div className={cn("shrink-0", className)} style={{ width, height: width * (DESIGN_H / DESIGN_W) }}>
      <div
        className="lanyard-card relative origin-top-left overflow-hidden bg-surface text-fg"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          borderRadius: 24,
          border: "3px solid var(--brand)",
          boxShadow: "0 1px 0 rgb(255 255 255 / 0.25) inset, 0 14px 32px -12px rgb(0 0 0 / 0.45)",
        }}
      >
        {/* lanyard slot cutout */}
        <div
          className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full"
          style={{ width: 64, height: 12, background: "var(--bg)", boxShadow: "inset 0 0 0 2px var(--border)" }}
        />

        {/* header band */}
        <div
          className="flex flex-col items-center gap-0.5 px-5 pb-4 pt-7 text-center text-brand-fg"
          style={{ background: "linear-gradient(180deg, var(--brand), color-mix(in srgb, var(--brand) 82%, black))" }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] opacity-90">Minivanigans!</span>
          <span className="font-display text-2xl font-bold leading-none">EMPLOYEE BADGE</span>
        </div>

        {/* avatar + identity */}
        <div className="flex flex-col items-center gap-1.5 px-5 pt-4">
          <AvatarView avatar={profile.avatar} size={118} className="ring-4 ring-surface-2 shadow-md" />
          <div className="text-center">
            <div className="font-display text-2xl font-semibold leading-tight text-fg">{name}</div>
            <div className="text-sm font-medium text-muted">Day Shift Crew</div>
          </div>
        </div>

        {/* assigned fighter */}
        <div className="mt-3 px-5">
          <div className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-widest text-muted">
            Assigned Fighter
          </div>
          <div className="flex justify-center">
            {favoriteCard ? (
              <CardPreview card={favoriteCard} cfg={cfg} width={132} />
            ) : (
              <div className="grid h-[185px] w-[132px] place-items-center rounded-card border border-dashed border-line text-center text-xs text-muted">
                No favorite picked yet
              </div>
            )}
          </div>
        </div>

        {/* footer: id + barcode */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t border-line bg-surface-2 px-5 py-3">
          <div className="leading-tight">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">ID</div>
            <div className="font-mono text-sm font-semibold text-fg">{id}</div>
          </div>
          <div
            className="h-8 flex-1"
            style={{
              maxWidth: 150,
              background:
                "repeating-linear-gradient(90deg, var(--fg) 0 2px, transparent 2px 4px, var(--fg) 4px 5px, transparent 5px 9px)",
              opacity: 0.85,
            }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
