import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FinanceEntry, GrowthSnapshot } from '../types';

interface FinanceState {
  entries: FinanceEntry[];
  snapshots: GrowthSnapshot[];
  addEntry: (entry: Omit<FinanceEntry, 'id' | 'createdAt'>) => void;
  removeEntry: (id: string) => void;
  addSnapshot: (snapshot: GrowthSnapshot) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      entries: [],
      snapshots: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: [
            ...state.entries,
            { ...entry, id: generateId(), createdAt: Date.now() },
          ],
        })),
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
      addSnapshot: (snapshot) =>
        set((state) => ({
          snapshots: [...state.snapshots, snapshot],
        })),
    }),
    { name: 'stock-finance' }
  )
);
