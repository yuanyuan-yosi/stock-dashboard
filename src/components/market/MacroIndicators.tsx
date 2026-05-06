import { useMacroIndicators } from '../../hooks/useMarketData';
import { formatPrice, formatRate, formatPercent } from '../../utils/format';
import { getChangeColor } from '../../utils/color';
import { Skeleton } from '../ui/Skeleton';
import type { IndexData } from '../../types';

const ICONS: Record<string, string> = {
  'GC=F': '🥇',
  'CL=F': '🛢',
  'US 2Y Yield': '📄',
  'US 10Y Yield': '📄',
  'BTC-USD': '₿',
  'EURUSD=X': '💶',
  'EURCNY=X': '🇪🇺',
};

const PREFIX: Record<string, string> = {
  'GC=F': '$',
  'CL=F': '$',
  'US 2Y Yield': '',
  'US 10Y Yield': '',
  'BTC-USD': '$',
  'EURUSD=X': '',
  'EURCNY=X': '¥',
};

export function MacroIndicators() {
  const { data: indicators, isLoading, error } = useMacroIndicators();

  if (error) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Macro
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-3">
                <Skeleton lines={2} />
              </div>
            ))
          : indicators?.map((ind) => <MacroCard key={ind.symbol} data={ind} />)}
      </div>
    </div>
  );
}

function MacroCard({ data }: { data: IndexData }) {
  const color = getChangeColor(data.change);
  const icon = ICONS[data.symbol] || '';
  const prefix = PREFIX[data.symbol] || '';

  const isYield = data.symbol === 'US 2Y Yield' || data.symbol === 'US 10Y Yield';
  const isRate = data.symbol === 'EURUSD=X' || data.symbol === 'EURCNY=X';

  return (
    <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-3 hover:border-gray-600 transition-colors">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-gray-500 font-mono truncate">{data.name}</span>
      </div>
      <div className="text-sm text-white font-mono tabular-nums font-semibold">
        {prefix}{isYield ? `${data.price.toFixed(2)}%` : isRate ? formatRate(data.price) : formatPrice(data.price)}
      </div>
      <div className={`text-xs font-mono ${color}`}>
        {isYield
          ? `${data.change >= 0 ? '+' : ''}${(data.change * 100).toFixed(1)}bp`
          : formatPercent(data.changePercent)}
      </div>
    </div>
  );
}
