import { useStockQuote } from '../../hooks/useStockQuote';
import { formatPrice, formatChange, formatPercent, formatVolume, formatPe, formatDistFromHigh } from '../../utils/format';
import { getChangeColor } from '../../utils/color';
import { Skeleton } from '../ui/Skeleton';
import type { StockQuote } from '../../types';

interface StockRowProps {
  symbol: string;
  isSelected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  quoteData?: StockQuote;
}

export function StockRow({ symbol, isSelected, onClick, onRemove, quoteData }: StockRowProps) {
  const { data: fetchedData, isLoading, error } = useStockQuote(quoteData ? '' : symbol);
  const data = quoteData || fetchedData;

  if (isLoading) {
    return (
      <div className="grid grid-cols-8 items-center px-3 py-2 border-b border-[var(--color-border)]">
        <div className="col-span-8"><Skeleton lines={1} /></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid grid-cols-8 items-center px-3 py-2 border-b border-[var(--color-border)] text-red-400 text-xs">
        <div className="col-span-8 flex items-center gap-2">
          {symbol} — failed to load
          {onRemove && (
            <button onClick={onRemove} className="text-gray-500 hover:text-white">✕</button>
          )}
        </div>
      </div>
    );
  }

  const color = getChangeColor(data.change);

  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-8 items-center px-3 py-2 border-b border-[var(--color-border)] cursor-pointer transition-colors ${
        isSelected ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
    >
      <div className="min-w-0">
        <div className="text-sm text-white font-semibold">{data.symbol}</div>
        <div className="text-xs text-gray-500 truncate">{data.name}</div>
      </div>

      <div className="text-right text-sm text-white font-mono tabular-nums">
        ${formatPrice(data.price)}
      </div>

      <div className={`text-right text-xs font-mono ${color}`}>
        {formatChange(data.change)} ({formatPercent(data.changePercent)})
      </div>

      <div className="text-right text-xs font-mono text-gray-400 hidden sm:block">
        {formatPe(data.pe)}
      </div>

      <div className="text-right text-xs font-mono text-gray-400 hidden sm:block">
        {formatVolume(data.volume)}
      </div>

      <div className="text-right text-xs font-mono hidden sm:block">
        <span className="text-gray-500">{formatPrice(data.dayHigh)}</span>
        <span className="text-gray-600 mx-0.5">/</span>
        <span className="text-gray-500">{formatPrice(data.dayLow)}</span>
      </div>

      <div className="text-right text-xs font-mono hidden sm:block">
        {data.week52High != null && data.week52Low != null ? (
          <span>
            <span className="text-gray-500">{formatPrice(data.week52High)}</span>
            <span className="text-gray-600 mx-0.5">/</span>
            <span className="text-gray-500">{formatPrice(data.week52Low)}</span>
          </span>
        ) : (
          <span className="text-gray-600">—</span>
        )}
      </div>

      <div className="flex items-center justify-end gap-1">
        <span className={`text-xs font-mono hidden sm:block ${
          data.distFromHigh != null && data.distFromHigh < 0 ? 'text-red-400' : 'text-emerald-400'
        }`}>
          {formatDistFromHigh(data.distFromHigh)}
        </span>
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-gray-600 hover:text-red-400 text-xs"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
