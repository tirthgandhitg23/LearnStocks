
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BalanceState {
  balance: number;
  setBalance: (balance: number) => void;
  addToBalance: (amount: number) => void;
  deductFromBalance: (amount: number) => boolean; // Returns success status
}

export const useBalanceStore = create<BalanceState>()(
  persist(
    (set, get) => ({
      balance: 10000, // Default starting balance
      setBalance: (balance: number) => set({ balance }),
      addToBalance: (amount: number) => set((state) => ({ balance: state.balance + amount })),
      deductFromBalance: (amount: number) => {
        const currentBalance = get().balance;
        if (currentBalance >= amount) {
          set({ balance: currentBalance - amount });
          return true;
        }
        return false;
      },
    }),
    {
      name: 'balance-storage', // unique name for localStorage
    }
  )
);
