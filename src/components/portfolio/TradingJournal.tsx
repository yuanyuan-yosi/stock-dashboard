import { useJournalStore } from '../../stores/journalStore';
import { JournalList } from './JournalList';
import { Card } from '../ui/Card';

export function TradingJournal() {
  const entries = useJournalStore((s) => s.entries);

  const totalTrades = entries.length;
  const buyCount = entries.filter((e) => e.action === 'buy').length;
  const sellCount = entries.filter((e) => e.action === 'sell').length;
  const totalVolume = entries.reduce((sum, e) => sum + e.total, 0);

  const uniqueSymbols = [...new Set(entries.map((e) => e.symbol))];
  const recentSymbols = entries.slice(0, 5).map((e) => e.symbol);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Trading Journal
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs text-gray-500 mb-1">Total Trades</div>
          <div className="text-xl font-bold text-white font-mono">{totalTrades}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500 mb-1">Buys / Sells</div>
          <div className="text-xl font-bold font-mono">
            <span className="text-emerald-400">{buyCount}</span>
            <span className="text-gray-600 mx-1">/</span>
            <span className="text-red-400">{sellCount}</span>
          </div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500 mb-1">Total Volume</div>
          <div className="text-xl font-bold text-white font-mono">
            ${totalVolume >= 1_000_000
              ? `${(totalVolume / 1_000_000).toFixed(1)}M`
              : totalVolume >= 1_000
                ? `${(totalVolume / 1_000).toFixed(1)}K`
                : totalVolume.toFixed(0)}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500 mb-1">Symbols Traded</div>
          <div className="text-xl font-bold text-white font-mono">{uniqueSymbols.length}</div>
          {recentSymbols.length > 0 && (
            <div className="text-xs text-gray-500 mt-1 truncate">
              {recentSymbols.join(' · ')}
            </div>
          )}
        </Card>
      </div>

      <JournalList />
    </div>
  );
}
