import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { FirstRunNotice } from "../components/FirstRunNotice";
import { useLibrary } from "../store/useLibrary";
import { useProfile } from "../store/useProfile";
import { useShortcuts } from "../lib/useShortcuts";

export function AppLayout() {
  const load = useLibrary((s) => s.load);
  const loadProfile = useProfile((s) => s.load);
  const location = useLocation();
  useShortcuts();

  // Load cards/decks/config + profile from storage once, on app start.
  useEffect(() => {
    void load();
    void loadProfile();
  }, [load, loadProfile]);

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-bg text-fg print:block print:h-auto print:overflow-visible">
      <FirstRunNotice />
      <Sidebar />
      <main className="app-main min-w-0 flex-1 overflow-y-auto print:overflow-visible">
        {/* Keyed by route so each screen gets a subtle mount animation. */}
        <div
          key={location.pathname}
          className="animate-rise mx-auto max-w-6xl px-8 py-8 print:m-0 print:max-w-none print:p-0"
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
