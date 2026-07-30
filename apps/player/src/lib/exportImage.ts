import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { domToPng } from "modern-screenshot";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import type { AnyCard, RulesConfig } from "@minivanigans/rules-engine";
import { CardShowcase } from "../components/CardShowcase";
import { storage, isTauri } from "./storage";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));

function fileName(card: AnyCard): string {
  const base = (card.name || "card").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "card"}.png`;
}

/**
 * Render a single card as a shareable showcase PNG and save it to disk (Tauri
 * save dialog) or download it (browser). Returns "cancelled" if the user backs
 * out of the save dialog.
 */
export async function exportCardPng(card: AnyCard, cfg: RulesConfig): Promise<"saved" | "cancelled"> {
  // Inline the art so the rasterizer never has to reach through the asset
  // protocol — that keeps the off-screen render self-contained and CORS-clean.
  const artData = card.imagePath ? await storage.imageData(card.imagePath) : undefined;
  const exportCard: AnyCard = artData ? { ...card, imagePath: artData } : card;

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-100000px;top:0;pointer-events:none;z-index:-1;";
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    root.render(createElement(CardShowcase, { card: exportCard, cfg }));
    // Let React commit, fonts load, FitText settle, and the art paint.
    await nextFrame();
    await document.fonts?.ready;
    await sleep(120);
    await nextFrame();

    const target = host.firstElementChild as HTMLElement | null;
    if (!target) throw new Error("Nothing to export.");

    const dataUrl = await domToPng(target, { scale: 2 });

    if (isTauri) {
      const path = await save({
        defaultPath: fileName(card),
        filters: [{ name: "PNG image", extensions: ["png"] }],
      });
      if (!path) return "cancelled";
      const bytes = Array.from(Uint8Array.from(atob(dataUrl.split(",")[1]!), (c) => c.charCodeAt(0)));
      await invoke("write_binary_file", { path, contents: bytes });
      return "saved";
    }

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = fileName(card);
    a.click();
    return "saved";
  } finally {
    root.unmount();
    host.remove();
  }
}
