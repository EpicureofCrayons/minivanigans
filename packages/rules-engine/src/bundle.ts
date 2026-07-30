// A versioned config + template bundle. A copy is baked into each app build and
// loaded at launch for fully offline play.

import type { RulesConfig } from "./types";
import { defaultConfig } from "./config";
import { defaultTemplates, type TemplateSet } from "./templates";

export const BUNDLE_FORMAT = "day-shifters-bundle" as const;

export interface Bundle {
  format: typeof BUNDLE_FORMAT;
  /** Bumped each time a new bundle is released. */
  bundleVersion: number;
  /** ISO timestamp the bundle was exported. */
  createdAt?: string;
  config: RulesConfig;
  templates: TemplateSet;
}

/** The fallback bundle: the game exactly as the engine defaults describe it. */
export const defaultBundle: Bundle = {
  format: BUNDLE_FORMAT,
  bundleVersion: 1,
  config: defaultConfig,
  templates: defaultTemplates,
};
