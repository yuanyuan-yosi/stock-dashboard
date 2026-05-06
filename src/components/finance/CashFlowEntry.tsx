import { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import type { FinanceCategory } from '../../types';
import { formatPrice } from '../../utils/format';
import { getChangeColor } from '../../utils/color';
import { Card } from '../ui/Card';

const INCOME_CATEGORIES: { value: FinanceCategory; label: string }[] = [
  { value: 'salary', label: '工资' },
  { value: 'side-income', label: '副业' },
  { value: 'dividends', label: '股息' },
  { value: 'interest', label: '利息' },
  { value: 'other', label: '其他' },
];

const EXPENSE_CATEGORIES: { value: FinanceCategory; label: string }[] = [
  { value: 'housing', label: '住房' },
  { value: 'food', label: '餐饮' },
  { value: 'transport', label: '交通' },
  { value: 'utilities', label: '水电' },
  { value: 'entertainment', label: '娱乐' },
  { value: 'healthcare', label: '医疗' },
  { value: 'education', label: '教育' },
  { value: 'shopping', label: '购物' },
  { value: 'investments', label: '投资支出' },
  { value: 'other', label: '其他' },
];

const CATEGORY_LABELS: Record<string, string> = {
  salary: '工资', 'side-income': '副业', dividends: '股息', interest: '利息',
  housing: '住房', food: '餐饮', transport: '交通', utilities: '水电',
  entertainment: '娱乐', healthcare: '医疗', education: '教育',
  shopping: '购物', investments: '投资支出', other: '其他',
};

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function CashFlowEntry() {
  const entries = useFinanceStore((s) => s.entries);
  const addEntry = useFinanceStore((s) => s.addEntry);
  const removeEntry = useFinanceStore((s) => s.removeEntry);

  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<FinanceCategory>('food');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayString);
  const [description, setDescription] = useState('');
  const [recurring, setRecurring] = useState(false);

  const categories = entryType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || !date) return;

    addEntry({
      date,
      type: entryType,
      category,
      amount: num,
      description: description.trim(),
      recurring,
    });

    setAmount('');
    setDescription('');
    setRecurring(false);
  };

  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
        记录收支
      </h3>

      {/* Toggle */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => { setEntryType('income'); setCategory('salary'); }}
          className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            entryType === 'income'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          收入
        </button>
        <button
          onClick={() => { setEntryType('expense'); setCategory('food'); }}
          className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            entryType === 'expense'
              ? 'bg-red-500/20 text-red-400'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          支出
        </button>
      </div>

      {/* Form */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">类别</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FinanceCategory)}
              className="w-full bg-white/5 border border-[var(--color-border)] rounded px-3 py-1.5 text-sm text-white"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">金额</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full bg-white/5 border border-[var(--color-border)] rounded px-3 py-1.5 text-sm text-white font-mono"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-[var(--color-border)] rounded px-3 py-1.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">描述</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="可选"
              className="w-full bg-white/5 border border-[var(--color-border)] rounded px-3 py-1.5 text-sm text-white"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="recurring"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="recurring" className="text-xs text-gray-400">每月固定支出</label>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!amount || parseFloat(amount) <= 0}
          className={`w-full px-4 py-2 text-sm rounded-lg font-semibold transition-colors ${
            entryType === 'income'
              ? 'bg-emerald-400 hover:bg-emerald-300 text-black'
              : 'bg-red-400 hover:bg-red-300 text-black'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          + 添加{entryType === 'income' ? '收入' : '支出'}
        </button>
      </div>

      {/* History */}
      {sortedEntries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className="text-xs text-gray-500 mb-2">最近记录</div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {sortedEntries.slice(0, 20).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 text-xs py-1.5 px-2 rounded hover:bg-white/5 group"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${entry.type === 'income' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="text-gray-500 w-20 shrink-0">{entry.date}</span>
                <span className="text-gray-400 w-12 shrink-0">{CATEGORY_LABELS[entry.category] || entry.category}</span>
                <span className={`flex-1 truncate ${getChangeColor(entry.type === 'income' ? entry.amount : -entry.amount)}`}>
                  {entry.type === 'income' ? '+' : '-'}${formatPrice(entry.amount)}
                </span>
                {entry.description && (
                  <span className="text-gray-600 truncate max-w-[80px]">{entry.description}</span>
                )}
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
