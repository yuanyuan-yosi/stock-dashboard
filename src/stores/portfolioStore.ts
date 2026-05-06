import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PortfolioHolding } from '../types';

interface PortfolioState {
  holdings: PortfolioHolding[];
  addHolding: (holding: Omit<PortfolioHolding, 'id' | 'currentPrice'>) => void;
  updateHolding: (id: string, updates: Partial<PortfolioHolding>) => void;
  removeHolding: (id: string) => void;
  replaceHoldings: (holdings: Omit<PortfolioHolding, 'id' | 'currentPrice'>[]) => void;
  updatePrices: (prices: Record<string, number>) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      holdings: [],
      addHolding: (holding) =>
        set((state) => ({
          holdings: [
            ...state.holdings,
            { ...holding, id: generateId(), currentPrice: holding.buyPrice, platform: holding.platform },
          ],
        })),
      updateHolding: (id, updates) =>
        set((state) => ({
          holdings: state.holdings.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        })),
      removeHolding: (id) =>
        set((state) => ({
          holdings: state.holdings.filter((h) => h.id !== id),
        })),
      replaceHoldings: (newHoldings) =>
        set({
          holdings: newHoldings.map((h) => ({
            ...h,
            id: generateId(),
            currentPrice: h.buyPrice,
          })),
        }),
      updatePrices: (prices) =>
        set((state) => ({
          holdings: state.holdings.map((h) => ({
            ...h,
            currentPrice: prices[h.symbol] ?? h.currentPrice,
          })),
        })),
    }),
    { name: 'stock-portfolio' }
  )
);
