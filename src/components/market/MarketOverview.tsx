import { IndexCard } from './IndexCard';
import { MacroIndicators } from './MacroIndicators';
import { TopMovers } from './TopMovers';
import { SentimentPanel } from './SentimentPanel';
import { useMarketIndices } from '../../hooks/useMarketData';
import { Skeleton } from '../ui/Skeleton';

export function MarketOverview() {
  const { data: indices, isLoading, error } = useMarketIndices();

  if (error) {
    return (
      <div className="text-red-400 text-sm text-center py-8">
        Failed to load market data. Check if the API server is running.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Major Indices
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-4">
                  <Skeleton lines={3} />
                </div>
              ))
            : indices?.map((index) => (
                <IndexCard key={index.symbol} data={index} />
              ))}
        </div>
      </div>

      <SentimentPanel />

      <MacroIndicators />

      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Market Movers
        </h2>
        <TopMovers />
      </div>
    </div>
  );
}
