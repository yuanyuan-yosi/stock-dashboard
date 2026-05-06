import { useWatchlistStore } from '../../stores/watchlistStore';
import { useWatchlistQuotes } from '../../hooks/useWatchlistQuotes';
import { StockSearch } from './StockSearch';
import { StockRow } from './StockRow';
import { Card } from '../ui/Card';
import type { SortField } from '../../stores/watchlistStore';

interface WatchlistProps {
  selectedSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
}

type ColumnKey = SortField | 'dayRange' | 'week52Range';

const COLUMNS: { key: ColumnKey; label: string; align: string; hideOnSmall?: boolean }[] = [
  { key: 'symbol', label: 'Symbol', align: '' },
  { key: 'price', label: 'Price', align: 'text-right' },
  { key: 'change', label: 'Chg', align: 'text-right' },
  { key: 'pe', label: 'PE', align: 'text-right', hideOnSmall: true },
  { key: 'volume', label: 'Vol', align: 'text-right', hideOnSmall: true },
  { key: 'dayRange', label: 'H/L', align: 'text-right', hideOnSmall: true },
  { key: 'week52Range', label: '52W', align: 'text-right', hideOnSmall: true },
  { key: 'distFromHigh', label: 'Off High', align: 'text-right', hideOnSmall: true },
];

const SORTABLE_KEYS: SortField[] = ['symbol', 'price', 'change', 'pe', 'volume', 'distFromHigh'];

export function Watchlist({ selectedSymbol, onSelectSymbol }: WatchlistProps) {
  const symbols = useWatchlistStore((s) => s.symbols);
  const removeSymbol = useWatchlistStore((s) => s.removeSymbol);
  const sortField = useWatchlistStore((s) => s.sortField);
  const sortDirection = useWatchlistStore((s) => s.sortDirection);
  const toggleSort = useWatchlistStore((s) => s.toggleSort);
  const { sortedSymbols, quotesMap } = useWatchlistQuotes();

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Watchlist
        </h2>
        <div className="w-64">
          <StockSearch onSelect={onSelectSymbol} />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="grid grid-cols-8 text-xs text-gray-500 font-mono px-3 py-2 border-b border-[var(--color-border)]">
          {COLUMNS.map((col) => {
            const isSortable = SORTABLE_KEYS.includes(col.key as SortField);
            return (
              <span
                key={col.key}
                onClick={isSortable ? () => toggleSort(col.key as SortField) : undefined}
                className={`hover:text-gray-300 select-none ${col.align} ${col.hideOnSmall ? 'hidden sm:block' : ''} ${isSortable ? 'cursor-pointer' : ''}`}
              >
                {col.label}
                <span className="text-gray-400">{sortIndicator(col.key as SortField)}</span>
              </span>
            );
          })}
        </div>
        {symbols.length === 0 ? (
          <div className="px-3 py-8 text-center text-gray-500 text-sm">
            No stocks in watchlist. Search to add stocks.
          </div>
        ) : (
          sortedSymbols.map((symbol) => (
            <StockRow
              key={symbol}
              symbol={symbol}
              isSelected={symbol === selectedSymbol}
              onClick={() => onSelectSymbol?.(symbol)}
              onRemove={() => removeSymbol(symbol)}
              quoteData={quotesMap.get(symbol)}
            />
          ))
        )}
      </Card>
    </div>
  );
}
