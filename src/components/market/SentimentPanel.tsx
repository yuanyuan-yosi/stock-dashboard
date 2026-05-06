import { useSentiment } from '../../hooks/useMarketData';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { formatPrice, formatChange, formatPercent, formatVolume } from '../../utils/format';
import { getChangeColor } from '../../utils/color';

function FearGreedGauge({ value, rating }: { value: number; rating: string }) {
  const angle = (value / 100) * 180;
  const clampedAngle = Math.max(0, Math.min(180, angle));

  const getColor = (v: number) => {
    if (v <= 25) return '#ef4444';
    if (v <= 45) return '#f97316';
    if (v <= 55) return '#eab308';
    if (v <= 75) return '#22c55e';
    return '#10b981';
  };

  const getRatingLabel = (v: number) => {
    if (v <= 20) return 'Extreme Fear';
    if (v <= 40) return 'Fear';
    if (v <= 60) return 'Neutral';
    if (v <= 80) return 'Greed';
    return 'Extreme Greed';
  };

  const color = getColor(value);
  const label = rating || getRatingLabel(value);

  // SVG semicircle gauge
  const size = 120;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const r = 48;
  const strokeWidth = 10;

  // Background arc
  const bgArc = describeArc(cx, cy, r, 0, 180);
  // Filled arc up to the value
  const filledArc = describeArc(cx, cy, r, 0, clampedAngle);

  // Needle endpoint
  const needleAngle = ((180 - clampedAngle) * Math.PI) / 180;
  const needleX = cx + (r - 4) * Math.cos(needleAngle);
  const needleY = cy - (r - 4) * Math.sin(needleAngle);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        {/* Background arc */}
        <path d={bgArc} fill="none" stroke="#1f2937" strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Filled arc */}
        <path d={filledArc} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill="white" />
        {/* Value */}
        <text x={cx} y={cy + 20} textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="var(--font-mono)">
          {value}
        </text>
      </svg>
      <span className="text-xs font-semibold mt-1" style={{ color }}>{label}</span>
    </div>
  );
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function VixCard({ price, change, changePercent }: { price: number; change: number; changePercent: number }) {
  const getRegime = (v: number) => {
    if (v < 15) return { label: 'Low Volatility', color: 'text-emerald-400' };
    if (v < 20) return { label: 'Normal', color: 'text-gray-400' };
    if (v < 30) return { label: 'Elevated', color: 'text-yellow-400' };
    return { label: 'High Fear', color: 'text-red-400' };
  };

  const regime = getRegime(price);
  const color = getChangeColor(changePercent);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">VIX</span>
      <span className="text-2xl font-bold font-mono text-white">{formatPrice(price)}</span>
      <span className={`text-sm font-mono ${color}`}>
        {formatChange(change)} ({formatPercent(changePercent)})
      </span>
      <span className={`text-xs font-semibold ${regime.color}`}>{regime.label}</span>
    </div>
  );
}

function BreadthCard({ gainers, losers }: { gainers: number; losers: number }) {
  const total = gainers + losers;
  const advancePct = total > 0 ? (gainers / total) * 100 : 50;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Movers A/D</span>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-lg font-bold font-mono text-emerald-400">{gainers}</span>
          <span className="text-xs text-gray-500 block">Up</span>
        </div>
        <div className="w-24 h-2 rounded-full bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500"
            style={{ width: `${advancePct}%` }}
          />
        </div>
        <div className="text-left">
          <span className="text-lg font-bold font-mono text-red-400">{losers}</span>
          <span className="text-xs text-gray-500 block">Down</span>
        </div>
      </div>
    </div>
  );
}

function VolumeCard({ total, avg }: { total: number; avg: number }) {
  const ratio = avg > 0 ? total / avg : 1;
  const getVolumeLabel = (r: number) => {
    if (r > 1.5) return { label: 'Heavy', color: 'text-emerald-400' };
    if (r > 1.1) return { label: 'Above Avg', color: 'text-emerald-300' };
    if (r > 0.9) return { label: 'Normal', color: 'text-gray-400' };
    if (r > 0.5) return { label: 'Below Avg', color: 'text-yellow-400' };
    return { label: 'Light', color: 'text-red-400' };
  };

  const vol = getVolumeLabel(ratio);
  const ratioPct = Math.min(ratio, 2) / 2 * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Volume</span>
      <span className="text-2xl font-bold font-mono text-white">{formatVolume(total)}</span>
      <div className="w-24 h-2 rounded-full bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${ratioPct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold ${vol.color}`}>{vol.label} ({ratio.toFixed(1)}x)</span>
    </div>
  );
}

export function SentimentPanel() {
  const { data: sentiment, isLoading: sentimentLoading, error: sentimentError } = useSentiment();

  if (sentimentLoading) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Market Sentiment
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><Skeleton lines={3} /></Card>
          <Card><Skeleton lines={3} /></Card>
          <Card><Skeleton lines={3} /></Card>
          <Card><Skeleton lines={3} /></Card>
        </div>
      </div>
    );
  }

  if (sentimentError) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Market Sentiment
        </h2>
        <Card>
          <div className="text-red-400 text-sm text-center py-4">
            Failed to load sentiment data
          </div>
        </Card>
      </div>
    );
  }

  const gainers = sentiment?.breadth?.gainers || 0;
  const losers = sentiment?.breadth?.losers || 0;

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Market Sentiment
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex justify-center">
          <FearGreedGauge
            value={sentiment?.fearGreed?.value ?? 50}
            rating={sentiment?.fearGreed?.rating ?? ''}
          />
        </Card>

        <Card className="flex items-center justify-center">
          {sentiment?.vix?.price ? (
            <VixCard
              price={sentiment.vix.price}
              change={sentiment.vix.change}
              changePercent={sentiment.vix.changePercent}
            />
          ) : (
            <span className="text-gray-500 text-sm">VIX unavailable</span>
          )}
        </Card>

        <Card className="flex items-center justify-center">
          <BreadthCard gainers={gainers} losers={losers} />
        </Card>

        <Card className="flex items-center justify-center">
          <VolumeCard
            total={sentiment?.volume?.total || 0}
            avg={sentiment?.volume?.avg || 0}
          />
        </Card>
      </div>
    </div>
  );
}
