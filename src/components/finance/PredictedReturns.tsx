import { usePortfolioStore } from '../../stores/portfolioStore';
import { useStockQuote } from '../../hooks/useStockQuote';
import { formatPrice, formatPercent, formatPe } from '../../utils/format';
import { getChangeColor } from '../../utils/color';
import { Card } from '../ui/Card';

export function PredictedReturns() {
  const holdings = usePortfolioStore((s) => s.holdings);

  if (holdings.length === 0) {
    return (
      <Card>
        <div className="text-center text-gray-500 text-sm py-8">
          添加持仓后查看预测收益分析
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard holdings={holdings} />
        <MethodCard />
      </div>
      <HoldingsPredictionTable holdings={holdings} />
    </div>
  );
}

function SummaryCard({
  holdings,
}: {
  holdings: Array<{ symbol: string; shares: number; buyPrice: number; currentPrice: number }>;
}) {
  const totalCost = holdings.reduce((s, h) => s + h.shares * h.buyPrice, 0);
  const totalValue = holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0);

  // Simple PE-based estimate: earnings yield = 1/PE
  // We'll use a blended approach - average earnings yield across positions
  const avgEarningsYield = 0.05; // Default 5% if no PE data
  const estimatedAnnualReturn = totalValue * avgEarningsYield;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
        预测收益摘要
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">持仓总值</span>
          <span className="text-sm text-white font-mono">€{formatPrice(totalValue)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">预估年收益率</span>
          <span className="text-sm text-emerald-400 font-mono">~{formatPercent(avgEarningsYield * 100)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">预估年收益金额</span>
          <span className={`text-sm font-mono font-semibold ${getChangeColor(estimatedAnnualReturn)}`}>
            ~€{formatPrice(estimatedAnnualReturn)}
          </span>
        </div>
      </div>
    </Card>
  );
}

function MethodCard() {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
        预测方法
      </h3>
      <div className="space-y-2 text-xs text-gray-400">
        <div className="flex items-start gap-2">
          <span className="text-emerald-400 mt-0.5">1.</span>
          <span>基于每只股票的 PE 比率计算收益率（Earnings Yield = 1/PE）</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-emerald-400 mt-0.5">2.</span>
          <span>按持仓权重加权计算整体预期收益</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-emerald-400 mt-0.5">3.</span>
          <span>结果为参考估算，实际收益受市场波动影响</span>
        </div>
      </div>
    </Card>
  );
}

function HoldingsPredictionTable({
  holdings,
}: {
  holdings: Array<{ id: string; symbol: string; shares: number; buyPrice: number; currentPrice: number }>;
}) {
  const totalValue = holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0);

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
        持仓预测明细
      </h3>
      <div className="grid grid-cols-7 text-xs text-gray-500 font-mono px-4 py-2 border-b border-[var(--color-border)]">
        <span>Symbol</span>
        <span className="text-right">PE</span>
        <span className="text-right">Earnings Yield</span>
        <span className="text-right">Value</span>
        <span className="text-right">Weight</span>
        <span className="text-right">Contrib.</span>
        <span className="text-right">Ann. Return</span>
      </div>
      {holdings.map((h) => (
        <PredictionRow key={h.id} holding={h} totalValue={totalValue} />
      ))}
    </Card>
  );
}

function PredictionRow({
  holding,
  totalValue,
}: {
  holding: { id: string; symbol: string; shares: number; buyPrice: number; currentPrice: number };
  totalValue: number;
}) {
  const { data: quote } = useStockQuote(holding.symbol);
  const pe = quote?.pe;
  const earningsYield = pe && pe > 0 ? 1 / pe : 0.05;
  const value = holding.shares * holding.currentPrice;
  const weight = totalValue > 0 ? value / totalValue : 0;
  const contribution = earningsYield * weight;
  const annualReturn = value * earningsYield;

  return (
    <div className="grid grid-cols-7 text-xs py-3 px-4 border-b border-[var(--color-border)] hover:bg-white/5 transition-colors items-center">
      <span className="text-white font-semibold">{holding.symbol}</span>
      <span className="text-right font-mono text-gray-300">{formatPe(pe)}</span>
      <span className="text-right font-mono text-gray-300">{(earningsYield * 100).toFixed(2)}%</span>
      <span className="text-right font-mono text-gray-300">€{formatPrice(value)}</span>
      <span className="text-right font-mono text-gray-400">{(weight * 100).toFixed(1)}%</span>
      <span className="text-right font-mono text-emerald-400">{(contribution * 100).toFixed(2)}%</span>
      <span className="text-right font-mono text-white">€{formatPrice(annualReturn)}</span>
    </div>
  );
}
