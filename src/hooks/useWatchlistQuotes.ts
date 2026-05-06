import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchQuote, fetchQuoteDetail } from '../services/api';
import { useWatchlistStore } from '../stores/watchlistStore';
import type { StockQuote } from '../types';

export function useWatchlistQuotes() {
  const symbols = useWatchlistStore((s) => s.symbols);
  const sortField = useWatchlistStore((s) => s.sortField);
  const sortDirection = useWatchlistStore((s) => s.sortDirection);

  const quoteResults = useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: ['quote', symbol],
      queryFn: () => fetchQuote(symbol),
      refetchInterval: 30000,
      staleTime: 15000,
      enabled: !!symbol,
    })),
  });

  const detailResults = useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: ['quoteDetail', symbol],
      queryFn: () => fetchQuoteDetail(symbol),
      refetchInterval: 300000,
      staleTime: 300000,
      enabled: !!symbol,
    })),
  });

  const quotesMap = useMemo(() => {
    const map = new Map<string, StockQuote>();
    quoteResults.forEach((result, i) => {
      if (result.data) {
        const quote = { ...result.data };
        const detail = detailResults[i]?.data;
        if (detail?.pe != null) quote.pe = detail.pe;
        if (quote.week52High && quote.week52High > 0) {
          quote.distFromHigh =
            ((quote.price - quote.week52High) / quote.week52High) * 100;
        }
        map.set(symbols[i], quote);
      }
    });
    return map;
  }, [quoteResults, detailResults, symbols]);

  const sortedSymbols = useMemo(() => {
    if (sortField === 'symbol') {
      const sorted = [...symbols].sort((a, b) => a.localeCompare(b));
      return sortDirection === 'desc' ? sorted.reverse() : sorted;
    }

    return [...symbols].sort((a, b) => {
      const aQuote = quotesMap.get(a);
      const bQuote = quotesMap.get(b);
      if (!aQuote && !bQuote) return 0;
      if (!aQuote) return 1;
      if (!bQuote) return -1;

      const aVal = aQuote[sortField];
      const bVal = bQuote[sortField];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const diff = aVal - bVal;
      return sortDirection === 'asc' ? diff : -diff;
    });
  }, [symbols, sortField, sortDirection, quotesMap]);

  const isLoading = quoteResults.some((r) => r.isLoading);

  return { sortedSymbols, quotesMap, isLoading };
}
