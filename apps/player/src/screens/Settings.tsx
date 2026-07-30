import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FolderOpen, MonitorCog, PackageOpen, Printer, Share2, Upload } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/Button";
import { Segmented } from "../components/ui/Segmented";
import { Toggle } from "../components/ui/Toggle";
import { useLibrary } from "../store/useLibrary";
import { useProfile } from "../store/useProfile";
import { useTheme, type Theme } from "../store/useTheme";
import { usePrintPrefs, type PaperSize } from "../store/usePrintPrefs";
import { storage } from "../lib/storage";
import { exportBackup, importBackup } from "../lib/backup";

function Section({ icon: Icon, title, description, children }: {
  icon: typeof MonitorCog;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-surface p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-card bg-surface-2 text-brand">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="font-semibold text-fg">{title}</h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const exportSnapshot = useLibrary((s) => s.exportSnapshot);
  const importSnapshot = useLibrary((s) => s.importSnapshot);
  const profile = useProfile((s) => s.profile);
  const saveProfile = useProfile((s) => s.save);
  const print = usePrintPrefs();

  const [location, setLocation] = useState("…");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void storage.location().then(setLocation);
  }, []);

  async function handleExport() {
    setStatus(null);
    try {
      const result = await exportBackup(exportSnapshot(), profile);
      if (result === "saved") setStatus("Backup saved.");
    } catch (e) {
      setStatus(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function handleImport() {
    setStatus(null);
    try {
      const data = await importBackup();
      if (!data) return;
      const n = (x: unknown[] | undefined) => x?.length ?? 0;
      if (
        !confirm(
          `Importing this backup REPLACES your current library with ${n(data.cards)} card(s) and ${n(data.decks)} deck(s). ` +
            "Anything not in the backup is lost — consider exporting a backup of the current library first. Continue?"
        )
      ) {
        return;
      }
      await importSnapshot(data);
      if (data.profile) await saveProfile(data.profile);
      const profileNote = data.profile ? " and your profile" : "";
      setStatus(
        `Imported ${data.cards?.length ?? 0} card(s) and ${data.decks?.length ?? 0} deck(s)${profileNote}.`
      );
    } catch (e) {
      setStatus(`Import failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Everything is stored locally on this device." />

      <div className="space-y-4">
        <Section icon={MonitorCog} title="Appearance" description="Switch between light and dark themes.">
          <div className="flex gap-2">
            {(["light", "dark"] as Theme[]).map((t) => (
              <Button
                key={t}
                variant={theme === t ? "primary" : "secondary"}
                onClick={() => setTheme(t)}
                className="capitalize"
              >
                {t}
              </Button>
            ))}
          </div>
        </Section>

        <Section icon={FolderOpen} title="Data location" description="Where your cards, decks, and config are saved.">
          <code className="block break-all rounded-card bg-surface-2 px-3 py-2 text-sm text-muted">
            {location}
          </code>
          {storage.kind === "browser" && (
            <p className="mt-2 text-sm text-warning">
              Preview mode (browser). Run the desktop app for real on-device file storage.
            </p>
          )}
        </Section>

        <Section
          icon={Printer}
          title="Print preferences"
          description="Defaults used by the Print / Export screen."
        >
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Paper size</div>
              <Segmented
                options={["letter", "a4"] as PaperSize[]}
                labels={{ letter: "US Letter", a4: "A4" }}
                value={print.paper}
                onChange={print.setPaper}
              />
            </div>
            <Toggle label="Cut guides" checked={print.cutGuides} onChange={print.setCutGuides} />
            <Toggle label="Spacing for cutting (bleed)" checked={print.bleed} onChange={print.setBleed} />
          </div>
        </Section>

        <Section
          icon={Download}
          title="Backup & restore"
          description="Export everything to a single JSON file, or import a previous backup."
        >
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={handleExport}>
              <Download size={16} /> Export all
            </Button>
            <Button variant="secondary" onClick={handleImport}>
              <Upload size={16} /> Import backup
            </Button>
          </div>
          {status && <p aria-live="polite" className="mt-3 text-sm text-fg">{status}</p>}
        </Section>

        <Section
          icon={Share2}
          title="Sharing"
          description="Open a share file someone sent you and add their cards or deck to your collection."
        >
          <Button variant="secondary" onClick={() => navigate("/import-share")}>
            <PackageOpen size={16} /> Import a share…
          </Button>
        </Section>
      </div>
    </div>
  );
}
