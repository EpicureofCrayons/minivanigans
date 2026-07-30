import { Printer, Sparkles } from "lucide-react";
import type { Garage } from "@minivanigans/rules-engine";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { Vehicle, VEHICLES } from "../components/Vehicle";
import { Logo } from "../components/Logo";
import { useProfile } from "../store/useProfile";
import { useLibrary } from "../store/useLibrary";
import { DEFAULT_AVATAR } from "../lib/avatars";
import { cn } from "../lib/cn";
import { contrastText, shade } from "../lib/color";
import { openPrintDialog } from "../lib/print";

const DEFAULT_GARAGE: Garage = { vehicle: "minivan", color: "#078dfb", plate: "", name: "" };

const PALETTE = [
  "#078dfb",
  "#00bde9",
  "#9cd900",
  "#ff8a00",
  "#6657e8",
  "#e044d3",
  "#ef4444",
  "#64748b",
];

// Landscape US Letter in CSS px (1in = 96px).
const PAGE = { w: 11 * 96, h: 8.5 * 96 };
const PREVIEW_W = 580;

/** A labelled play-area zone sized to hold a real 2.5"×3.5" card. */
function Slot({
  label,
  sub,
  color,
  active,
}: {
  label: string;
  sub?: string;
  color: string;
  active?: boolean;
}) {
  const light = shade(color, 0.42);
  const dark = shade(color, -0.52);
  const labelText = contrastText(color);

  return (
    <div className="flex flex-col items-center" style={{ width: "2.5in" }}>
      <div
        className="mb-1 w-full rounded-t-lg border px-2 py-1 text-center font-display text-[13px] font-black uppercase tracking-[0.14em]"
        style={{
          borderColor: light,
          background: active
            ? `linear-gradient(90deg, ${color}, ${light})`
            : `linear-gradient(90deg, ${dark}, ${color})`,
          color: active ? labelText : "#f5fcff",
          boxShadow: `0 0 ${active ? 20 : 14}px ${color}55`,
        }}
      >
        {label}
      </div>
      <div
        className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-b-lg rounded-tr-lg text-center"
        style={{
          height: "3.5in",
          border: `2px dashed ${active ? light : color}`,
          background: active
            ? `radial-gradient(circle at 50% 45%, ${color}38, transparent 64%), rgba(4,21,44,.8)`
            : `radial-gradient(circle at 50% 45%, ${color}25, transparent 64%), rgba(4,21,44,.7)`,
          boxShadow: `inset 0 0 26px ${color}16`,
        }}
      >
        <div className="absolute left-2 top-2 h-5 w-5 border-l-2 border-t-2" style={{ borderColor: light }} />
        <div className="absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2" style={{ borderColor: light }} />
        <span className="font-display text-[11px] font-semibold uppercase tracking-wide" style={{ color: light }}>
          {sub ?? "place a card here"}
        </span>
      </div>
    </div>
  );
}

export function Playmat() {
  const profile = useProfile((s) => s.profile);
  const cfg = useLibrary((s) => s.config);
  const patch = useProfile((s) => s.patch);
  const garage = profile.garage ?? DEFAULT_GARAGE;

  const set = (updates: Partial<Garage>) => patch({ garage: { ...garage, ...updates } });
  const bannerName = garage.name?.trim() || profile.username?.trim() || "My";
  const scale = PREVIEW_W / PAGE.w;
  const glow = garage.color;
  const glowLight = shade(glow, 0.45);
  const glowDark = shade(glow, -0.52);

  // Only put a face on the ride once the player has personalised their profile.
  const defaultAvatarId = DEFAULT_AVATAR.kind === "builtin" ? DEFAULT_AVATAR.id : "";
  const hasCustomAvatar =
    profile.avatar.kind === "image" ||
    (profile.avatar.kind === "builtin" && profile.avatar.id !== defaultAvatarId);
  const driverAvatar = hasCustomAvatar || profile.username.trim() ? profile.avatar : undefined;

  const inputCls =
    "w-full rounded-card border border-line bg-surface/80 px-3 py-2 text-sm text-fg outline-none transition focus:border-brand focus:shadow-[0_0_0_3px_rgba(7,141,251,0.12)]";

  return (
    <div>
      <PageHeader
        title="My Ride (Play Mat)"
        subtitle="Build your crew's ride, choose its glow, then print a full neon game mat."
        actions={
          <Button variant="primary" onClick={() => void openPrintDialog()}>
            <Printer size={16} /> Print / Save PDF
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[300px_1fr] print:block">
        {/* Controls (hidden when printing). */}
        <div className="no-print brand-panel space-y-6 rounded-[1.25rem] p-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-fg">
              <Sparkles size={15} className="text-brand" /> Choose your ride
            </div>
            <div className="grid grid-cols-2 gap-2">
              {VEHICLES.map((vehicle) => (
                <button
                  key={vehicle.kind}
                  onClick={() => set({ vehicle: vehicle.kind })}
                  className={cn(
                    "group relative flex h-[104px] flex-col items-center justify-end overflow-hidden rounded-card border px-2 pb-2 text-center transition",
                    garage.vehicle === vehicle.kind
                      ? "border-[#39bdff] bg-brand/10 text-fg shadow-[0_0_18px_rgba(0,151,255,0.16)] ring-1 ring-brand/30"
                      : "border-line bg-surface/70 text-muted hover:-translate-y-0.5 hover:border-brand/40 hover:text-fg"
                  )}
                >
                  <div className="absolute inset-x-2 top-1 h-[67px] rounded-full bg-brand/5 blur-lg" />
                  <img
                    src={vehicle.image}
                    alt=""
                    className="absolute inset-x-1 top-0 h-[74px] w-[calc(100%-0.5rem)] object-contain drop-shadow-[0_5px_5px_rgba(0,28,73,0.35)] transition group-hover:scale-105"
                    draggable={false}
                  />
                  <span className="relative text-[11px] font-semibold leading-tight">{vehicle.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-bold text-fg">Playmat glow</div>
            <div className="flex flex-wrap gap-2.5">
              {PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => set({ color })}
                  aria-label={`Use ${color}`}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 border-white/70 ring-2 ring-offset-2 ring-offset-bg transition",
                    garage.color === color
                      ? "scale-110 ring-brand shadow-[0_0_14px_currentColor]"
                      : "ring-transparent hover:scale-105 hover:ring-line"
                  )}
                  style={{ background: color, color }}
                />
              ))}
              <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border-2 border-white/70 ring-2 ring-line ring-offset-2 ring-offset-bg">
                <input
                  type="color"
                  value={garage.color}
                  onChange={(event) => set({ color: event.target.value })}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  className="block h-full w-full"
                  style={{ background: "conic-gradient(red, #ff0, lime, aqua, blue, magenta, red)" }}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-fg">Crew name</label>
            <input
              className={inputCls}
              value={garage.name ?? ""}
              placeholder={profile.username || "The Smiths"}
              maxLength={16}
              onChange={(event) => set({ name: event.target.value })}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-fg">License plate</label>
            <input
              className={cn(inputCls, "font-mono uppercase tracking-widest")}
              value={garage.plate}
              placeholder="MINIVAN"
              maxLength={8}
              onChange={(event) => set({ plate: event.target.value })}
            />
          </div>

          <p className="rounded-card border border-brand/20 bg-brand/5 p-3 text-xs leading-relaxed text-muted">
            Your profile avatar appears on the ride. Print landscape at 100% / “Actual size”.
            Vehicle and playmat settings save automatically.
          </p>
        </div>

        {/* Live print preview. */}
        <div className="print-area">
          <style>{`@page { size: letter landscape; margin: 0; }`}</style>
          <div
            className="print-frame mx-auto overflow-hidden rounded-xl border border-[#1c6eaa]/40 bg-[#020714] shadow-[0_18px_50px_rgba(0,40,95,0.28)]"
            style={{
              width: PAGE.w * scale,
              height: PAGE.h * scale,
              borderColor: `${glow}88`,
              boxShadow: `0 18px 50px rgba(0,40,95,.28), 0 0 26px ${glow}38`,
            }}
          >
            <div
              className="print-page"
              style={{
                width: PAGE.w,
                height: PAGE.h,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                padding: "0.26in",
                display: "flex",
                flexDirection: "column",
                color: "#eff9ff",
                backgroundColor: "#03091a",
                backgroundImage: `radial-gradient(520px 240px at 12% 0%, ${glow}52, transparent 68%), radial-gradient(420px 260px at 95% 100%, ${glow}28, transparent 70%), linear-gradient(${glow}12 1px, transparent 1px), linear-gradient(90deg, ${glow}12 1px, transparent 1px)`,
                backgroundSize: "auto, auto, 24px 24px, 24px 24px",
                boxShadow: `inset 0 0 0 4px ${glow}, inset 0 0 44px ${glow}24`,
              }}
            >
              {/* Header: identity, vehicle and quick flow. */}
              <div className="flex items-center gap-3" style={{ height: "1.48in" }}>
                <Vehicle
                  kind={garage.vehicle}
                  color={garage.color}
                  plate={garage.plate}
                  name={bannerName}
                  avatar={driverAvatar}
                  className="h-full shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[10px] font-bold uppercase tracking-[0.24em] text-[#55c9ff]">
                    Minivanigans! crew mat
                  </p>
                  <h2
                    className="truncate font-display text-[27px] font-black"
                    style={{ color: glowLight, textShadow: `0 0 16px ${glow}80` }}
                  >
                    {bannerName === "My" ? "My Ride" : `${bannerName}'s Ride`}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[9px] font-bold uppercase tracking-wide">
                    <span
                      className="rounded-full border px-2 py-1"
                      style={{ borderColor: `${glowLight}88`, background: `${glowDark}88`, color: glowLight }}
                    >
                      Ready · Draw · Action / Pass
                    </span>
                    <span className="rounded-full border border-[#baff18]/45 bg-[#83b900]/15 px-2 py-1 text-[#d7ff7e]">
                      Move · End
                    </span>
                  </div>
                </div>
                <Logo badge size={72} className="logo-glow self-start" />
              </div>

              {/* In-play row: Active + three Minivan reserves. */}
              <div className="mt-1 flex items-end justify-between gap-2">
                <Slot label="Active" sub="in the spotlight" color={garage.color} active />
                <Slot label="Minivan · 1" color={garage.color} />
                <Slot label="Minivan · 2" color={garage.color} />
                <Slot label="Minivan · 3" color={garage.color} />
              </div>

              {/* Deck, discard and KO Star bays. */}
              <div className="mt-auto flex items-stretch justify-between gap-3 pt-2">
                <ResourcePile label="Deck" color={garage.color} />
                <ResourcePile label="Discard" color={garage.color} />
                  <div
                  className="flex flex-1 flex-col rounded-lg border p-3"
                  style={{
                    borderColor: glowLight,
                    background: `linear-gradient(135deg, ${glow}35, rgba(5,23,50,.84))`,
                    boxShadow: `inset 0 0 26px ${glow}20, 0 0 14px ${glow}20`,
                  }}
                >
                  <span className="mb-2 font-display text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: glowLight }}>
                    KO Stars — first to {cfg.rules.winKnockouts} wins
                  </span>
                  <div className="flex gap-4">
                    {Array.from({ length: cfg.rules.winKnockouts }, (_, index) => index + 1).map((number) => (
                      <div key={number} className="flex flex-col items-center gap-1">
                        <span
                          className="grid place-items-center rounded-full font-display text-[19px] font-black text-[#ffe6a6]"
                          style={{
                            width: 52,
                            height: 52,
                            border: "2px dashed #ff9a1f",
                            background: "radial-gradient(circle, rgba(255,137,0,.18), transparent 70%)",
                          }}
                        >
                          ★
                        </span>
                        <span className="text-[9px] uppercase tracking-wide text-[#77bce8]">Star {number}</span>
                      </div>
                    ))}
                  </div>
                  <span className="mt-auto pt-1 text-[9px] text-[#7fb5d7]">
                    Hand limit {cfg.deck.handLimit} · Spent Characters ready while resting in the Minivan
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourcePile({ label, color }: { label: string; color: string }) {
  const light = shade(color, 0.45);

  return (
    <div className="flex flex-col items-center">
      <span className="mb-1 font-display text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: light }}>
        {label}
      </span>
      <div
        className="relative grid place-items-center overflow-hidden rounded-lg"
        style={{
          width: "1.65in",
          height: "1.6in",
          border: `2px dashed ${color}`,
          background: `radial-gradient(circle, ${color}32, transparent 68%), rgba(4,21,44,.72)`,
          boxShadow: `inset 0 0 20px ${color}18`,
        }}
      >
        <div className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2" style={{ borderColor: light }} />
        <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2" style={{ borderColor: light }} />
        <span className="font-display text-[10px] font-semibold uppercase tracking-wide" style={{ color: light }}>card pile</span>
      </div>
    </div>
  );
}
