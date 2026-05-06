import { useQuery } from '@tanstack/react-query';
import { fetchMarketIndices, fetchMacroIndicators, fetchMovers, fetchSentiment } from '../services/api';

export function useMarketIndices() {
  return useQuery({
    queryKey: ['market', 'indices'],
    queryFn: fetchMarketIndices,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function useMovers() {
  return useQuery({
    queryKey: ['market', 'movers'],
    queryFn: fetchMovers,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useMacroIndicators() {
  return useQuery({
    queryKey: ['market', 'macro'],
    queryFn: fetchMacroIndicators,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function useSentiment() {
  return useQuery({
    queryKey: ['market', 'sentiment'],
    queryFn: fetchSentiment,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
