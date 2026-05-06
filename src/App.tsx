import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/layout/Header';
import { MarketOverview } from './components/market/MarketOverview';
import { Watchlist } from './components/watchlist/Watchlist';
import { StockDetail } from './components/charts/StockDetail';
import { PortfolioSummary } from './components/portfolio/PortfolioSummary';
import { HoldingsTable } from './components/portfolio/HoldingsTable';
import { AllocationChart } from './components/portfolio/AllocationChart';
import { AddHoldingDialog } from './components/portfolio/AddHoldingDialog';
import { TradingJournal } from './components/portfolio/TradingJournal';
import { AddJournalEntryDialog } from './components/portfolio/AddJournalEntryDialog';
import { ChatView } from './components/chat/ChatView';
import { EconomyView } from './components/economy/EconomyView';
import { FinanceView } from './components/finance/FinanceView';
import { seedData } from './data/seedData';
import type { TabType } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [showAddHolding, setShowAddHolding] = useState(false);
  const [showAddJournal, setShowAddJournal] = useState(false);

  useEffect(() => {
    seedData();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[var(--color-primary)]">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="max-w-[1400px] mx-auto p-4 md:p-6">
          {activeTab === 'overview' && <MarketOverview />}

          {activeTab === 'watchlist' && (
            <div className={`grid grid-cols-1 gap-6 ${selectedStock ? 'lg:grid-cols-5' : ''}`}>
              <div className={selectedStock ? 'lg:col-span-2' : ''}>
                <Watchlist
                  selectedSymbol={selectedStock ?? undefined}
                  onSelectSymbol={setSelectedStock}
                />
              </div>
              {selectedStock && (
                <div className="lg:col-span-3">
                  <StockDetail symbol={selectedStock} onClose={() => setSelectedStock(null)} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">My Portfolio</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddHolding(true)}
                    className="px-4 py-2 text-sm text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg font-semibold transition-colors"
                  >
                    + Add Holding
                  </button>
                  <button
                    onClick={() => setShowAddJournal(true)}
                    className="px-4 py-2 text-sm text-white border border-white/20 hover:bg-white/10 rounded-lg font-semibold transition-colors"
                  >
                    + New Trade
                  </button>
                </div>
              </div>

              <PortfolioSummary />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <HoldingsTable />
                </div>
                <div>
                  <AllocationChart />
                </div>
              </div>

              <TradingJournal />
            </div>
          )}

          {activeTab === 'chat' && <ChatView />}

          {activeTab === 'economy' && <EconomyView />}

          {activeTab === 'finance' && <FinanceView />}
        </main>

        {showAddHolding && (
          <AddHoldingDialog onClose={() => setShowAddHolding(false)} />
        )}

        {showAddJournal && (
          <AddJournalEntryDialog onClose={() => setShowAddJournal(false)} />
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;
