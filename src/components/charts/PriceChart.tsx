import { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries } from 'lightweight-charts';
import { useChartData } from '../../hooks/useChartData';
import { Skeleton } from '../ui/Skeleton';
import type { TimeRange, ChartPoint } from '../../types';

interface PriceChartProps {
  symbol: string;
  range: TimeRange;
}

export function PriceChart({ symbol, range }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);

  const { data, isLoading, error } = useChartData(symbol, range);

  useEffect(() => {
    if (!chartContainerRef.current || !data) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    try {
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#9ca3af',
          fontFamily: "'JetBrains Mono', monospace",
        },
        grid: {
          vertLines: { color: '#1f2937' },
          horzLines: { color: '#1f2937' },
        },
        rightPriceScale: {
          borderColor: '#1f2937',
        },
        timeScale: {
          borderColor: '#1f2937',
          timeVisible: range === '1d' || range === '5d',
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: '#4b5563', style: 2 },
          horzLine: { color: '#4b5563', style: 2 },
        },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      const candleData = data.candles
        .filter((c: ChartPoint) => c.open > 0 && c.close > 0)
        .map((c: ChartPoint) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

      if (candleData.length > 0) {
        candleSeries.setData(candleData);
        chart.timeScale().fitContent();
      }

      chartRef.current = chart;
      seriesRef.current = candleSeries;

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
        chartRef.current = null;
      };
    } catch {
      // Chart creation failed — render without chart
    }
  }, [data, range]);

  if (isLoading) {
    return (
      <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-4">
        <Skeleton lines={10} className="h-[400px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-4">
        <div className="text-red-400 text-sm text-center py-16">
          Failed to load chart data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-4">
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
