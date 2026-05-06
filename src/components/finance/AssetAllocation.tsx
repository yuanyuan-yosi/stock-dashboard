import { formatPrice, formatPercent } from '../../utils/format';
import { getChangeColor } from '../../utils/color';
import { Card } from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AssetItem {
  label: string;
  value: number;
  prev: number;
  color: string;
}

const ASSETS: AssetItem[] = [
  { label: '流动资产', value: 21126, prev: 22118, color: '#10b981' },
  { label: '投资市值', value: 15141, prev: 11901, color: '#f59e0b' },
  { label: '房产净值', value: 64013, prev: 63830, color: '#8b5cf6' },
  { label: '债务', value: -1394, prev: -1476, color: '#ef4444' },
];

const TOTAL = ASSETS.reduce((s, a) => s + a.value, 0);
const TOTAL_PREV = ASSETS.reduce((s, a) => s + a.prev, 0);

export function AssetAllocation() {
  const positiveAssets = ASSETS.filter((a) => a.value > 0);

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
        资产配置
      </h3>
      <div className="flex items-center gap-6">
        <div className="w-44 h-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={positiveAssets}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                dataKey="value"
                paddingAngle={2}
              >
                {positiveAssets.map((a, i) => (
                  <Cell key={i} fill={a.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid #1f2937',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`€${formatPrice(value)}`, 'Amount']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {ASSETS.map((a) => {
            const pct = TOTAL > 0 ? (a.value / TOTAL) * 100 : 0;
            const change = a.value - a.prev;
            return (
              <div key={a.label} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: a.color }} />
                <span className="text-gray-300 flex-1">{a.label}</span>
                <span className={`font-mono ${a.value < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                  €{formatPrice(Math.abs(a.value))}
                </span>
                <span className="text-gray-500 font-mono w-14 text-right">{formatPercent(pct)}</span>
                {change !== 0 && (
                  <span className={`font-mono w-16 text-right text-[10px] ${getChangeColor(change)}`}>
                    {change > 0 ? '+' : ''}{formatPrice(change)}
                  </span>
                )}
              </div>
            );
          })}
          <div className="pt-2 mt-2 border-t border-[var(--color-border)] flex items-center justify-between text-xs">
            <span className="text-gray-400 font-semibold">净资产 (5/5)</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono font-semibold">€{formatPrice(TOTAL)}</span>
              <span className={`font-mono text-[10px] ${getChangeColor(TOTAL - TOTAL_PREV)}`}>
                {TOTAL - TOTAL_PREV > 0 ? '+' : ''}{formatPrice(TOTAL - TOTAL_PREV)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
