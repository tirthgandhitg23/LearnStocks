import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useBalanceStore } from "@/stores/balanceStore";
import { isNSEMarketOpen } from "@/lib/marketHours";
import { Stock } from "@/types";

export interface Holding {
  stockId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
}

interface PortfolioState {
  holdings: Holding[];
  trades: Array<{ id: string; stockId: string; symbol: string; quantity: number; price: number; type: "BUY" | "SELL"; date: string }>;
  history: Array<{ date: string; value: number }>;
  buyStock: (stock: Stock, quantity: number, price?: number) => boolean;
  sellStock: (stockId: string, quantity: number, price?: number) => boolean;
  getHolding: (stockId: string) => Holding | undefined;
  addHistoryPoint: (value: number, date?: string) => void;
  clearHistory: () => void;
  clearAll: () => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      holdings: [],
      trades: [],
      history: [],

      buyStock: (stock: Stock, quantity: number, price?: number) => {
        // Restrict to market hours
        if (!isNSEMarketOpen()) return false;
        const unitPrice = price ?? stock.price;
        if (quantity <= 0) return false;

        const totalCost = unitPrice * quantity;
        const deducted = useBalanceStore.getState().deductFromBalance(totalCost);
        if (!deducted) return false;

        set((state) => {
          const existing = state.holdings.find((h) => h.stockId === stock.id);
          if (existing) {
            const newQty = existing.quantity + quantity;
            const newAvg = (existing.avgBuyPrice * existing.quantity + unitPrice * quantity) / newQty;
            existing.quantity = newQty;
            existing.avgBuyPrice = newAvg;
          } else {
            state.holdings.push({
              stockId: stock.id,
              symbol: stock.symbol,
              name: stock.name,
              quantity,
              avgBuyPrice: unitPrice,
            });
          }

          state.trades.unshift({
            id: `${Date.now()}`,
            stockId: stock.id,
            symbol: stock.symbol,
            quantity,
            price: unitPrice,
            type: "BUY",
            date: new Date().toISOString(),
          });

          return { holdings: state.holdings.slice(), trades: state.trades.slice(0, 50) };
        });

        return true;
      },

      sellStock: (stockId: string, quantity: number, price?: number) => {
        if (!isNSEMarketOpen()) return false;
        const stateSnapshot = get();
        const holding = stateSnapshot.holdings.find((h) => h.stockId === stockId);
        if (!holding || quantity <= 0 || quantity > holding.quantity) return false;
        const unitPrice = price ?? holding.avgBuyPrice; // fallback
        const proceeds = unitPrice * quantity;
        useBalanceStore.getState().addToBalance(proceeds);

        set((state) => {
          const h = state.holdings.find((x) => x.stockId === stockId);
          if (!h) return state;
          h.quantity = h.quantity - quantity;
          if (h.quantity <= 0) {
            state.holdings = state.holdings.filter((x) => x.stockId !== stockId);
          }

          state.trades.unshift({
            id: `${Date.now()}`,
            stockId: h.stockId,
            symbol: h.symbol,
            quantity,
            price: unitPrice,
            type: "SELL",
            date: new Date().toISOString(),
          });

          return { holdings: state.holdings.slice(), trades: state.trades.slice(0, 50) };
        });

        return true;
      },

      getHolding: (stockId: string) => {
        return get().holdings.find((h) => h.stockId === stockId);
      },

      addHistoryPoint: (value: number, date?: string) => {
        const point = { date: date ?? new Date().toISOString(), value };
        set((state) => ({ history: [...state.history, point].slice(-200) })); // keep last 200 points
      },

      clearHistory: () => set({ history: [] }),

  clearAll: () => set({ holdings: [], trades: [], history: [] }),
    }),
    {
      name: "portfolio-storage",
    }
  )
);

export default usePortfolioStore;
