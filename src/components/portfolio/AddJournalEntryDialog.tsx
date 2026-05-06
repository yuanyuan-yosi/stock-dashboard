import { useState } from 'react';
import { useJournalStore } from '../../stores/journalStore';

interface AddJournalEntryDialogProps {
  onClose: () => void;
  defaultSymbol?: string;
  defaultAction?: 'buy' | 'sell';
}

const tagOptions = ['趋势', '反转', '突破', '回调', '消息面', '技术面', '基本面', '短线', '长线', '其他'];

export function AddJournalEntryDialog({ onClose, defaultSymbol = '', defaultAction = 'buy' }: AddJournalEntryDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [action, setAction] = useState<'buy' | 'sell'>(defaultAction);
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const addEntry = useJournalStore((s) => s.addEntry);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!symbol || !shares || !price) return;
    const s = parseFloat(shares);
    const p = parseFloat(price);
    addEntry({
      date,
      symbol: symbol.toUpperCase(),
      action,
      shares: s,
      price: p,
      total: s * p,
      notes,
      tags: selectedTags,
    });
    onClose();
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold text-white mb-4">New Journal Entry</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[var(--color-primary)] border border-[var(--color-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="AAPL"
                className="w-full bg-[var(--color-primary)] border border-[var(--color-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-gray-500 uppercase"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Action</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAction('buy')}
                  className={`flex-1 py-2 text-sm rounded font-semibold transition-colors ${
                    action === 'buy'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-[var(--color-primary)] text-gray-400 border border-[var(--color-border)]'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setAction('sell')}
                  className={`flex-1 py-2 text-sm rounded font-semibold transition-colors ${
                    action === 'sell'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                      : 'bg-[var(--color-primary)] text-gray-400 border border-[var(--color-border)]'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Shares</label>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="100"
                  min="0"
                  step="any"
                  className="w-full bg-[var(--color-primary)] border border-[var(--color-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Price ($)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="150.00"
                  min="0"
                  step="0.01"
                  className="w-full bg-[var(--color-primary)] border border-[var(--color-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-gray-500"
                />
              </div>
            </div>
          </div>

          {shares && price && (
            <div className="bg-[var(--color-primary)] rounded px-3 py-2 text-sm">
              <span className="text-gray-400">Total: </span>
              <span className="text-white font-mono">
                ${(parseFloat(shares) * parseFloat(price)).toFixed(2)}
              </span>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 block mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {tagOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                      : 'bg-[var(--color-primary)] text-gray-500 border border-[var(--color-border)] hover:text-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Trade rationale, market conditions, lessons learned..."
              rows={3}
              className="w-full bg-[var(--color-primary)] border border-[var(--color-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-gray-500 resize-none placeholder:text-gray-600"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-400 hover:text-white border border-[var(--color-border)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg font-semibold transition-colors"
            >
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
