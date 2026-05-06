import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useChat } from '../../hooks/useChat';
import { ChatMessage } from './ChatMessage';

export function ChatView() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isTyping);
  const { sendMessage } = useChat();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    sendMessage(text);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-lg font-bold text-white">MI Chat</h2>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">Market Assistant</span>
        </div>
        <span className="text-xs text-gray-600">Powered by Claude Code</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6 space-y-1">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div className="flex justify-start mb-3">
            <div className="bg-[var(--color-primary)] border border-[var(--color-border)] rounded-lg rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Commands */}
      <div className="flex flex-wrap gap-2 mt-3 mb-3">
        {['AAPL', 'market', 'gainers', 'compare AAPL MSFT', 'sector tech', 'help'].map((cmd) => (
          <button
            key={cmd}
            onClick={() => { setInput(cmd); inputRef.current?.focus(); }}
            className="px-3 py-1 text-xs text-gray-400 bg-white/5 hover:bg-white/10 hover:text-gray-200 rounded-full border border-[var(--color-border)] transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about stocks, markets, or anything..."
          className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gray-500 placeholder:text-gray-600"
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
