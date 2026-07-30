import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Download, Inbox, PackageOpen, TriangleAlert } from "lucide-react";
import { validateCard, type ShareFile } from "@minivanigans/rules-engine";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { CardPreview } from "../components/CardPreview";
import { Lanyard } from "../components/Lanyard";
import { useLibrary } from "../store/useLibrary";
import { importShareFile, acceptShare } from "../lib/share";

export function ImportShare() {
  const navigate = useNavigate();
  const cfg = useLibrary((s) => s.config);
  const addShared = useLibrary((s) => s.addShared);

  const [file, setFile] = useState<ShareFile | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function choose() {
    setStatus(null);
    try {
      const f = await importShareFile();
      if (f) setFile(f);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  async function add() {
    if (!file) return;
    const { cards, decks } = await acceptShare(file);
    await addShared(cards, decks);
    const bits = [`${cards.length} card${cards.length === 1 ? "" : "s"}`];
    if (decks.length) bits.push(`${decks.length} deck${decks.length === 1 ? "" : "s"}`);
    setStatus(`Added ${bits.join(" and ")} to your collection.`);
    setFile(null);
  }

  const lan = file?.lanyard;
  // Shares from older rules generations (or homebrew) may contain cards that
  // aren't legal today — import still works, but say so up front.
  const illegalIds = new Set((file?.cards ?? []).filter((c) => !validateCard(c, cfg).ok).map((c) => c.id));

  return (
    <div>
      <PageHeader
        title="Import a Share"
        subtitle="Open a Minivanigans! share file someone sent you—preview who it's from, then add it to your collection."
        actions={
          <Button variant="primary" onClick={choose}>
            <PackageOpen size={16} /> Choose share file…
          </Button>
        }
      />

      {status && (
        <p className="mb-4 flex items-center gap-1.5 text-sm text-success">
          <Check size={15} /> {status}
        </p>
      )}

      {!file ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line py-20 text-center text-muted">
          <Inbox size={32} strokeWidth={1.5} />
          <p className="text-sm">No share open yet. Choose a <code>.share.json</code> file to preview it.</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* sender attribution */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Shared by</div>
            {lan ? (
              <Lanyard
                profile={{ username: lan.username, avatar: lan.avatar }}
                favoriteCard={lan.favoriteCard}
                cfg={cfg}
                width={260}
              />
            ) : (
              <p className="text-sm text-muted">Shared anonymously (no badge included).</p>
            )}
            <Button variant="primary" className="mt-4 w-full" onClick={add}>
              <Download size={16} /> Add to my collection
            </Button>
            <button className="mt-2 w-full text-sm text-muted underline-offset-2 hover:underline" onClick={() => setFile(null)}>
              Cancel
            </button>
          </div>

          {/* contents */}
          <div>
            <div className="mb-3 text-sm text-fg">
              <span className="font-semibold">{file.cards.length}</span> card{file.cards.length === 1 ? "" : "s"}
              {file.decks?.length ? <> · <span className="font-semibold">{file.decks.length}</span> deck{file.decks.length === 1 ? "" : "s"}</> : null}
              {lan?.username ? <> from <span className="font-semibold">{lan.username}</span></> : null}
            </div>
            {illegalIds.size > 0 && (
              <p className="mb-3 flex items-start gap-1.5 rounded-card border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-fg">
                <TriangleAlert size={14} className="mt-0.5 shrink-0 text-warning" />
                <span>
                  {illegalIds.size} card{illegalIds.size === 1 ? " isn't" : "s aren't"} legal under the current rules
                  (likely made under an older version). You can still import {illegalIds.size === 1 ? "it" : "them"} to
                  view — rebuild {illegalIds.size === 1 ? "it" : "them"} on a chassis in the Card Builder to use {illegalIds.size === 1 ? "it" : "them"} in decks.
                </span>
              </p>
            )}
            {file.decks?.length ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {file.decks.map((d) => (
                  <span key={d.id} className="rounded-card bg-surface-2 px-3 py-1.5 text-sm text-fg">
                    🗂 {d.name} ({d.entries.reduce((n, e) => n + e.count, 0)})
                  </span>
                ))}
              </div>
            ) : null}
            <div
              className="grid gap-x-4 gap-y-5"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}
            >
              {file.cards.map((c) => (
                <div key={c.id} className="flex flex-col items-center">
                  <CardPreview card={c} cfg={cfg} width={150} />
                  <div className="mt-1.5 max-w-full truncate text-center text-xs text-muted">{c.name || "Untitled"}</div>
                  {illegalIds.has(c.id) && (
                    <span className="mt-1 flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                      <TriangleAlert size={11} /> Not legal under current rules
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-muted">
        Imported cards are added as new copies (your existing cards are never overwritten) and tagged with who shared them.
        <button className="ml-1 underline-offset-2 hover:underline" onClick={() => navigate("/library")}>View your library →</button>
      </p>
    </div>
  );
}
