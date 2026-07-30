import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PrintSide = "front" | "back";

/**
 * A saved set of print-alignment offsets for one physical printer. Front and
 * back are stored independently because the back is printed after flipping the
 * sheet, so its drift is its own thing. All offsets are in millimetres:
 * positive X shifts right, positive Y shifts down (in the printed output for the
 * common no-mirror case).
 */
export interface PrinterProfile {
  id: string;
  name: string;
  frontDx: number;
  frontDy: number;
  backDx: number;
  backDy: number;
}

export type OffsetField = "frontDx" | "frontDy" | "backDx" | "backDy";

interface PrinterProfilesState {
  profiles: PrinterProfile[];
  activeId: string | null;
  /** Create a profile, make it active, and return its id. */
  addProfile: (name: string) => string;
  renameProfile: (id: string, name: string) => void;
  updateOffsets: (id: string, patch: Partial<Pick<PrinterProfile, OffsetField>>) => void;
  removeProfile: (id: string) => void;
  setActive: (id: string | null) => void;
}

export const usePrinterProfiles = create<PrinterProfilesState>()(
  persist(
    (set) => ({
      profiles: [],
      activeId: null,
      addProfile: (name) => {
        const id = crypto.randomUUID();
        const profile: PrinterProfile = {
          id,
          name: name.trim() || "My printer",
          frontDx: 0,
          frontDy: 0,
          backDx: 0,
          backDy: 0,
        };
        set((s) => ({ profiles: [...s.profiles, profile], activeId: id }));
        return id;
      },
      renameProfile: (id, name) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, name } : p)),
        })),
      updateOffsets: (id, patch) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeProfile: (id) =>
        set((s) => {
          const profiles = s.profiles.filter((p) => p.id !== id);
          return {
            profiles,
            activeId: s.activeId === id ? (profiles[0]?.id ?? null) : s.activeId,
          };
        }),
      setActive: (activeId) => set({ activeId }),
    }),
    { name: "day-shifters:printers" }
  )
);
