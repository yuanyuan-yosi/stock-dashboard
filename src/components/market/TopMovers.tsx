import { Card } from '../ui/Card';
import { formatPrice, formatVolume, formatPercent } from '../../utils/format';
import { getChangeColor } from '../../utils/color';
import { useMovers } from '../../hooks/useMarketData';
import { Skeleton } from '../ui/Skeleton';
import type { MoverStock } from '../../types';

export function TopMovers() {
  const { data, isLoading, error } = useMovers();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Card><Skeleton lines={8} /></Card>
        <Card><Skeleton lines={8} /></Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-red-400 text-sm text-center py-4">Failed to load market movers</div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MoversTable title="Top Gainers" stocks={data?.gainers || []} />
      <MoversTable title="Top Losers" stocks={data?.losers || []} />
    </div>
  );
}

function MoversTable({ title, stocks }: { title: string; stocks: MoverStock[] }) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">{title}</h3>
      <div className="space-y-1">
        <div className="grid grid-cols-4 text-xs text-gray-500 font-mono pb-2 border-b border-[var(--color-border)]">
          <span>Symbol</span>
          <span className="text-right">Price</span>
          <span className="text-right">Chg %</span>
          <span className="text-right">Volume</span>
        </div>
        {stocks.slice(0, 10).map((stock) => {
          const color = getChangeColor(stock.changePercent);
          return (
            <div
              key={stock.symbol}
              className="grid grid-cols-4 text-xs py-1.5 hover:bg-white/5 rounded transition-colors cursor-pointer"
            >
              <span className="text-white font-semibold">{stock.symbol}</span>
              <span className="text-right font-mono text-gray-300">${formatPrice(stock.price)}</span>
              <span className={`text-right font-mono ${color}`}>{formatPercent(stock.changePercent)}</span>
              <span className="text-right font-mono text-gray-500">{formatVolume(stock.volume)}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
