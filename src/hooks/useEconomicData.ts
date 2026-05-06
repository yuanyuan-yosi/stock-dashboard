import { useState, useEffect } from 'react';
import { fetchFedRate, fetchNfp, fetchCpi, fetchGdp } from '../services/api';
import type { EconDataPoint } from '../services/api';

function useEconFetch(fetcher: () => Promise<EconDataPoint[]>) {
  const [data, setData] = useState<EconDataPoint[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetcher()
      .then((d) => {
        if (!cancelled) { setData(d); setError(null); }
      })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}

export function useFedRate() {
  return useEconFetch(fetchFedRate);
}

export function useNfp() {
  return useEconFetch(fetchNfp);
}

export function useCpi() {
  return useEconFetch(fetchCpi);
}

export function useGdp() {
  return useEconFetch(fetchGdp);
}
