import { useState } from "react";
import { Button } from "./ui/Button";
import { useDisclaimer } from "../store/useDisclaimer";

/**
 * One-time welcome / disclaimer shown on first launch.
 *
 * Default behaviour is "one-time": the "Don't show this again" box is checked
 * by default, so dismissing once persists acknowledgement and it never returns.
 * Unchecking lets it reappear next launch (useful on a shared machine).
 */
export function FirstRunNotice() {
  const acknowledged = useDisclaimer((s) => s.acknowledged);
  const acknowledge = useDisclaimer((s) => s.acknowledge);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [closedThisSession, setClosedThisSession] = useState(false);

  if (acknowledged || closedThisSession) return null;

  const dismiss = () => {
    if (dontShowAgain) acknowledge();
    setClosedThisSession(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-run-title"
    >
      <div className="animate-rise w-full max-w-md rounded-card bg-surface p-6 text-fg shadow-[var(--shadow-soft)]">
        <h2 id="first-run-title" className="font-display text-xl font-semibold">
          Welcome to Minivanigans! 👋
        </h2>
        <p className="mt-1 text-sm text-muted">A quick note before you play:</p>

        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex gap-3">
            <span aria-hidden>🎴</span>
            <span>
              <strong>A fan-made hobby game.</strong> This is a free,
              non-commercial project made for fun — not for sale, and not
              affiliated with or endorsed by any company. Please don&apos;t sell it.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden>⚠️</span>
            <span>
              <strong>Provided as-is.</strong> No warranties or guarantees. Play
              at your own risk; things may break or change.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden>🔒</span>
            <span>
              <strong>Your data stays with you.</strong> Your cards, decks, and
              profile are saved only on this device. The app doesn&apos;t collect,
              send, or share anything — there are no servers, accounts, or tracking.
            </span>
          </li>
        </ul>

        <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="accent-brand"
          />
          Don&apos;t show this again
        </label>

        <div className="mt-5 flex justify-end">
          <Button variant="primary" onClick={dismiss} autoFocus>
            Got it — let&apos;s play
          </Button>
        </div>
      </div>
    </div>
  );
}
