import { save, open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import type { Profile } from "@minivanigans/rules-engine";
import { isTauri, storage, type Snapshot } from "./storage";

const BACKUP_FORMAT = "day-shifters-backup";
// v2 added the user profile (username + avatar). Older v1 files (no profile)
// still import fine — `profile` simply comes back undefined.
const BACKUP_VERSION = 2;
const DEFAULT_NAME = "minivanigans-backup.json";

/** What a backup file restores: the library snapshot plus the user profile. */
export type BackupData = Partial<Snapshot> & { profile?: Profile | null };

/** Export a snapshot (and profile) to a user-chosen location (or a download in browser). */
export async function exportBackup(
  snapshot: Snapshot,
  profile: Profile | null = null,
  defaultName: string = DEFAULT_NAME
): Promise<"saved" | "cancelled"> {
  let portableProfile = profile;
  if (profile?.avatar.kind === "image") {
    const data = await storage.imageData(profile.avatar.ref);
    if (data) {
      portableProfile = { ...profile, avatar: { kind: "image", ref: data } };
    }
  }

  const json = JSON.stringify(
    { format: BACKUP_FORMAT, version: BACKUP_VERSION, ...snapshot, profile: portableProfile },
    null,
    2
  );

  if (isTauri) {
    const path = await save({
      defaultPath: defaultName,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!path) return "cancelled";
    await invoke("write_text_file", { path, contents: json });
    return "saved";
  }

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = defaultName;
  a.click();
  URL.revokeObjectURL(url);
  return "saved";
}

/** Read a backup file and return its parsed contents (null if cancelled). */
export async function importBackup(): Promise<BackupData | null> {
  let text: string | null = null;

  if (isTauri) {
    const selected = await open({
      multiple: false,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!selected || Array.isArray(selected)) return null;
    text = await invoke<string>("read_text_file", { path: selected });
  } else {
    text = await pickFileText();
    if (text == null) return null;
  }

  const data = JSON.parse(text) as Record<string, unknown>;
  if (data.format !== BACKUP_FORMAT) {
    throw new Error("That file is not a Minivanigans! backup.");
  }
  return {
    cards: (data.cards as Snapshot["cards"]) ?? [],
    decks: (data.decks as Snapshot["decks"]) ?? [],
    config: (data.config as Snapshot["config"]) ?? null,
    profile: (data.profile as Profile) ?? undefined,
  };
}

/** Browser-only: open a file picker and resolve the chosen file's text. */
function pickFileText(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}
