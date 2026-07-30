import { bundleSchema, defaultBundle, type Bundle } from "@minivanigans/rules-engine";

/**
 * Load the config + template bundle baked into this build (plan §9). A
 * `bundle.json` is shipped as a static asset; if it's missing or invalid we
 * fall back to the engine defaults so the app always renders.
 */
export async function loadBundle(): Promise<Bundle> {
  try {
    const res = await fetch("bundle.json", { cache: "no-store" });
    if (!res.ok) return defaultBundle;
    const json = await res.json();
    const parsed = bundleSchema.parse(json) as Bundle;
    // Never let a baked v4 bundle roll the v5 engine and builders backward.
    return parsed.config.version >= 5 ? parsed : defaultBundle;
  } catch {
    return defaultBundle;
  }
}
