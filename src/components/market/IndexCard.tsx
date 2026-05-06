import { useEffect, useRef } from 'react';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';
import { formatPrice, formatChange, formatPercent } from '../../utils/format';
import { getChangeColor } from '../../utils/color';
import type { IndexData } from '../../types';

interface IndexCardProps {
  data: IndexData;
}

export function IndexCard({ data }: IndexCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ReturnType<typeof createChart> | null>(null);
  const color = getChangeColor(data.change);

  useEffect(() => {
    if (!chartRef.current) return;

    try {
      const chart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 60,
        layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#6b7280' },
        grid: { vertLines: { visible: false }, horzLines: { visible: false } },
        rightPriceScale: { visible: false },
        timeScale: { visible: false },
        crosshair: { mode: 0 },
        logo: { visible: false },
      });

      const series = chart.addSeries(AreaSeries, {
        topColor: data.change >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
        bottomColor: data.change >= 0 ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)',
        lineColor: data.change >= 0 ? '#10b981' : '#ef4444',
        lineWidth: 1.5,
      });

      const lineData = data.sparkline
        .filter((p) => p.close > 0)
        .map((p) => ({
          time: p.time,
          value: p.close,
        }));

      if (lineData.length > 0) {
        series.setData(lineData);
        chart.timeScale().fitContent();
      }

      chartInstance.current = chart;

      return () => {
        chart.remove();
        chartInstance.current = null;
      };
    } catch {
      // Chart creation failed
    }
  }, [data]);

  return (
    <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-xs text-gray-500 font-mono">{data.symbol}</div>
          <div className="text-sm text-gray-300">{data.name}</div>
        </div>
        <span className={`text-xs font-mono ${color}`}>{formatPercent(data.changePercent)}</span>
      </div>

      <div className="mb-2">
        <span className="text-xl font-bold text-white font-mono tabular-nums">
          {formatPrice(data.price)}
        </span>
        <span className={`ml-2 text-xs font-mono ${color}`}>
          {formatChange(data.change)}
        </span>
      </div>

      <div ref={chartRef} className="w-full" />
    </div>
  );
}
