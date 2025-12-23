import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GamePointSource = "quiz" | "challenge" | "simulator" | "other";

export interface GamePointEvent {
  id: string;
  source: GamePointSource;
  label?: string;
  points: number; // positive or negative
  dateISO: string; // YYYY-MM-DD representing the day the points were awarded
  ts: number; // timestamp
}

interface GamePointsState {
  events: GamePointEvent[];
  addEvent: (e: Omit<GamePointEvent, "id" | "ts" | "dateISO"> & { dateISO?: string }) => void;
  clearAll: () => void;
}

export const useGamePointsStore = create<GamePointsState>()(
  persist(
    (set, get) => ({
      events: [],
      addEvent: (e) => {
        const today = e.dateISO || new Date().toISOString().slice(0, 10);
        const id = `${e.source}-${today}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        const ev: GamePointEvent = { id, ts: Date.now(), dateISO: today, ...e } as GamePointEvent;
        set((s) => ({ events: [ev, ...s.events].slice(0, 500) }));
      },
      clearAll: () => set({ events: [] }),
    }),
    { name: "game-points-storage" }
  )
);

export default useGamePointsStore;
