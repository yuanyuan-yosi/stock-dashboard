import { useState } from 'react';
import { useStockQuote } from '../../hooks/useStockQuote';
import { PriceChart } from './PriceChart';
import { TimeRangeButtons } from './TimeRangeButtons';
import { formatPrice, formatChange, formatPercent, formatVolume, formatMarketCap } from '../../utils/format';
import { getChangeColor } from '../../utils/color';
import { Skeleton } from '../ui/Skeleton';
import type { TimeRange } from '../../types';

interface StockDetailProps {
  symbol: string;
  onClose?: () => void;
}

export function StockDetail({ symbol, onClose }: StockDetailProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1d');
  const { data, isLoading, error } = useStockQuote(symbol);

  if (error) {
    return (
      <div className="text-red-400 text-sm text-center py-8">
        Failed to load {symbol}. Check if the symbol is valid.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <Skeleton lines={4} />
      ) : data ? (
        <>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-2xl font-bold text-white">{data.symbol}</h2>
                <span className="text-gray-400 text-sm">{data.name}</span>
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-bold text-white font-mono tabular-nums">
                  ${formatPrice(data.price)}
                </span>
                <span className={`text-lg font-mono ${getChangeColor(data.change)}`}>
                  {formatChange(data.change)} ({formatPercent(data.changePercent)})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TimeRangeButtons value={timeRange} onChange={setTimeRange} />
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-white transition-colors p-1"
                  title="Close chart"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <PriceChart symbol={symbol} range={timeRange} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Open" value={`$${formatPrice(data.open)}`} />
            <Stat label="Prev Close" value={`$${formatPrice(data.previousClose)}`} />
            <Stat label="Day High" value={`$${formatPrice(data.dayHigh)}`} />
            <Stat label="Day Low" value={`$${formatPrice(data.dayLow)}`} />
            <Stat label="Volume" value={formatVolume(data.volume)} />
            {data.marketCap && <Stat label="Market Cap" value={formatMarketCap(data.marketCap)} />}
            {data.week52High && <Stat label="52W High" value={`$${formatPrice(data.week52High)}`} />}
            {data.week52Low && <Stat label="52W Low" value={`$${formatPrice(data.week52Low)}`} />}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-white font-mono tabular-nums">{value}</div>
    </div>
  );
}
