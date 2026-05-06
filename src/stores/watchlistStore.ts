import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SortField = 'symbol' | 'price' | 'change' | 'volume' | 'pe' | 'distFromHigh';
export type SortDirection = 'asc' | 'desc';

interface WatchlistState {
  symbols: string[];
  sortField: SortField;
  sortDirection: SortDirection;
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  reorderSymbols: (from: number, to: number) => void;
  toggleSort: (field: SortField) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'PLTR', '000660.KS'],
      sortField: 'symbol',
      sortDirection: 'asc',
      addSymbol: (symbol) =>
        set((state) => ({
          symbols: state.symbols.includes(symbol)
            ? state.symbols
            : [...state.symbols, symbol],
        })),
      removeSymbol: (symbol) =>
        set((state) => ({
          symbols: state.symbols.filter((s) => s !== symbol),
        })),
      reorderSymbols: (from, to) =>
        set((state) => {
          const arr = [...state.symbols];
          const [moved] = arr.splice(from, 1);
          arr.splice(to, 0, moved);
          return { symbols: arr };
        }),
      toggleSort: (field) =>
        set((state) => ({
          sortField: field,
          sortDirection:
            state.sortField === field && state.sortDirection === 'asc' ? 'desc' : 'asc',
        })),
    }),
    { name: 'stock-watchlist' }
  )
);
