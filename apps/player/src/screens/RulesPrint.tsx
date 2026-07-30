import { BookOpen, Printer } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { useLibrary } from "../store/useLibrary";
import { openPrintDialog } from "../lib/print";

export function RulesPrint() {
  const cfg = useLibrary((s) => s.config);
  return (
    <div>
      <PageHeader
        title="Rules"
        subtitle="Minivanigans! Rules v5.0 — Shift Playtest"
        actions={<Button variant="primary" onClick={() => void openPrintDialog()}><Printer size={16} /> Print rules</Button>}
      />

      <article className="rules-sheet mx-auto max-w-4xl space-y-7 rounded-card border border-line bg-surface p-8 print:max-w-none print:border-0 print:p-0">
        <header className="border-b border-line pb-5 text-center">
          <h1 className="font-display text-4xl font-bold text-brand">MINIVANIGANS!</h1>
          <p className="mt-1 font-semibold">Ordinary Characters. Extraordinary Shifts.</p>
          <p className="mt-2 text-sm text-muted">First to 3 KO Stars wins.</p>
        </header>

        <Section title="The big choice">
          <p>Every Character has a reusable <b>Everyday Move</b> and a stronger <b>Shift Move</b> that becomes spent after use.</p>
          <p className="mt-2 rounded-card bg-brand/10 p-3 text-center font-semibold">
            Take an Action and use an Everyday Move—or pass your Action and unleash a ready Shift Move.
          </p>
          <p className="mt-2">Spent Characters recover by resting in your Minivan.</p>
        </Section>

        <Section title="Build an 18-card deck">
          <ul className="grid gap-1 sm:grid-cols-2">
            <li>• Exactly 12 Characters</li>
            <li>• Exactly 6 Moments</li>
            <li>• No more than 3 of one chassis</li>
            <li>• Follow each Moment's printed copy limit</li>
          </ul>
        </Section>

        <Section title="The eight chassis">
          <div className="grid gap-2 sm:grid-cols-2">
            {cfg.presets.map((c) => (
              <div key={c.id} className="rounded-card border border-line p-3">
                <div className="flex justify-between gap-2 font-semibold"><span>{c.displayName}</span><span>{c.hp} Stamina</span></div>
                <div className="mt-1 text-sm"><b>{c.everydayName}:</b> {c.damage} damage.</div>
                <div className="mt-1 text-sm text-brand">
                  <b>{c.shiftName}:</b> {cfg.abilities.find((a) => a.id === c.abilityId)?.description}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Setup">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Choose the first player and shuffle.</li>
            <li>First player draws 5; second player draws 6.</li>
            <li>If you have no Character, reshuffle and redraw up to twice. Then reveal until you find one if needed.</li>
            <li>Secretly choose an Active, reveal together, then place up to 3 Characters face-up in your Minivan.</li>
            <li>All Characters start ready, undamaged, and without Shields.</li>
          </ol>
          <p className="mt-2 text-sm font-medium">The first player draws normally, but may use only an Everyday Move on the first turn—even after passing or Encore.</p>
        </Section>

        <Section title="Your turn">
          <ol className="space-y-3">
            <Turn n="1" title="Ready the Minivan">Turn every spent Minivan Character upright. A spent Active does not ready. Remove expired Shields.</Turn>
            <Turn n="2" title="Draw">Draw one. If the deck is empty, skip the draw; deck-out is not a loss.</Turn>
            <Turn n="3" title="Action or Pass">Bench one Character, switch, play one Moment, or pass.</Turn>
            <Turn n="4" title="Move">After an Action, use only the Everyday Move. After passing, use the Everyday or a ready Shift. Announcing a Shift spends it immediately.</Turn>
            <Turn n="5" title="End">Discard down to a 7-card hand, then the other player begins.</Turn>
          </ol>
        </Section>

        <Section title="Moments">
          <div className="grid gap-2 sm:grid-cols-2">
            {cfg.supportEffects.map((m) => (
              <div key={m.id} className="rounded-card bg-surface-2 p-3 text-sm">
                <div className="font-semibold">{m.displayName} <span className="font-normal text-muted">· max {m.maxPerDeck}</span></div>
                <p className="mt-1 text-muted">{m.description}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Damage, KOs, and winning">
          <ul className="space-y-1">
            <li>• Damage stays when a Character switches. Healing cannot go above Stamina.</li>
            <li>• Shield 1 reduces the next damage by 1, then disappears; it also expires at the start of its owner's next turn.</li>
            <li>• Damage equal to or above Stamina causes a Knockout. The attacker gains a KO Star.</li>
            <li>• The defender chooses a replacement from the Minivan, then hand, then by revealing from the deck.</li>
            <li>• Three KO Stars wins immediately. You also win if the opponent cannot produce a replacement.</li>
          </ul>
        </Section>

        <Section title="First Game Mode">
          <p>Choose 3 Characters each: one Active and two in the Minivan. Use no deck, hands, Moments, draws, or benching. Switch for an Everyday Move, or stay for an Everyday or ready Shift. First to 2 KOs wins.</p>
        </Section>

        <footer className="flex items-center justify-center gap-2 border-t border-line pt-4 text-xs text-muted">
          <BookOpen size={14} /> Custom names never replace the printed standard chassis, move, or Moment effect.
        </footer>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-2 font-display text-xl font-semibold text-fg">{title}</h2><div className="text-sm leading-relaxed text-fg">{children}</div></section>;
}

function Turn({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand font-bold text-brand-fg">{n}</span><span><b>{title}:</b> {children}</span></li>;
}
