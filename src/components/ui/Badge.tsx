import { getChangeColor, getChangeBg } from '../../utils/color';
import { formatChange, formatPercent } from '../../utils/format';

interface BadgeProps {
  value: number;
  showPercent?: boolean;
}

export function Badge({ value, showPercent = true }: BadgeProps) {
  const color = getChangeColor(value);
  const bg = getChangeBg(value);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono ${color} ${bg}`}>
      <span>{value >= 0 ? '▲' : '▼'}</span>
      <span>{formatChange(value)}</span>
      {showPercent && <span>{formatPercent(value)}</span>}
    </span>
  );
}
