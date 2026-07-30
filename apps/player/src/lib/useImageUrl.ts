import { useEffect, useState } from "react";
import { storage } from "./storage";

/**
 * Resolve a stored image reference (relative path in Tauri, data: URL in the
 * browser fallback) to something usable as <img src>. Returns undefined while
 * loading or when there's no image.
 */
export function useImageUrl(ref: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    if (!ref) {
      setUrl(undefined);
      return;
    }
    void storage.imageUrl(ref).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [ref]);

  return url;
}
