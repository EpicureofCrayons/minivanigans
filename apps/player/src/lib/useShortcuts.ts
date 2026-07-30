import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** True when focus is in a field, so shortcuts don't hijack typing. */
function inEditable(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}

/**
 * Global keyboard shortcuts (spec §10). Single-key, ignored while typing:
 *   c → new card · d → new deck · / → focus a search box on the page
 * Plus "g then l/b/k/p/s/h" to jump between screens.
 */
export function useShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    let awaitingGoto = false;
    let gotoTimer: number | undefined;

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (inEditable(e.target)) {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        return;
      }

      // "/" focuses the first search input on the current screen.
      if (e.key === "/") {
        const search = document.querySelector<HTMLInputElement>('input[type="search"], input[data-search]');
        if (search) {
          e.preventDefault();
          search.focus();
        }
        return;
      }

      if (awaitingGoto) {
        const dest: Record<string, string> = { h: "/", l: "/library", b: "/builder", k: "/decks", p: "/print", s: "/settings" };
        if (dest[e.key]) {
          e.preventDefault();
          navigate(dest[e.key]!);
        }
        awaitingGoto = false;
        window.clearTimeout(gotoTimer);
        return;
      }

      switch (e.key) {
        case "g":
          awaitingGoto = true;
          gotoTimer = window.setTimeout(() => (awaitingGoto = false), 900);
          break;
        case "c":
          navigate("/builder");
          break;
        case "d":
          navigate("/decks");
          break;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(gotoTimer);
    };
  }, [navigate]);
}
