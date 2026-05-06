import { useFinanceStore } from '../../stores/financeStore';
import { formatPrice } from '../../utils/format';
import { Card } from '../ui/Card';

const CATEGORY_LABELS: Record<string, string> = {
  housing: '住房', food: '餐饮', transport: '交通', utilities: '水电',
  entertainment: '娱乐', healthcare: '医疗', education: '教育',
  shopping: '购物', investments: '投资支出', other: '其他',
};

const CATEGORY_ICONS: Record<string, string> = {
  housing: '🏠', food: '🍽️', transport: '🚗', utilities: '💡',
  entertainment: '🎬', healthcare: '🏥', education: '📚',
  shopping: '🛒', investments: '📈', other: '📦',
};

function getCurrentMonthEntries(entries: Array<{ date: string; type: string; category: string; amount: number }>) {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return entries.filter((e) => e.date.startsWith(ym));
}

export function BudgetPanel() {
  const entries = useFinanceStore((s) => s.entries);
  const monthEntries = getCurrentMonthEntries(entries);
  const expenseEntries = monthEntries.filter((e) => e.type === 'expense');

  const totalExpenses = expenseEntries.reduce((s, e) => s + e.amount, 0);
  const fixedCategories = ['housing', 'utilities', 'insurance'];
  const fixedTotal = expenseEntries
    .filter((e) => fixedCategories.includes(e.category))
    .reduce((s, e) => s + e.amount, 0);
  const variableTotal = totalExpenses - fixedTotal;

  const categoryTotals = expenseEntries.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
        预算分配
      </h3>
      {expenseEntries.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-8">
          记录支出后查看预算分配
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">总支出</span>
            <span className="text-white font-mono font-semibold">€{formatPrice(totalExpenses)}</span>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex-1 p-2 rounded bg-white/5">
              <div className="text-gray-500 mb-1">固定支出</div>
              <div className="text-white font-mono">€{formatPrice(fixedTotal)}</div>
              <div className="text-gray-500">{totalExpenses > 0 ? ((fixedTotal / totalExpenses) * 100).toFixed(1) : 0}%</div>
            </div>
            <div className="flex-1 p-2 rounded bg-white/5">
              <div className="text-gray-500 mb-1">可变支出</div>
              <div className="text-white font-mono">€{formatPrice(variableTotal)}</div>
              <div className="text-gray-500">{totalExpenses > 0 ? ((variableTotal / totalExpenses) * 100).toFixed(1) : 0}%</div>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            {sortedCategories.map(([cat, amount]) => {
              const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-sm w-5">{CATEGORY_ICONS[cat] || '📦'}</span>
                  <span className="text-xs text-gray-300 w-16">{CATEGORY_LABELS[cat] || cat}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500/60 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 font-mono w-16 text-right">€{formatPrice(amount)}</span>
                  <span className="text-xs text-gray-500 font-mono w-10 text-right">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
