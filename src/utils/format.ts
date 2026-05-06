export function formatPrice(price: number | undefined | null): string {
  if (price == null || isNaN(price)) return '—';
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatRate(price: number | undefined | null): string {
  if (price == null || isNaN(price)) return '—';
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export function formatChange(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

export function formatPercent(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatVolume(volume: number | undefined | null): string {
  if (volume == null || isNaN(volume)) return '—';
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return volume.toString();
}

export function formatPe(pe: number | undefined): string {
  if (pe == null || pe <= 0) return '—';
  return pe.toFixed(1);
}

export function formatDistFromHigh(dist: number | undefined): string {
  if (dist == null) return '—';
  const sign = dist >= 0 ? '+' : '';
  return `${sign}${dist.toFixed(1)}%`;
}

export function formatMarketCap(cap: number): string {
  if (cap >= 1_000_000_000_000) return `$${(cap / 1_000_000_000_000).toFixed(2)}T`;
  if (cap >= 1_000_000_000) return `$${(cap / 1_000_000_000).toFixed(1)}B`;
  if (cap >= 1_000_000) return `$${(cap / 1_000_000).toFixed(1)}M`;
  return `$${cap.toFixed(0)}`;
}
