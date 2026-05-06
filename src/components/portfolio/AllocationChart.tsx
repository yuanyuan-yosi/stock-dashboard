import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { usePortfolioStore } from '../../stores/portfolioStore';
import { useStockQuote } from '../../hooks/useStockQuote';
import { Card } from '../ui/Card';

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

export function AllocationChart() {
  const holdings = usePortfolioStore((s) => s.holdings);

  if (holdings.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
          Allocation
        </h3>
        <div className="text-center text-gray-500 text-sm py-8">
          Add holdings to see allocation
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
        Allocation
      </h3>
      <AllocationPie holdings={holdings} />
    </Card>
  );
}

function AllocationPie({
  holdings,
}: {
  holdings: Array<{ id: string; symbol: string; shares: number; currentPrice: number }>;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={holdings.map((h) => ({
                name: h.symbol,
                value: h.shares * h.currentPrice,
              }))}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              dataKey="value"
              paddingAngle={2}
            >
              {holdings.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5">
        {holdings.map((h, i) => {
          const totalValue = holdings.reduce((s, x) => s + x.shares * x.currentPrice, 0);
          const value = h.shares * h.currentPrice;
          const pct = totalValue > 0 ? (value / totalValue) * 100 : 0;
          return (
            <div key={h.id} className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-gray-300 font-mono">{h.symbol}</span>
              <span className="text-gray-500 flex-1 text-right">{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
