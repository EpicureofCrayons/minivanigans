import { create } from "zustand";
import type { Profile } from "@minivanigans/rules-engine";
import { storage } from "../lib/storage";
import { DEFAULT_AVATAR } from "../lib/avatars";

const blankProfile = (): Profile => ({ username: "", avatar: { ...DEFAULT_AVATAR } });

interface ProfileState {
  loaded: boolean;
  profile: Profile;
  load: () => Promise<void>;
  save: (p: Profile) => Promise<void>;
  /** Patch a subset of fields and persist. */
  patch: (updates: Partial<Profile>) => Promise<void>;
}

export const useProfile = create<ProfileState>((set, get) => ({
  loaded: false,
  profile: blankProfile(),

  async load() {
    const p = await storage.loadProfile();
    set({ profile: p ?? blankProfile(), loaded: true });
  },

  async save(p) {
    set({ profile: p });
    await storage.saveProfile(p);
  },

  async patch(updates) {
    const p = { ...get().profile, ...updates };
    set({ profile: p });
    await storage.saveProfile(p);
  },
}));
