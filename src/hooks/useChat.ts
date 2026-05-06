import { useCallback, useRef } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useWatchlistStore } from '../stores/watchlistStore';
import { usePortfolioStore } from '../stores/portfolioStore';

// Generate a stable chat ID per browser session
function getChatId(): string {
  const key = 'stock-chat-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function useChat() {
  const addMessage = useChatStore((s) => s.addMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const watchlist = useWatchlistStore((s) => s.symbols);
  const holdings = usePortfolioStore((s) => s.holdings);
  const chatIdRef = useRef(getChatId());

  const sendMessage = useCallback(
    async (text: string) => {
      addMessage({ role: 'user', content: text });
      setTyping(true);

      try {
        const context = {
          watchlist,
          portfolio: holdings.map((h) => ({
            symbol: h.symbol,
            shares: h.shares,
            buyPrice: h.buyPrice,
            currentPrice: h.currentPrice,
          })),
        };

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, context, chatId: chatIdRef.current }),
        });

        const data = await res.json();
        addMessage({ role: 'bot', content: data.reply || 'No response.' });
      } catch (err) {
        addMessage({ role: 'bot', content: 'Failed to get response. Is the server running?' });
      } finally {
        setTyping(false);
      }
    },
    [addMessage, setTyping, watchlist, holdings]
  );

  return { sendMessage };
}
