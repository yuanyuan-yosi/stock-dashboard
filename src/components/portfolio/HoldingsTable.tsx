import { useState, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { usePortfolioStore } from '../../stores/portfolioStore';
import { fetchQuote } from '../../services/api';
import { formatPrice, formatChange } from '../../utils/format';
import { getChangeColor } from '../../utils/color';
import { Card } from '../ui/Card';

type SortField = 'symbol' | 'platform' | 'shares' | 'buyPrice' | 'currentPrice' | 'pnl' | 'pnlPct';
type SortDir = 'asc' | 'desc';

type FilterGroup = 'all' | 'us' | 'eu' | string;

function classifyStock(symbol: string): 'us' | 'eu' {
  if (/\.(MC|DE|AS|MI|PA|L|SW)$/i.test(symbol)) return 'eu';
  return 'us';
}

const COLS: { key: SortField; label: string; align: string }[] = [
  { key: 'symbol', label: 'Symbol', align: 'left' },
  { key: 'platform', label: 'Platform', align: 'left' },
  { key: 'shares', label: 'Shares', align: 'right' },
  { key: 'buyPrice', label: 'Avg Cost', align: 'right' },
  { key: 'currentPrice', label: 'Current', align: 'right' },
  { key: 'pnl', label: 'P&L', align: 'right' },
  { key: 'pnlPct', label: 'P&L %', align: 'right' },
];

export function HoldingsTable() {
  const holdings = usePortfolioStore((s) => s.holdings);
  const removeHolding = usePortfolioStore((s) => s.removeHolding);
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filter, setFilter] = useState<FilterGroup>('all');

  // Derive unique platforms from holdings
  const platforms = useMemo(() => {
    const set = new Set<string>();
    holdings.forEach((h) => { if (h.platform) set.add(h.platform); });
    return Array.from(set).sort();
  }, [holdings]);

  // Batch-fetch live quotes for sorting
  const quoteResults = useQueries({
    queries: holdings.map((h) => ({
      queryKey: ['quote', h.symbol],
      queryFn: () => fetchQuote(h.symbol),
      refetchInterval: 30000,
      staleTime: 15000,
      enabled: !!h.symbol,
    })),
  });

  // Build price map: symbol -> live price
  const priceMap = useMemo(() => {
    const map = new Map<string, number>();
    holdings.forEach((h, i) => {
      const price = quoteResults[i]?.data?.price;
      if (price != null) map.set(h.symbol, price);
    });
    return map;
  }, [holdings, quoteResults]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const arrow = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  // Compute P&L with live prices for sorting
  const withValues = useMemo(() => holdings.map((h) => {
    const livePrice = priceMap.get(h.symbol) ?? h.currentPrice;
    const totalCost = h.shares * h.buyPrice;
    const totalValue = h.shares * livePrice;
    const pnl = totalValue - totalCost;
    const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    return { ...h, livePrice, pnl, pnlPct };
  }), [holdings, priceMap]);

  const filtered = useMemo(() => {
    if (filter === 'all') return withValues;
    if (filter === 'us') return withValues.filter((h) => classifyStock(h.symbol) === 'us');
    if (filter === 'eu') return withValues.filter((h) => classifyStock(h.symbol) === 'eu');
    // Filter by platform
    return withValues.filter((h) => h.platform === filter);
  }, [withValues, filter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'symbol': cmp = a.symbol.localeCompare(b.symbol); break;
      case 'platform': cmp = (a.platform ?? '').localeCompare(b.platform ?? ''); break;
      case 'shares': cmp = a.shares - b.shares; break;
      case 'buyPrice': cmp = a.buyPrice - b.buyPrice; break;
      case 'currentPrice': cmp = a.livePrice - b.livePrice; break;
      case 'pnl': cmp = a.pnl - b.pnl; break;
      case 'pnlPct': cmp = a.pnlPct - b.pnlPct; break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  }), [filtered, sortField, sortDir]);

  if (holdings.length === 0) {
    return (
      <Card>
        <div className="text-center text-gray-500 text-sm py-8">
          No holdings yet. Click "Add Holding" to get started.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)] flex-wrap">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterChip>
        <FilterChip active={filter === 'us'} onClick={() => setFilter('us')}>🇺🇸 US</FilterChip>
        <FilterChip active={filter === 'eu'} onClick={() => setFilter('eu')}>🇪🇺 EU</FilterChip>
        {platforms.map((p) => (
          <FilterChip key={p} active={filter === p} onClick={() => setFilter(p)}>{p}</FilterChip>
        ))}
      </div>
      <div className="grid grid-cols-8 text-xs text-gray-500 font-mono px-4 py-2 border-b border-[var(--color-border)]">
        {COLS.map((col) => (
          <span
            key={col.key}
            className={`cursor-pointer hover:text-white transition-colors select-none ${
              col.align === 'right' ? 'text-right' : ''
            }`}
            onClick={() => toggleSort(col.key)}
          >
            {col.label}
            <span className="text-gray-600">{arrow(col.key)}</span>
          </span>
        ))}
        <span />
      </div>
      {sorted.map((holding) => (
        <HoldingRow
          key={holding.id}
          holding={holding}
          livePrice={holding.livePrice}
          onRemove={() => removeHolding(holding.id)}
        />
      ))}
    </Card>
  );
}

function HoldingRow({
  holding,
  livePrice,
  onRemove,
}: {
  holding: { id: string; symbol: string; shares: number; buyPrice: number; platform?: string };
  livePrice: number;
  onRemove: () => void;
}) {
  const totalCost = holding.shares * holding.buyPrice;
  const totalValue = holding.shares * livePrice;
  const pnl = totalValue - totalCost;
  const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
  const color = getChangeColor(pnl);

  return (
    <div className="grid grid-cols-8 text-xs py-3 px-4 border-b border-[var(--color-border)] hover:bg-white/5 transition-colors items-center">
      <span className="text-white font-semibold">{holding.symbol}</span>
      <span className="text-gray-500 font-mono text-[10px]">{holding.platform ?? '—'}</span>
      <span className="text-right font-mono text-gray-300">{holding.shares}</span>
      <span className="text-right font-mono text-gray-300">${formatPrice(holding.buyPrice)}</span>
      <span className="text-right font-mono text-gray-300">${formatPrice(livePrice)}</span>
      <span className={`text-right font-mono ${color}`}>
        {formatChange(pnl)}
      </span>
      <span className={`text-right font-mono ${color}`}>
        {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
      </span>
      <span className="text-right">
        <button
          onClick={onRemove}
          className="text-gray-600 hover:text-red-400 transition-colors"
        >
          ✕
        </button>
      </span>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        active
          ? 'bg-white/15 text-white border border-white/20'
          : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}
