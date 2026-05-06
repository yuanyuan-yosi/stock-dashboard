import { useState } from 'react';
import { FinanceOverview } from './FinanceOverview';
import { CashFlowEntry } from './CashFlowEntry';
import { CashFlowChart } from './CashFlowChart';
import { PredictedReturns } from './PredictedReturns';
import { GrowthChart } from './GrowthChart';

type FinanceSubTab = 'overview' | 'cashflow' | 'predictions' | 'growth';

export function FinanceView() {
  const [subTab, setSubTab] = useState<FinanceSubTab>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1">
        {([
          { id: 'overview' as const, label: 'Overview' },
          { id: 'cashflow' as const, label: 'Income & Expenses' },
          { id: 'predictions' as const, label: 'Predictions' },
          { id: 'growth' as const, label: 'Growth' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              subTab === tab.id
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'overview' && <FinanceOverview />}
      {subTab === 'cashflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CashFlowEntry />
          <CashFlowChart />
        </div>
      )}
      {subTab === 'predictions' && <PredictedReturns />}
      {subTab === 'growth' && <GrowthChart />}
    </div>
  );
}
