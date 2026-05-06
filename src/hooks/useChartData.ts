import { useQuery } from '@tanstack/react-query';
import { fetchChartData } from '../services/api';
import type { TimeRange } from '../types';

export function useChartData(symbol: string, range: TimeRange) {
  return useQuery({
    queryKey: ['chart', symbol, range],
    queryFn: () => fetchChartData(symbol, range),
    refetchInterval: 60000,
    staleTime: 30000,
    enabled: !!symbol,
  });
}
