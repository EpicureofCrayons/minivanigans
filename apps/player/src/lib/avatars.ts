import type { Avatar } from "@minivanigans/rules-engine";

/**
 * Built-in avatars — rendered offline as an emoji on a colored disc (no image
 * files to bundle/ship). Players can also upload their own image instead.
 */
export interface BuiltinAvatar {
  id: string;
  emoji: string;
  bg: string;
  label: string;
}

export const BUILTIN_AVATARS: BuiltinAvatar[] = [
  { id: "coffee", emoji: "☕", bg: "#e0533a", label: "Coffee" },
  { id: "dog", emoji: "🐕", bg: "#3aa563", label: "Dog" },
  { id: "briefcase", emoji: "💼", bg: "#4f7fe0", label: "Briefcase" },
  { id: "nametag", emoji: "🪪", bg: "#b8632f", label: "Name tag" },
  { id: "van", emoji: "🚐", bg: "#2f9d8c", label: "Minivan" },
  { id: "runner", emoji: "🏃", bg: "#d98c1f", label: "Jogger" },
  { id: "cat", emoji: "🐈", bg: "#8b5cf6", label: "Cat" },
  { id: "clipboard", emoji: "📋", bg: "#0ea5a0", label: "Clipboard" },
  { id: "star", emoji: "⭐", bg: "#eab308", label: "Star" },
  { id: "burger", emoji: "🍔", bg: "#dc6803", label: "Burger" },
  { id: "headset", emoji: "🎧", bg: "#6366f1", label: "Headset" },
  { id: "wrench", emoji: "🔧", bg: "#64748b", label: "Wrench" },
];

export const BUILTIN_AVATAR_BY_ID = new Map(BUILTIN_AVATARS.map((a) => [a.id, a]));

export const DEFAULT_AVATAR: Avatar = { kind: "builtin", id: BUILTIN_AVATARS[0]!.id };
