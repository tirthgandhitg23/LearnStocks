import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useBalanceStore } from "@/stores/balanceStore";
import { useGamePointsStore } from "@/stores/gamePointsStore";
import { supabase } from "@/integrations/supabase/client";

export type PredictionDirection = "UP" | "DOWN";

export interface MarketPrediction {
  id: string;
  symbol: string; // e.g., TCS
  dateISO: string; // trading date for which prediction is valid (YYYY-MM-DD)
  direction: PredictionDirection;
  resolved: boolean;
  correct?: boolean;
  awarded?: number; // +500 or -100
}

interface MarketChallengeState {
  predictions: MarketPrediction[];
  addPrediction: (p: Omit<MarketPrediction, "id" | "resolved">) => void;
  evaluatePredictions: (getChangePercent: (symbol: string, dateISO: string) => Promise<number | null>) => Promise<void>;
  clearAll: () => void;
}

export const useMarketChallengeStore = create<MarketChallengeState>()(
  persist(
    (set, get) => ({
      predictions: [],
      addPrediction: (p) => {
        const id = `${p.symbol}-${p.dateISO}-${Date.now()}`;
        set((s) => ({ predictions: [{ id, resolved: false, ...p }, ...s.predictions].slice(0, 200) }));
      },
      evaluatePredictions: async (getChangePercent) => {
        const items = get().predictions;
        const updated = [...items];
        for (let i = 0; i < updated.length; i++) {
          const pred = updated[i];
          if (pred.resolved) continue;
          // evaluate at end of day: sign of day % change
          const pct = await getChangePercent(pred.symbol, pred.dateISO);
          if (pct == null) continue; // skip if data not available
          const wentUp = pct > 0;
          const correct = (wentUp && pred.direction === "UP") || (!wentUp && pred.direction === "DOWN");
          const award = correct ? 500 : -100;
          // credit/debit balance locally
          const balanceStore = useBalanceStore.getState();
          if (award > 0) balanceStore.addToBalance(award); else balanceStore.deductFromBalance(Math.abs(award));
          // record as a game point event for today's total
          try {
            const gp = useGamePointsStore.getState();
            const todayISO = new Date().toISOString().slice(0,10);
            gp.addEvent({ source: "challenge", label: `${pred.symbol} ${pred.direction}`, points: award, dateISO: todayISO });
          } catch {}
          // optionally update remote points if profile exists
          try {
            const user = (await supabase.auth.getUser()).data.user;
            if (user) {
              // Use existing typed RPC function increment_points (positive or negative)
              await supabase.rpc('increment_points', { amount: award });
            }
          } catch {
            // swallow remote errors to avoid blocking local resolution
          }
          updated[i] = { ...pred, resolved: true, correct, awarded: award };
        }
        set({ predictions: updated });
      },
      clearAll: () => set({ predictions: [] }),
    }),
    { name: "market-challenge-storage" }
  )
);

export default useMarketChallengeStore;
