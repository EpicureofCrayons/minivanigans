import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DisclaimerState {
  /** True once the player has dismissed the first-run notice with "don't show again". */
  acknowledged: boolean;
  acknowledge: () => void;
}

/**
 * Tracks whether the one-time welcome/disclaimer notice has been accepted.
 * Persisted locally (same mechanism as theme/profile) so it shows only once.
 * Bump the `name` suffix (-v1, -v2, ...) if the notice text changes materially
 * and you want everyone to see the updated version again.
 */
export const useDisclaimer = create<DisclaimerState>()(
  persist(
    (set) => ({
      acknowledged: false,
      acknowledge: () => set({ acknowledged: true }),
    }),
    { name: "day-shifters:disclaimer-v1" }
  )
);
