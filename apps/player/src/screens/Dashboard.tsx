import { useNavigate } from "react-router-dom";
import { Layers, LayoutGrid, Plus, Printer, ScrollText, Sparkles, Wrench } from "lucide-react";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/Button";
import { useLibrary } from "../store/useLibrary";

function StatCard({ icon: Icon, label, value }: { icon: typeof Layers; label: string; value: number }) {
  return (
    <div className="brand-panel rounded-card p-5">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-card bg-brand/10 text-brand shadow-[inset_0_0_0_1px_rgba(0,153,255,0.12)]">
        <Icon size={18} />
      </div>
      <div className="text-3xl font-semibold tabular-nums text-fg">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const cards = useLibrary((s) => s.cards);
  const decks = useLibrary((s) => s.decks);

  const characters = cards.filter((c) => c.type === "Character").length;
  const support = cards.filter((c) => c.type === "Support").length;

  const firstRun = cards.length === 0 && decks.length === 0;

  if (firstRun) return <FirstRun navigate={navigate} />;

  return (
    <div>
      <section className="brand-panel relative mb-7 flex min-h-44 items-center overflow-hidden rounded-[1.35rem] px-7 py-6">
        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-72 bg-accent/10 blur-3xl" />
        <div className="relative z-10 max-w-2xl">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.22em] text-brand">Ordinary characters. Extraordinary shifts.</p>
          <h1 className="brand-heading text-4xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">
            Create extraordinary Characters, assemble a legal deck, and take them for a Shift.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => navigate("/builder")}>
              <Plus size={16} /> New Card
            </Button>
            <Button variant="secondary" onClick={() => navigate("/decks")}>
              <Plus size={16} /> New Deck
            </Button>
          </div>
        </div>
        <Logo badge size={100} className="logo-glow absolute bottom-1 right-4 hidden opacity-95 md:block" />
      </section>

      <section className="grid grid-cols-3 gap-4">
        <StatCard icon={Sparkles} label="Characters" value={characters} />
        <StatCard icon={ScrollText} label="Moments" value={support} />
        <StatCard icon={Layers} label="Decks" value={decks.length} />
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <button
          onClick={() => navigate("/library")}
          className="brand-panel flex items-center gap-4 rounded-card p-5 text-left transition hover:-translate-y-0.5 hover:border-brand/50"
        >
          <span className="grid h-11 w-11 place-items-center rounded-card bg-surface-2 text-brand">
            <LayoutGrid size={22} />
          </span>
          <span>
            <span className="block font-semibold text-fg">Browse your library</span>
            <span className="block text-sm text-muted">Search, filter, and edit every card you've made.</span>
          </span>
        </button>
        <button
          onClick={() => navigate("/decks")}
          className="brand-panel flex items-center gap-4 rounded-card p-5 text-left transition hover:-translate-y-0.5 hover:border-brand/50"
        >
          <span className="grid h-11 w-11 place-items-center rounded-card bg-surface-2 text-brand">
            <Layers size={22} />
          </span>
          <span>
            <span className="block font-semibold text-fg">Build a deck</span>
            <span className="block text-sm text-muted">Drag cards into a legal deck with live checks.</span>
          </span>
        </button>
      </section>
    </div>
  );
}

/** Friendly empty-slate welcome shown until the first card or deck exists. */
function FirstRun({ navigate }: { navigate: (to: string) => void }) {
  const steps = [
    { icon: Wrench, title: "Build a card", text: "Pick one of eight fair chassis, then make the names, art, and flavor yours." },
    { icon: LayoutGrid, title: "Fill your library", text: "Every card you make is searchable and filterable, ready to drop into a deck." },
    { icon: Layers, title: "Assemble a deck", text: "Drag cards into an 18-card deck (12 Characters + 6 Moments) with live legality checks." },
    { icon: Printer, title: "Print & play", text: "Lay them out at exactly 2.5″×3.5″, 6 per page, and print or save a PDF." },
  ];
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Logo badge size={130} className="animate-pop mx-auto mb-5" />

      <h1 className="font-display text-4xl font-semibold text-fg">Welcome to Minivanigans!</h1>
      <p className="mx-auto mt-2 max-w-prose text-muted">
        Design your own trading cards, keep them balanced, build legal decks, and print them at home.
        Everything stays on this device.
      </p>

      <div className="mt-6 flex justify-center gap-3">
        <Button variant="primary" onClick={() => navigate("/builder")}>
          <Plus size={16} /> Create your first card
        </Button>
        <Button variant="secondary" onClick={() => navigate("/settings")}>
          Import a backup
        </Button>
      </div>

      <ol className="mt-10 grid gap-4 text-left sm:grid-cols-2">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <li
            key={title}
            className="animate-rise flex gap-3 rounded-card border border-line bg-surface p-4"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-card bg-surface-2 text-brand">
              <Icon size={18} />
            </span>
            <span>
              <span className="block font-semibold text-fg">{i + 1}. {title}</span>
              <span className="block text-sm text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-xs text-muted">
        Tip: press <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5">c</kbd> to make a card,
        {" "}<kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5">d</kbd> for a deck, or
        {" "}<kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5">g</kbd> then a screen key to navigate.
      </p>
    </div>
  );
}
