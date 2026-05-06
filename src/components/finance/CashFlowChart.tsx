import { useMemo } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { formatPrice } from '../../utils/format';
import { Card } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart, Legend } from 'recharts';

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

export function CashFlowChart() {
  const entries = useFinanceStore((s) => s.entries);

  const chartData = useMemo(() => {
    const grouped: Record<string, { income: number; expense: number }> = {};

    for (const entry of entries) {
      const key = getMonthKey(entry.date);
      if (!grouped[key]) grouped[key] = { income: 0, expense: 0 };
      if (entry.type === 'income') {
        grouped[key].income += entry.amount;
      } else {
        grouped[key].expense += entry.amount;
      }
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, data]) => ({
        month: getMonthLabel(month),
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      }));
  }, [entries]);

  if (entries.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
          现金流趋势
        </h3>
        <div className="text-center text-gray-500 text-sm py-8">
          记录收支后查看现金流趋势
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
        现金流趋势
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€{formatPrice(v)}`}
              width={70}
            />
            <Tooltip
              contentStyle={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = { income: '收入', expense: '支出', net: '净额' };
                return [`€{formatPrice(value)}`, labels[name] || name];
              }}
            />
            <Legend
              formatter={(value) => {
                const labels: Record<string, string> = { income: '收入', expense: '支出', net: '净额' };
                return labels[value] || value;
              }}
              wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
            />
            <Bar dataKey="income" fill="#10b981" radius={[2, 2, 0, 0]} barSize={16} />
            <Bar dataKey="expense" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={16} />
            <Line
              dataKey="net"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: '#3b82f6' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
