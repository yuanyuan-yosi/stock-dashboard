import { useState } from 'react';
import { usePortfolioStore } from '../../stores/portfolioStore';

interface AddHoldingDialogProps {
  onClose: () => void;
}

export function AddHoldingDialog({ onClose }: AddHoldingDialogProps) {
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const addHolding = usePortfolioStore((s) => s.addHolding);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!symbol || !shares || !buyPrice) return;
    addHolding({
      symbol: symbol.toUpperCase(),
      shares: parseFloat(shares),
      buyPrice: parseFloat(buyPrice),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Add Holding</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="AAPL"
              className="w-full bg-[var(--color-primary)] border border-[var(--color-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-gray-500"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Shares</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="10"
              min="0"
              step="any"
              className="w-full bg-[var(--color-primary)] border border-[var(--color-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Buy Price ($)</label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="150.00"
              min="0"
              step="0.01"
              className="w-full bg-[var(--color-primary)] border border-[var(--color-border)] rounded px-3 py-2 text-sm text-white outline-none focus:border-gray-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-400 hover:text-white border border-[var(--color-border)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg font-semibold transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
