import { formatPrice, formatPercent } from '../../utils/format';
import { getChangeColor } from '../../utils/color';
import { Card } from '../ui/Card';

interface Account {
  name: string;
  label: string;
  currency: 'EUR' | 'CNY';
  balances: number[];
  color: string;
}

const DATES = ['4/7', '4/15', '4/16', '4/24', '5/5'];

const ACCOUNTS: Account[] = [
  { name: 'SA', label: '收入账户', currency: 'EUR', balances: [6677, 6530, 4530, 4496, 5263], color: '#10b981' },
  { name: 'IN', label: '欧元收入', currency: 'EUR', balances: [5505, 5505, 5505, 5505, 5549], color: '#3b82f6' },
  { name: 'TR', label: '欧元交易', currency: 'EUR', balances: [4849, 4670, 4380, 4345, 3424], color: '#f59e0b' },
  { name: 'IB', label: '投资账户', currency: 'EUR', balances: [0, 0, 2597, 2597, 1205], color: '#8b5cf6' },
  { name: 'WE', label: '人民币支出', currency: 'CNY', balances: [19724, 19204, 18971, 18560, 17440], color: '#ef4444' },
  { name: 'AL', label: '人民币储蓄', currency: 'CNY', balances: [16089, 16090, 16089, 16089, 18790], color: '#06b6d4' },
];

const EUR_CNY_RATES = [7.94, 8.06, 8.03, 8.004, 7.99];

export function AccountBalances() {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
        账户余额
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 font-mono">
              <th className="text-left py-1 pr-3">账户</th>
              {DATES.map((d) => (
                <th key={d} className="text-right py-1 px-2">{d}</th>
              ))}
              <th className="text-right py-1 pl-2">变动</th>
            </tr>
          </thead>
          <tbody>
            {ACCOUNTS.map((acct) => {
              const first = acct.balances[0];
              const last = acct.balances[acct.balances.length - 1];
              const change = last - first;
              const changePct = first > 0 ? (change / first) * 100 : 0;
              const symbol = acct.currency === 'EUR' ? '€' : '¥';
              return (
                <tr key={acct.name} className="border-t border-[var(--color-border)]">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: acct.color }} />
                      <span className="text-gray-300 font-semibold">{acct.name}</span>
                      <span className="text-gray-500">{acct.label}</span>
                    </div>
                  </td>
                  {acct.balances.map((bal, i) => (
                    <td key={i} className="text-right font-mono text-gray-300 py-2 px-2">
                      {symbol}{formatPrice(bal)}
                    </td>
                  ))}
                  <td className={`text-right font-mono py-2 pl-2 ${getChangeColor(change)}`}>
                    <div>{symbol}{formatPrice(change)}</div>
                    <div className="text-[10px]">{formatPercent(changePct)}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* EUR/CNY Rate */}
      <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">EUR/CNY 汇率</span>
          <div className="flex items-center gap-3 font-mono">
            {EUR_CNY_RATES.map((rate, i) => (
              <span key={i} className="text-gray-400">
                <span className="text-gray-600 text-[10px]">{DATES[i]}:</span> {rate}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
