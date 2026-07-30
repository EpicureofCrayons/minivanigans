import { Moon, Sun } from "lucide-react";
import { useTheme } from "../store/useTheme";
import { cn } from "../lib/cn";

/** Compact light/dark switch for the sidebar footer. */
export function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="flex w-full items-center gap-2 rounded-card px-3 py-2 text-sm text-[#8fb4d8] transition hover:bg-white/5 hover:text-white"
    >
      <span className="relative grid h-5 w-5 place-items-center">
        <Sun size={18} className={cn("absolute transition", isDark ? "scale-0 opacity-0" : "scale-100 opacity-100")} />
        <Moon size={18} className={cn("absolute transition", isDark ? "scale-100 opacity-100" : "scale-0 opacity-0")} />
      </span>
      {isDark ? "Dark" : "Light"} theme
    </button>
  );
}
