import { useFinanceStore } from '../../stores/financeStore';
import { formatPrice } from '../../utils/format';
import { Card } from '../ui/Card';

function getCurrentMonthEntries(entries: Array<{ date: string; type: string; recurring: boolean; amount: number; category?: string }>) {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return entries.filter((e) => e.date.startsWith(ym));
}

export function CostOfLiving() {
  const entries = useFinanceStore((s) => s.entries);
  const monthEntries = getCurrentMonthEntries(entries);
  const expenseEntries = monthEntries.filter((e) => e.type === 'expense');

  const recurringTotal = expenseEntries
    .filter((e) => e.recurring)
    .reduce((s, e) => s + e.amount, 0);
  const nonRecurringTotal = expenseEntries
    .filter((e) => !e.recurring)
    .reduce((s, e) => s + e.amount, 0);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const totalExpenses = recurringTotal + nonRecurringTotal;
  const avgDailySpend = daysElapsed > 0 ? totalExpenses / daysElapsed : 0;
  const projectedMonthly = avgDailySpend * daysInMonth;

  const topCategories = expenseEntries
    .reduce<Record<string, number>>((acc, e) => {
      const cat = e.category ?? 'other';
      acc[cat] = (acc[cat] || 0) + e.amount;
      return acc;
    }, {})
    ? Object.entries(
        expenseEntries.reduce<Record<string, number>>((acc, e) => {
          const cat = e.category ?? 'other';
          acc[cat] = (acc[cat] || 0) + e.amount;
          return acc;
        }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  const CATEGORY_LABELS: Record<string, string> = {
    housing: '住房', food: '餐饮', transport: '交通', utilities: '水电',
    entertainment: '娱乐', healthcare: '医疗', education: '教育',
    shopping: '购物', investments: '投资支出', other: '其他',
  };

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
        生活成本
      </h3>
      {expenseEntries.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-8">
          记录支出后查看生活成本分析
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded bg-white/5">
              <div className="text-xs text-gray-500 mb-1">固定支出</div>
              <div className="text-sm text-white font-mono">€{formatPrice(recurringTotal)}</div>
              <div className="text-xs text-gray-500">每月</div>
            </div>
            <div className="p-2 rounded bg-white/5">
              <div className="text-xs text-gray-500 mb-1">可变支出</div>
              <div className="text-sm text-white font-mono">€{formatPrice(nonRecurringTotal)}</div>
              <div className="text-xs text-gray-500">本月</div>
            </div>
            <div className="p-2 rounded bg-white/5">
              <div className="text-xs text-gray-500 mb-1">日均支出</div>
              <div className="text-sm text-white font-mono">€{formatPrice(avgDailySpend)}</div>
              <div className="text-xs text-gray-500">过去 {daysElapsed} 天</div>
            </div>
            <div className="p-2 rounded bg-white/5">
              <div className="text-xs text-gray-500 mb-1">预计月支出</div>
              <div className="text-sm text-white font-mono">€{formatPrice(projectedMonthly)}</div>
              <div className="text-xs text-gray-500">基于日均</div>
            </div>
          </div>

          {topCategories.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-2">TOP 支出类别</div>
              <div className="space-y-1.5">
                {topCategories.map(([cat, amount]) => (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{CATEGORY_LABELS[cat] || cat}</span>
                    <span className="text-gray-300 font-mono">€{formatPrice(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
