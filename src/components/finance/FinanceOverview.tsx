import { useState } from 'react';
import { usePortfolioStore } from '../../stores/portfolioStore';
import { useFinanceStore } from '../../stores/financeStore';
import { useStockQuote } from '../../hooks/useStockQuote';
import { formatPrice, formatChange, formatPercent } from '../../utils/format';
import { getChangeColor } from '../../utils/color';
import { Card } from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BudgetPanel } from './BudgetPanel';
import { CostOfLiving } from './CostOfLiving';
import { AssetAllocation } from './AssetAllocation';
import { AccountBalances } from './AccountBalances';

const PIE_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

const CATEGORY_LABELS: Record<string, string> = {
  housing: '住房', food: '餐饮', transport: '交通', utilities: '水电',
  entertainment: '娱乐', healthcare: '医疗', education: '教育',
  shopping: '购物', investments: '投资支出', other: '其他',
};

function getCurrentMonthEntries(entries: Array<{ date: string; type: string; amount: number; category?: string }>) {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return entries.filter((e) => e.date.startsWith(ym));
}

export function FinanceOverview() {
  const holdings = usePortfolioStore((s) => s.holdings);
  const entries = useFinanceStore((s) => s.entries);
  const [hidden, setHidden] = useState(true);

  const totalCost = holdings.reduce((s, h) => s + h.shares * h.buyPrice, 0);
  const totalValue = holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0);
  const totalReturns = totalValue - totalCost;
  const totalReturnsPct = totalCost > 0 ? (totalReturns / totalCost) * 100 : 0;

  const monthEntries = getCurrentMonthEntries(entries);
  const monthlyIncome = monthEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const monthlyExpenses = monthEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const netCashFlow = monthlyIncome - monthlyExpenses;

  const expenseByCategory = monthEntries
    .filter((e) => e.type === 'expense')
    .reduce<Record<string, number>>((acc, e) => {
      const cat = e.category ?? 'other';
      acc[cat] = (acc[cat] || 0) + e.amount;
      return acc;
    }, {});

  const pieData = Object.entries(expenseByCategory)
    .map(([name, value]) => ({ name: CATEGORY_LABELS[name] || name, value }))
    .sort((a, b) => b.value - a.value);

  const mask = (val: string) => hidden ? '****' : val;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => setHidden(!hidden)}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          {hidden ? '👁 show' : '🙈 hide'}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <div className="text-xs text-gray-500 mb-1">本金</div>
          <div className="text-xl font-bold text-white font-mono tabular-nums">
            {mask(`€${formatPrice(totalCost)}`)}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500 mb-1">市值</div>
          <div className="text-xl font-bold text-white font-mono tabular-nums">
            {mask(`€${formatPrice(totalValue)}`)}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500 mb-1">收益</div>
          <div className={`text-xl font-bold font-mono tabular-nums ${hidden ? 'text-white' : getChangeColor(totalReturns)}`}>
            {hidden ? '****' : `${formatChange(totalReturns)} (${formatPercent(totalReturnsPct)})`}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500 mb-1">本月收入</div>
          <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
            {mask(`€${formatPrice(monthlyIncome)}`)}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500 mb-1">本月支出</div>
          <div className="text-xl font-bold text-red-400 font-mono tabular-nums">
            {mask(`€${formatPrice(monthlyExpenses)}`)}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-gray-500 mb-1">净现金流</div>
          <div className={`text-xl font-bold font-mono tabular-nums ${hidden ? 'text-white' : getChangeColor(netCashFlow)}`}>
            {hidden ? '****' : formatChange(netCashFlow)}
          </div>
        </Card>
      </div>

      {/* Asset Allocation + Account Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AssetAllocation />
        <AccountBalances />
      </div>

      {/* Budget + Cost of Living */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetPanel />
        <CostOfLiving />
      </div>

      {/* Budget Pie Chart */}
      {pieData.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            本月支出分布
          </h3>
          <div className="flex items-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid #1f2937',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [hidden ? '****' : `€${Number(value).toFixed(2)}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {pieData.map((item, i) => {
                const pct = (item.value / monthlyExpenses) * 100;
                return (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-gray-300 flex-1">{item.name}</span>
                    <span className="text-gray-500 font-mono">{hidden ? '****' : `€${formatPrice(item.value)}`}</span>
                    <span className="text-gray-500 font-mono w-12 text-right">{hidden ? '**' : `${pct.toFixed(1)}%`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Stock Performance Table */}
      {holdings.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            每支股票表现
          </h3>
          <StockPerformanceTable holdings={holdings} />
        </Card>
      )}
    </div>
  );
}

function StockPerformanceTable({
  holdings,
}: {
  holdings: Array<{ id: string; symbol: string; shares: number; buyPrice: number; currentPrice: number }>;
}) {
  return (
    <div className="space-y-0">
      <div className="grid grid-cols-7 text-xs text-gray-500 font-mono px-4 py-2 border-b border-[var(--color-border)]">
        <span>Symbol</span>
        <span className="text-right">Shares</span>
        <span className="text-right">Cost</span>
        <span className="text-right">Current</span>
        <span className="text-right">P&L</span>
        <span className="text-right">P&L %</span>
        <span className="text-right">Weight</span>
      </div>
      {holdings.map((h) => (
        <StockPerfRow key={h.id} holding={h} totalValue={holdings.reduce((s, x) => s + x.shares * x.currentPrice, 0)} />
      ))}
    </div>
  );
}

function StockPerfRow({
  holding,
  totalValue,
}: {
  holding: { id: string; symbol: string; shares: number; buyPrice: number; currentPrice: number };
  totalValue: number;
}) {
  const { data: quote } = useStockQuote(holding.symbol);
  const currentPrice = quote?.price ?? holding.currentPrice;
  const totalCost = holding.shares * holding.buyPrice;
  const totalHoldingValue = holding.shares * currentPrice;
  const pnl = totalHoldingValue - totalCost;
  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
  const weight = totalValue > 0 ? (totalHoldingValue / totalValue) * 100 : 0;
  const color = getChangeColor(pnl);

  return (
    <div className="grid grid-cols-7 text-xs py-3 px-4 border-b border-[var(--color-border)] hover:bg-white/5 transition-colors items-center">
      <span className="text-white font-semibold">{holding.symbol}</span>
      <span className="text-right font-mono text-gray-300">{holding.shares}</span>
      <span className="text-right font-mono text-gray-300">€{formatPrice(totalCost)}</span>
      <span className="text-right font-mono text-gray-300">€{formatPrice(totalHoldingValue)}</span>
      <span className={`text-right font-mono ${color}`}>{formatChange(pnl)}</span>
      <span className={`text-right font-mono ${color}`}>{formatPercent(pnlPct)}</span>
      <span className="text-right font-mono text-gray-400">{weight.toFixed(1)}%</span>
    </div>
  );
}
