import type { TimeRange } from '../../types';

interface TimeRangeButtonsProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const ranges: { value: TimeRange; label: string }[] = [
  { value: '1d', label: '1D' },
  { value: '5d', label: '5D' },
  { value: '1mo', label: '1M' },
  { value: '3mo', label: '3M' },
  { value: '6mo', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: '5y', label: '5Y' },
];

export function TimeRangeButtons({ value, onChange }: TimeRangeButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
            value === range.value
              ? 'bg-white/15 text-white'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
