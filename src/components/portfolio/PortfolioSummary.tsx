import { useState, useEffect, useRef } from 'react';
import { usePortfolioStore } from '../../stores/portfolioStore';
import { fetchQuote } from '../../services/api';
import { formatPrice, formatChange, formatPercent } from '../../utils/format';
import { getChangeColor } from '../../utils/color';
import { Card } from '../ui/Card';

export function PortfolioSummary() {
  const holdings = usePortfolioStore((s) => s.holdings);
  const [hidden, setHidden] = useState(true);

  if (holdings.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs text-gray-500 mb-1">Total Value</div>
          <div className="text-xl font-bold text-white font-mono">$0.00</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500 mb-1">Total Cost</div>
          <div className="text-xl font-bold text-white font-mono">$0.00</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500 mb-1">Total P&L</div>
          <div className="text-xl font-bold text-white font-mono">$0.00</div>
        </Card>
      </div>
    );
  }

  return <PortfolioStats holdings={holdings} hidden={hidden} onToggle={() => setHidden(!hidden)} />;
}

function PortfolioStats({
  holdings,
  hidden,
  onToggle,
}: {
  holdings: Array<{ id: string; symbol: string; shares: number; buyPrice: number; currentPrice: number }>;
  hidden: boolean;
  onToggle: () => void;
}) {
  const [priceMap, setPriceMap] = useState<Record<string, { price: number; change: number }>>({});
  const holdingsRef = useRef(holdings);
  holdingsRef.current = holdings;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const h = holdingsRef.current;
      const results = await Promise.all(
        h.map((holding) =>
          fetchQuote(holding.symbol)
            .then((q) => [holding.symbol, { price: q.price, change: q.change }] as const)
            .catch(() => null)
        )
      );
      if (cancelled) return;
      const map: Record<string, { price: number; change: number }> = {};
      for (const r of results) {
        if (r) map[r[0]] = r[1];
      }
      setPriceMap(map);
    }
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []); // run once on mount

  const todayGain = (() => {
    let gain = 0;
    let totalVal = 0;
    holdings.forEach((h) => {
      const q = priceMap[h.symbol];
      if (!q || isNaN(q.change) || isNaN(q.price)) return;
      gain += h.shares * q.change;
      totalVal += h.shares * q.price;
    });
    const prevTotal = totalVal - gain;
    const gainPct = prevTotal > 0 ? (gain / prevTotal) * 100 : 0;
    return { gain, gainPct };
  })();

  const totalCost = holdings.reduce((s, h) => s + h.shares * h.buyPrice, 0);
  const totalValue = holdings.reduce((s, h) => {
    const livePrice = priceMap[h.symbol]?.price;
    return s + h.shares * (livePrice != null && !isNaN(livePrice) ? livePrice : h.currentPrice);
  }, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const color = getChangeColor(totalPnl);
  const todayColor = getChangeColor(todayGain.gain);

  const mask = (val: number) => hidden ? '****' : `$${formatPrice(val)}`;
  const maskPct = () => hidden ? '**.*%' : formatPercent(totalPnlPct);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Card className="cursor-pointer group" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 mb-1">Total Value</div>
          <span className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors">
            {hidden ? '👁 show' : '🙈 hide'}
          </span>
        </div>
        <div className={`text-xl font-bold font-mono tabular-nums ${hidden ? 'text-gray-500' : 'text-white'}`}>
          {mask(totalValue)}
        </div>
      </Card>
      <Card>
        <div className="text-xs text-gray-500 mb-1">Total Cost</div>
        <div className={`text-xl font-bold font-mono tabular-nums ${hidden ? 'text-gray-500' : 'text-white'}`}>
          {mask(totalCost)}
        </div>
      </Card>
      <Card className="cursor-pointer group" onClick={onToggle}>
        <div className="text-xs text-gray-500 mb-1">Total P&L</div>
        <div className={`text-xl font-bold font-mono tabular-nums ${hidden ? 'text-gray-500' : color}`}>
          {hidden ? '****' : formatChange(totalPnl)} ({maskPct()})
        </div>
      </Card>
      <Card>
        <div className="text-xs text-gray-500 mb-1">Today's Gain</div>
        <div className={`text-xl font-bold font-mono tabular-nums ${hidden ? 'text-gray-500' : todayColor}`}>
          {hidden ? '****' : `${formatChange(todayGain.gain)} (${formatPercent(todayGain.gainPct)})`}
        </div>
      </Card>
    </div>
  );
}
