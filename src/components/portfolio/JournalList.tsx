import { useJournalStore } from '../../stores/journalStore';
import { Card } from '../ui/Card';

export function JournalList() {
  const entries = useJournalStore((s) => s.entries);
  const removeEntry = useJournalStore((s) => s.removeEntry);

  if (entries.length === 0) {
    return (
      <Card>
        <div className="text-center text-gray-500 text-sm py-12">
          No journal entries yet. Click "New Entry" to record your first trade.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isBuy = entry.action === 'buy';
        return (
          <div
            key={entry.id}
            className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-4 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded ${
                    isBuy
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {entry.action.toUpperCase()}
                </span>
                <span className="text-lg font-bold text-white">{entry.symbol}</span>
                <span className="text-xs text-gray-500 font-mono">{entry.date}</span>
              </div>
              <button
                onClick={() => removeEntry(entry.id)}
                className="text-gray-600 hover:text-red-400 text-xs transition-colors"
              >
                Delete
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-3">
              <div>
                <div className="text-xs text-gray-500">Shares</div>
                <div className="text-sm text-white font-mono">{entry.shares}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Price</div>
                <div className="text-sm text-white font-mono">${entry.price.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-sm text-white font-mono">${entry.total.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 text-xs bg-blue-500/10 text-blue-400 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {entry.notes && (
              <div className="bg-[var(--color-primary)] rounded p-3 text-sm text-gray-300 border border-[var(--color-border)]">
                {entry.notes}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
