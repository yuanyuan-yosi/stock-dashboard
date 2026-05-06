import { useQuery } from '@tanstack/react-query';
import { searchSymbols } from '../services/api';

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchSymbols(query),
    staleTime: 60000,
    enabled: query.length >= 1,
  });
}
