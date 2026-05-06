import { useState } from 'react';
import { usePortfolioStore } from '../../stores/portfolioStore';
import { useFinanceStore } from '../../stores/financeStore';
import { formatPrice, formatPercent } from '../../utils/format';
import { getChangeColor } from '../../utils/color';
import { Card } from '../ui/Card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function GrowthChart() {
  const holdings = usePortfolioStore((s) => s.holdings);
  const snapshots = useFinanceStore((s) => s.snapshots);
  const addSnapshot = useFinanceStore((s) => s.addSnapshot);
  const [cashBalance, setCashBalance] = useState('');

  const totalPrincipal = holdings.reduce((s, h) => s + h.shares * h.buyPrice, 0);
  const totalMarketValue = holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0);

  const handleSnapshot = () => {
    const cash = parseFloat(cashBalance) || 0;
    addSnapshot({
      date: getTodayString(),
      principal: totalPrincipal,
      marketValue: totalMarketValue,
      cashBalance: cash,
    });
    setCashBalance('');
  };

  const chartData = snapshots.map((s) => ({
    date: s.date,
    principal: s.principal,
    marketValue: s.marketValue,
    cash: s.cashBalance,
    total: s.marketValue + s.cashBalance,
  }));

  let growthRate = 0;
  if (snapshots.length >= 2) {
    const first = snapshots[0].marketValue + snapshots[0].cashBalance;
    const last = snapshots[snapshots.length - 1].marketValue + snapshots[snapshots.length - 1].cashBalance;
    growthRate = first > 0 ? ((last - first) / first) * 100 : 0;
  }

  return (
    <div className="space-y-6">
      {/* Snapshot Controls */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
          快照记录
        </h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="p-2 rounded bg-white/5">
                <div className="text-xs text-gray-500 mb-1">本金</div>
                <div className="text-sm text-white font-mono">€{formatPrice(totalPrincipal)}</div>
              </div>
              <div className="p-2 rounded bg-white/5">
                <div className="text-xs text-gray-500 mb-1">市值</div>
                <div className="text-sm text-white font-mono">€{formatPrice(totalMarketValue)}</div>
              </div>
              <div className="p-2 rounded bg-white/5">
                <div className="text-xs text-gray-500 mb-1">增长</div>
                <div className={`text-sm font-mono ${getChangeColor(growthRate)}`}>
                  {formatPercent(growthRate)}
                </div>
              </div>
            </div>
            <label className="block text-xs text-gray-500 mb-1">现金余额</label>
            <input
              type="number"
              value={cashBalance}
              onChange={(e) => setCashBalance(e.target.value)}
              placeholder="输入当前现金余额"
              min="0"
              step="0.01"
              className="w-full bg-white/5 border border-[var(--color-border)] rounded px-3 py-1.5 text-sm text-white font-mono"
            />
          </div>
          <button
            onClick={handleSnapshot}
            className="px-4 py-2 text-sm text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg font-semibold transition-colors"
          >
            + 保存快照
          </button>
        </div>
      </Card>

      {/* Growth Chart */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
          增长速度
        </h3>
        {chartData.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            保存快照后查看增长趋势
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis
                  dataKey="date"
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
                    const labels: Record<string, string> = {
                      principal: '本金', marketValue: '市值', cash: '现金', total: '总资产',
                    };
                    return [`€{formatPrice(value)}`, labels[name] || name];
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      principal: '本金', marketValue: '市值', cash: '现金', total: '总资产',
                    };
                    return labels[value] || value;
                  }}
                  wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
                />
                <Line type="monotone" dataKey="principal" stroke="#6b7280" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="marketValue" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                <Line type="monotone" dataKey="cash" stroke="#3b82f6" strokeWidth={1} dot={{ r: 2, fill: '#3b82f6' }} />
                <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Snapshot History */}
      {snapshots.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            快照历史
          </h3>
          <div className="grid grid-cols-5 text-xs text-gray-500 font-mono px-4 py-2 border-b border-[var(--color-border)]">
            <span>Date</span>
            <span className="text-right">Principal</span>
            <span className="text-right">Market Value</span>
            <span className="text-right">Cash</span>
            <span className="text-right">Total</span>
          </div>
          {[...snapshots].reverse().map((s, i) => {
            const total = s.marketValue + s.cashBalance;
            return (
              <div key={i} className="grid grid-cols-5 text-xs py-2 px-4 border-b border-[var(--color-border)] hover:bg-white/5 items-center">
                <span className="text-gray-300 font-mono">{s.date}</span>
                <span className="text-right font-mono text-gray-300">€{formatPrice(s.principal)}</span>
                <span className="text-right font-mono text-gray-300">€{formatPrice(s.marketValue)}</span>
                <span className="text-right font-mono text-gray-300">€{formatPrice(s.cashBalance)}</span>
                <span className="text-right font-mono text-white">€{formatPrice(total)}</span>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
