// Helpers for art shipped with the build (the seeded starter deck). Such cards
// carry an imagePath of `bundled:<relative public path>`; the file lives under
// the app's public/ dir and is served at the web root in both the browser
// preview and the Tauri webview.

export const BUNDLED_PREFIX = "bundled:";

export const isBundledRef = (ref: string): boolean => ref.startsWith(BUNDLED_PREFIX);

/** Strip the sentinel, yielding a relative URL usable as <img src>. */
export const bundledUrl = (ref: string): string => ref.slice(BUNDLED_PREFIX.length);

/**
 * Fetch a bundled asset and inline it as a data: URL — needed when a seeded
 * card is exported in a share (recipients have no copy of our public/ assets).
 */
export async function bundledAsDataUrl(path: string): Promise<string | undefined> {
  try {
    const res = await fetch(path, { cache: "force-cache" });
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}
