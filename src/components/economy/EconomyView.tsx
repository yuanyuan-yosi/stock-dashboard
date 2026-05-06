import { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useFedRate, useNfp, useCpi, useGdp } from '../../hooks/useEconomicData';
import { EconChart } from './EconChart';
import type { EconDataPoint } from '../../services/api';

const CHART_COLORS = {
  primary: '#34d399',
  secondary: '#60a5fa',
  red: '#f87171',
  amber: '#fbbf24',
  grid: '#1e293b',
  text: '#64748b',
};

function filterByYears(data: EconDataPoint[], years: number): EconDataPoint[] {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return data.filter((d) => d.date >= cutoffStr);
}

function formatTooltipDate(date: string) {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

type RangeKey = '2Y' | '5Y' | '10Y' | 'ALL';
const RANGE_OPTIONS: RangeKey[] = ['2Y', '5Y', '10Y', 'ALL'];

function RangeSelector({ value, onChange }: { value: RangeKey; onChange: (r: RangeKey) => void }) {
  return (
    <div className="flex gap-1">
      {RANGE_OPTIONS.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-2 py-0.5 text-xs rounded transition-colors ${
            value === r ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function filterByRange(data: EconDataPoint[], range: RangeKey): EconDataPoint[] {
  if (range === 'ALL') return data;
  const years = range === '2Y' ? 2 : range === '5Y' ? 5 : 10;
  return filterByYears(data, years);
}

function LatestValue({ data, suffix = '' }: { data: EconDataPoint[]; suffix?: string }) {
  const latest = data[data.length - 1];
  if (!latest) return null;
  return (
    <span className="text-lg font-bold text-white font-mono tabular-nums">
      {latest.value.toFixed(2)}{suffix}
    </span>
  );
}

// Fed Funds Rate chart with year range selector
function FedRateChart() {
  const { data, isLoading, error } = useFedRate();
  const [range, setRange] = useState<RangeKey>('10Y');

  const filtered = useMemo(() => {
    if (!data) return [];
    return filterByRange(data, range);
  }, [data, range]);

  return (
    <EconChart
      title="Federal Funds Rate"
      subtitle="Target interest rate set by the FOMC"
      isLoading={isLoading}
      error={!!error}
      actions={<RangeSelector value={range} onChange={setRange} />}
    >
      <div className="mb-2">
        <LatestValue data={filtered} suffix="%" />
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={filtered} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="fedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: CHART_COLORS.text }}
            tickFormatter={(v: string) => v.slice(0, 4)}
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 10, fill: CHART_COLORS.text }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelFormatter={(label: any) => formatTooltipDate(String(label))}
            formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Rate']}
          />
          <Area
            type="stepAfter"
            dataKey="value"
            stroke={CHART_COLORS.primary}
            fill="url(#fedGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </EconChart>
  );
}

// Non-Farm Payrolls — monthly change (bars)
function NfpChart() {
  const { data, isLoading, error } = useNfp();
  const [range, setRange] = useState<RangeKey>('10Y');

  const chartData = useMemo(() => {
    if (!data || data.length < 2) return [];
    const filtered = filterByRange(data, range);
    const sliceCount = range === '2Y' ? 24 : range === '5Y' ? 60 : range === '10Y' ? 120 : filtered.length;
    return filtered.slice(-sliceCount).map((d, i, arr) => {
      const prev = i > 0 ? arr[i - 1].value : d.value;
      return {
        date: d.date,
        change: Math.round((d.value - prev) / 1000),
        total: Math.round(d.value / 1000),
      };
    });
  }, [data, range]);

  return (
    <EconChart
      title="Non-Farm Payrolls"
      subtitle="Monthly change in total employment (thousands)"
      isLoading={isLoading}
      error={!!error}
      actions={<RangeSelector value={range} onChange={setRange} />}
    >
      <div className="mb-2">
        {data && data.length > 0 && (
          <span className="text-lg font-bold text-white font-mono tabular-nums">
            {(data[data.length - 1].value / 1000).toFixed(0)}K
          </span>
        )}
        <span className="text-xs text-gray-500 ml-2">total employed</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: CHART_COLORS.text }}
            tickFormatter={(v: string) => v.slice(0, 4)}
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 10, fill: CHART_COLORS.text }}
            tickFormatter={(v: number) => `${v}K`}
          />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelFormatter={(label: any) => formatTooltipDate(String(label))}
            formatter={(value: any) => [`${Number(value) >= 0 ? '+' : ''}${value}K`, 'Change']}
          />
          <Bar
            dataKey="change"
            fill={CHART_COLORS.secondary}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </EconChart>
  );
}

// CPI — Year-over-Year %
function CpiChart() {
  const { data, isLoading, error } = useCpi();
  const [range, setRange] = useState<RangeKey>('10Y');

  const chartData = useMemo(() => {
    if (!data || data.length < 13) return [];
    const full = data.slice(12).map((d, i) => {
      const yearAgo = data[i].value;
      const yoy = yearAgo > 0 ? ((d.value - yearAgo) / yearAgo) * 100 : 0;
      return { date: d.date, yoy: parseFloat(yoy.toFixed(2)) };
    });
    const years = range === '2Y' ? 2 : range === '5Y' ? 5 : range === '10Y' ? 10 : 100;
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - years);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return full.filter((d) => d.date >= cutoffStr);
  }, [data, range]);

  return (
    <EconChart
      title="CPI (YoY%)"
      subtitle="Consumer Price Index year-over-year change"
      isLoading={isLoading}
      error={!!error}
      actions={<RangeSelector value={range} onChange={setRange} />}
    >
      <div className="mb-2">
        {chartData.length > 0 && (
          <span className={`text-lg font-bold font-mono tabular-nums ${
            chartData[chartData.length - 1].yoy > 3 ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {chartData[chartData.length - 1].yoy.toFixed(1)}%
          </span>
        )}
        <span className="text-xs text-gray-500 ml-2">inflation rate</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: CHART_COLORS.text }}
            tickFormatter={(v: string) => v.slice(0, 4)}
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 10, fill: CHART_COLORS.text }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelFormatter={(label: any) => formatTooltipDate(String(label))}
            formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'YoY']}
          />
          <Line
            type="monotone"
            dataKey="yoy"
            stroke={CHART_COLORS.red}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </EconChart>
  );
}

// GDP — quarterly with growth rate overlay
function GdpChart() {
  const { data, isLoading, error } = useGdp();
  const [range, setRange] = useState<RangeKey>('ALL');

  const chartData = useMemo(() => {
    if (!data) return [];
    const filtered = filterByRange(data, range);
    return filtered.map((d, i, arr) => {
      const prev = i > 0 ? arr[i - 1].value : d.value;
      const growth = prev > 0 ? ((d.value - prev) / prev) * 100 : 0;
      return {
        date: d.date,
        gdp: parseFloat((d.value / 1000).toFixed(2)),
        growth: parseFloat(growth.toFixed(2)),
      };
    });
  }, [data, range]);

  const last = chartData[chartData.length - 1];

  return (
    <EconChart
      title="GDP"
      subtitle="US Gross Domestic Product — amber: GDP, green/red: QoQ growth"
      isLoading={isLoading}
      error={!!error}
      actions={<RangeSelector value={range} onChange={setRange} />}
    >
      <div className="mb-2 flex items-center gap-3">
        {last && (
          <>
            <span className="text-lg font-bold text-white font-mono tabular-nums">
              ${last.gdp.toFixed(2)}T
            </span>
            <span className={`text-xs font-mono font-semibold ${
              last.growth >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {last.growth >= 0 ? '+' : ''}{last.growth.toFixed(1)}% QoQ
            </span>
          </>
        )}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 45, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="gdpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.amber} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_COLORS.amber} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: CHART_COLORS.text }}
            tickFormatter={(v: string) => v.slice(0, 4)}
            minTickGap={40}
          />
          <YAxis
            yAxisId="gdp"
            tick={{ fontSize: 10, fill: CHART_COLORS.text }}
            tickFormatter={(v: number) => `$${v}T`}
          />
          <YAxis
            yAxisId="growth"
            orientation="right"
            tick={{ fontSize: 10, fill: CHART_COLORS.text }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelFormatter={(label: any) => formatTooltipDate(String(label))}
            formatter={(value: any, name: any) =>
              name === 'gdp' ? [`$${value}T`, 'GDP'] : [`${Number(value) >= 0 ? '+' : ''}${value}%`, 'Growth']
            }
          />
          <Area
            yAxisId="gdp"
            type="monotone"
            dataKey="gdp"
            stroke={CHART_COLORS.amber}
            fill="url(#gdpGrad)"
            strokeWidth={2}
          />
          <Line
            yAxisId="growth"
            type="monotone"
            dataKey="growth"
            stroke={CHART_COLORS.primary}
            strokeWidth={1.5}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (cx == null || cy == null) return null;
              return (
                <circle
                  key={`dot-${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={2.5}
                  fill={payload.growth >= 0 ? CHART_COLORS.primary : CHART_COLORS.red}
                  stroke="none"
                />
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </EconChart>
  );
}

export function EconomyView() {
  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Economic Data
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FedRateChart />
        <CpiChart />
        <NfpChart />
        <GdpChart />
      </div>
    </div>
  );
}
