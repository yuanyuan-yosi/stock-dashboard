import { useQuery } from '@tanstack/react-query';
import { fetchQuote } from '../services/api';

export function useStockQuote(symbol: string) {
  return useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => fetchQuote(symbol),
    refetchInterval: 30000,
    staleTime: 15000,
    enabled: !!symbol,
  });
}
