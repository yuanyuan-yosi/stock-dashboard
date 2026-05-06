import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JournalEntry } from '../types';

interface JournalState {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => void;
  removeEntry: (id: string) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: [
            { ...entry, id: generateId(), createdAt: Date.now() },
            ...state.entries,
          ],
        })),
      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
    }),
    { name: 'stock-journal' }
  )
);
