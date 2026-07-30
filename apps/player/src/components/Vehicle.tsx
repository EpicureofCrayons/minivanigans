import type { CSSProperties } from "react";
import type { Avatar, VehicleKind } from "@minivanigans/rules-engine";
import { AvatarView } from "./AvatarView";
import { cn } from "../lib/cn";
import minivanImage from "../assets/vehicles/minivan.png";
import wagonImage from "../assets/vehicles/wagon.png";
import semiImage from "../assets/vehicles/semi.png";
import rvImage from "../assets/vehicles/rv.png";
import dumpsterImage from "../assets/vehicles/dumpster.png";
import bikeImage from "../assets/vehicles/bike.png";

export interface VehicleOption {
  kind: VehicleKind;
  label: string;
  image: string;
}

/** One cohesive, logo-inspired vehicle set used by both the picker and play mat. */
export const VEHICLES: VehicleOption[] = [
  { kind: "minivan", label: "Minivan", image: minivanImage },
  { kind: "wagon", label: "Station Wagon", image: wagonImage },
  { kind: "semi", label: "Semi Truck", image: semiImage },
  { kind: "rv", label: "RV / Motorhome", image: rvImage },
  { kind: "dumpster", label: "Rolling Dumpster", image: dumpsterImage },
  { kind: "bike", label: "Cargo Bike + Wagon", image: bikeImage },
];

export function vehicleImage(kind: VehicleKind): string {
  return VEHICLES.find((vehicle) => vehicle.kind === kind)?.image ?? minivanImage;
}

/**
 * Branded vehicle art with live player identity overlays.
 *
 * The vehicle illustration keeps the Minivanigans blue/lime/orange palette.
 * The player's selected colour drives the surrounding aura and playmat zones,
 * so every ride stays visually consistent while still feeling personalised.
 */
export function Vehicle({
  kind,
  color,
  plate,
  name,
  avatar,
  className,
}: {
  kind: VehicleKind;
  color: string;
  plate: string;
  name: string;
  avatar?: Avatar;
  className?: string;
}) {
  const style = { "--ride-color": color } as CSSProperties;

  return (
    <div
      className={cn("vehicle-art relative isolate aspect-[16/9]", className)}
      style={style}
      role="img"
      aria-label={`${kind} play mat vehicle`}
    >
      <div className="absolute inset-[8%] rounded-full bg-[var(--ride-color)] opacity-20 blur-2xl" />
      <img
        src={vehicleImage(kind)}
        alt=""
        className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_10px_10px_rgba(0,12,40,0.48)]"
        draggable={false}
      />

      {avatar && (
        <div className="absolute right-[7%] top-[5%] overflow-hidden rounded-full border-[3px] border-[#70ddff] bg-[#06152e] shadow-[0_0_16px_rgba(18,173,255,0.9)]">
          <AvatarView avatar={avatar} size={38} />
        </div>
      )}

      <div className="absolute bottom-[3%] left-[5%] max-w-[58%] truncate rounded-full border border-[#53cfff]/70 bg-[#031126]/90 px-3 py-1 font-display text-[13px] font-bold text-white shadow-[0_0_12px_rgba(0,153,255,0.45)] backdrop-blur-sm">
        {name || "My Ride"}
      </div>

      <div className="absolute bottom-[4%] right-[5%] rounded-md border border-[#ffd363] bg-gradient-to-b from-[#ffb21a] to-[#ff7a00] px-2 py-0.5 font-mono text-[10px] font-black tracking-widest text-[#1d1200] shadow-[0_0_12px_rgba(255,135,0,0.55)]">
        {(plate || "MINIVAN").slice(0, 8).toUpperCase()}
      </div>
    </div>
  );
}
