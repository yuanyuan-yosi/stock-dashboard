export function getChangeColor(value: number): string {
  return value >= 0 ? 'text-emerald-400' : 'text-red-400';
}

export function getChangeBg(value: number): string {
  return value >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10';
}

export function getChangeHex(value: number): string {
  return value >= 0 ? '#10b981' : '#ef4444';
}
