import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LayoutGrid,
  Wand2,
  Layers,
  Printer,
  Settings,
  Plus,
  CircleUser,
  BookOpen,
  Truck,
  Grid2x2,
  CircleDot,
  Crosshair,
  Swords,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/Button";
import { cn } from "../lib/cn";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/library", label: "Card Library", icon: LayoutGrid },
  { to: "/builder", label: "Card Builder", icon: Wand2 },
  { to: "/decks", label: "Deck Builder", icon: Layers },
  { to: "/play", label: "Play vs Bot", icon: Swords },
  { to: "/print", label: "Print / Export", icon: Printer },
  { to: "/card-backs", label: "Card Backs", icon: Grid2x2 },
  { to: "/tokens", label: "Game Tokens", icon: CircleDot },
  { to: "/calibrate", label: "Printer Setup", icon: Crosshair },
  { to: "/playmat", label: "My Ride (Play Mat)", icon: Truck },
  { to: "/rules", label: "Rules", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: CircleUser },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="app-sidebar flex w-64 shrink-0 flex-col border-r text-white print:hidden">
      {/* Brand */}
      <div className="relative flex items-center gap-2.5 overflow-hidden px-5 pb-4 pt-5">
        <div className="absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-[#1ca8ff]/70 to-transparent" />
        <Logo size={48} className="logo-glow max-w-[210px]" />
      </div>

      {/* Primary actions — always one click away (spec §8) */}
      <div className="flex gap-2 px-3 pb-3">
        <Button variant="primary" className="flex-1" onClick={() => navigate("/builder")}>
          <Plus size={16} /> New Card
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => navigate("/decks")}>
          <Plus size={16} /> New Deck
        </Button>
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-[#0b70c9]/25 text-white shadow-[inset_0_0_0_1px_rgba(55,184,255,0.24),0_0_18px_rgba(0,137,255,0.09)]"
                  : "text-[#8fb4d8] hover:bg-white/5 hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "h-5 w-0.5 rounded-full transition",
                    isActive ? "bg-[#baff18] shadow-[0_0_8px_rgba(186,255,24,0.65)]" : "bg-transparent"
                  )}
                  aria-hidden
                />
                <Icon size={18} strokeWidth={2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#1b6ca7]/35 p-3">
        <ThemeToggle />
      </div>
    </aside>
  );
}
