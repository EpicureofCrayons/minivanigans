// A portable share file: cards and/or a deck, plus the sender's lanyard for
// attribution. Images travel INLINE as data URLs (imagePath / avatar ref hold a
// `data:` URL), so a share opens correctly on any machine with no shared files.

import type { AnyCard, Avatar, Deck } from "./types";

export const SHARE_FORMAT = "day-shifters-share" as const;
export const SHARE_VERSION = 1;

export interface ShareLanyard {
  username: string;
  avatar: Avatar; // an image avatar's ref holds a data: URL
  favoriteCard?: AnyCard; // display-only snapshot; its imagePath holds a data: URL
}

export interface ShareFile {
  format: typeof SHARE_FORMAT;
  shareVersion: number;
  sharedAt: string; // ISO
  lanyard?: ShareLanyard;
  cards: AnyCard[]; // each card's imagePath holds a data: URL (or is absent)
  decks?: Deck[];
}
