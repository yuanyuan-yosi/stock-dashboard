import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isTyping: boolean;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setTyping: (typing: boolean) => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [
        {
          id: 'welcome',
          role: 'bot',
          content: "Welcome to MI Chat! Ask me about stocks, market data, or your portfolio.\n\nTry: AAPL, market, gainers, watchlist, portfolio, help",
          timestamp: Date.now(),
        },
      ],
      isOpen: false,
      isTyping: false,
      addMessage: (msg) =>
        set((state) => ({
          messages: [
            ...state.messages,
            { ...msg, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), timestamp: Date.now() },
          ],
        })),
      setTyping: (typing) => set({ isTyping: typing }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
      clearMessages: () => set({ messages: [] }),
    }),
    { name: 'stock-chat' }
  )
);
