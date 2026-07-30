import { save, open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import {
  SHARE_FORMAT,
  SHARE_VERSION,
  shareFileSchema,
  type AnyCard,
  type Deck,
  type Profile,
  type ShareFile,
  type ShareLanyard,
} from "@minivanigans/rules-engine";
import { isTauri, storage } from "./storage";
import { DEFAULT_AVATAR } from "./avatars";

/** Inline a card's stored image as a data: URL so it travels with the share. */
async function embedCard<T extends AnyCard>(card: T): Promise<T> {
  if (!card.imagePath) return card;
  const data = await storage.imageData(card.imagePath);
  return { ...card, imagePath: data };
}

async function embedLanyard(profile: Profile, favoriteCard?: AnyCard): Promise<ShareLanyard> {
  let avatar = profile.avatar;
  if (avatar.kind === "image") {
    const data = await storage.imageData(avatar.ref);
    avatar = data ? { kind: "image", ref: data } : { ...DEFAULT_AVATAR };
  }
  const fav = favoriteCard ? await embedCard(favoriteCard) : undefined;
  return { username: profile.username, avatar, favoriteCard: fav };
}

/** Build a share file (images embedded) and write it to a user-chosen location. */
export async function exportShare(opts: {
  cards: AnyCard[];
  decks?: Deck[];
  profile: Profile;
  favoriteCard?: AnyCard;
  defaultName?: string;
}): Promise<"saved" | "cancelled"> {
  const cards = await Promise.all(opts.cards.map(embedCard));
  const lanyard = await embedLanyard(opts.profile, opts.favoriteCard);
  const file: ShareFile = {
    format: SHARE_FORMAT,
    shareVersion: SHARE_VERSION,
    sharedAt: new Date().toISOString(),
    lanyard,
    cards,
    decks: opts.decks && opts.decks.length ? opts.decks : undefined,
  };
  return writeJsonFile(JSON.stringify(file, null, 2), opts.defaultName ?? "minivanigans-share.json");
}

/** Read + validate a share file (for the import preview). Null if cancelled. */
export async function importShareFile(): Promise<ShareFile | null> {
  const text = await readJsonFile();
  if (text == null) return null;
  const parsed = shareFileSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error("That file isn't a Minivanigans! share.");
  return parsed.data as ShareFile;
}

/** Turn a data: URL back into a stored image ref. */
async function rehydrate(dataUrl: string): Promise<string | undefined> {
  if (!dataUrl.startsWith("data:")) return dataUrl;
  const comma = dataUrl.indexOf(",");
  const mime = dataUrl.slice(5, comma).split(";")[0] || "image/png";
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const bin = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return storage.saveImage(bytes, ext);
}

/**
 * Materialize a share into fresh library cards/decks: new ids (never overwrite),
 * a `sharedBy` tag, rehydrated images, and decks remapped to the new card ids.
 */
export async function acceptShare(file: ShareFile): Promise<{ cards: AnyCard[]; decks: Deck[] }> {
  const now = new Date().toISOString();
  const sharedBy = file.lanyard?.username?.trim() || undefined;
  const idMap = new Map<string, string>();

  const cards: AnyCard[] = [];
  for (const c of file.cards) {
    const id = crypto.randomUUID();
    idMap.set(c.id, id);
    const imagePath = c.imagePath ? await rehydrate(c.imagePath) : undefined;
    cards.push({ ...c, id, imagePath, sharedBy, updatedAt: now });
  }

  const decks: Deck[] = (file.decks ?? []).map((d) => ({
    ...d,
    id: crypto.randomUUID(),
    entries: d.entries
      .filter((e) => idMap.has(e.cardId))
      .map((e) => ({ cardId: idMap.get(e.cardId)!, count: e.count })),
    createdAt: now,
    updatedAt: now,
  }));

  return { cards, decks };
}

// ---- file IO (mirrors backup.ts: Tauri dialog + Rust commands, browser fallback) ----

async function writeJsonFile(json: string, defaultName: string): Promise<"saved" | "cancelled"> {
  if (isTauri) {
    const path = await save({ defaultPath: defaultName, filters: [{ name: "JSON", extensions: ["json"] }] });
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

async function readJsonFile(): Promise<string | null> {
  if (isTauri) {
    const sel = await open({ multiple: false, filters: [{ name: "JSON", extensions: ["json"] }] });
    if (!sel || Array.isArray(sel)) return null;
    return invoke<string>("read_text_file", { path: sel });
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => resolve(null);
      r.readAsText(f);
    };
    input.click();
  });
}
