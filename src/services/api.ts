import type {
  StockQuote,
  ChartPoint,
  IndexData,
  MoverStock,
  SearchResult,
  TimeRange,
  SentimentData,
} from '../types';

export async function fetchQuoteDetail(
  symbol: string
): Promise<{ pe?: number }> {
  const res = await fetch(
    `/api/quoteDetail/${encodeURIComponent(symbol)}`
  );
  if (!res.ok) throw new Error('Failed to fetch quote detail');
  const data = await res.json();
  const summary =
    data.quoteSummary?.result?.[0]?.summaryDetail;
  const pe = summary?.trailingPE?.raw ?? undefined;
  return { pe };
}

export async function fetchQuote(symbol: string): Promise<StockQuote> {
  const res = await fetch(`/api/quote/${encodeURIComponent(symbol)}?range=1d&interval=5m`);
  if (!res.ok) throw new Error('Failed to fetch quote');
  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error('No data for symbol');

  const meta = result.meta;
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];

  // Find the latest non-null close from chart data (includes pre/post market)
  let latestPrice = meta.regularMarketPrice;
  for (let i = closes.length - 1; i >= 0; i--) {
    if (closes[i] != null) {
      latestPrice = closes[i];
      break;
    }
  }
  // Use post/pre market price from meta if available (more authoritative)
  const price = meta.postMarketPrice ?? meta.preMarketPrice ?? latestPrice;

  // During extended hours, change should be from last regular session close,
  // not from chartPreviousClose (which could be 2 days ago on weekends)
  const isExtendedHours = Math.abs(price - meta.regularMarketPrice) > 0.01;
  const changeBaseline = isExtendedHours
    ? meta.regularMarketPrice
    : meta.chartPreviousClose;

  // For day high/low, also scan chart data for extended hours range
  let dayHigh = meta.regularMarketDayHigh || 0;
  let dayLow = meta.regularMarketDayLow || Infinity;
  for (const c of closes) {
    if (c != null) {
      if (c > dayHigh) dayHigh = c;
      if (c < dayLow) dayLow = c;
    }
  }
  if (dayLow === Infinity) dayLow = meta.regularMarketDayLow || 0;

  return {
    symbol: meta.symbol,
    name: meta.shortName || meta.symbol,
    price,
    change: price - changeBaseline,
    changePercent:
      ((price - changeBaseline) / changeBaseline) * 100,
    previousClose: meta.chartPreviousClose,
    open: meta.regularMarketOpen || 0,
    dayHigh,
    dayLow,
    volume: meta.regularMarketVolume || 0,
    marketCap: meta.marketCap,
    pe: undefined,
    week52High: meta.fiftyTwoWeekHigh,
    week52Low: meta.fiftyTwoWeekLow,
  };
}

export async function fetchChartData(
  symbol: string,
  range: TimeRange
): Promise<{ candles: ChartPoint[]; currentPrice: number }> {
  const intervalMap: Record<TimeRange, string> = {
    '1d': '5m',
    '5d': '15m',
    '1mo': '1h',
    '3mo': '1d',
    '6mo': '1d',
    '1y': '1d',
    '5y': '1wk',
  };

  const res = await fetch(
    `/api/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${intervalMap[range]}`
  );
  if (!res.ok) throw new Error('Failed to fetch chart data');
  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error('No chart data');

  const timestamps = result.timestamp || [];
  const ohlc = result.indicators?.quote?.[0] || {};

  const isIntraday = range === '1d' || range === '5d' || range === '1mo';
  const candles: ChartPoint[] = timestamps
    .map((t: number, i: number) => ({
      time: isIntraday ? (t as unknown as string) : new Date(t * 1000).toISOString().split('T')[0],
      open: ohlc.open[i],
      high: ohlc.high[i],
      low: ohlc.low[i],
      close: ohlc.close[i],
    }))
    .filter(
      (c: ChartPoint) => c.open != null && c.high != null && c.low != null && c.close != null
    );

  return { candles, currentPrice: result.meta.regularMarketPrice };
}

export async function fetchMarketIndices(): Promise<IndexData[]> {
  const symbols = ['^GSPC', '^IXIC', '^DJI', '^RUT'];
  const names: Record<string, string> = {
    '^GSPC': 'S&P 500',
    '^IXIC': 'NASDAQ',
    '^DJI': 'DOW JONES',
    '^RUT': 'RUSSELL 2000',
  };

  const res = await fetch('/api/market');
  if (!res.ok) throw new Error('Failed to fetch market data');
  const results = await res.json();

  return results.map((data: Record<string, unknown>) => {
    const result = (data as { chart?: { result?: Array<{ meta: Record<string, number>; timestamp?: number[]; indicators?: { quote?: Array<{ close?: number[] }> } }> } }).chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const sparkline: ChartPoint[] = timestamps
      .slice(-30)
      .map((t: number, i: number) => ({
        time: t as unknown as string,
        open: closes[i] || 0,
        high: closes[i] || 0,
        low: closes[i] || 0,
        close: closes[i] || 0,
      }))
      .filter((p: ChartPoint) => p.close > 0);

    return {
      symbol: meta.symbol,
      name: names[meta.symbol] || meta.shortName || meta.symbol,
      price: meta.regularMarketPrice,
      change: meta.regularMarketPrice - meta.chartPreviousClose,
      changePercent:
        ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
      sparkline,
    };
  }).filter(Boolean) as IndexData[];
}

export async function fetchMovers(): Promise<{ gainers: MoverStock[]; losers: MoverStock[] }> {
  const res = await fetch('/api/movers');
  if (!res.ok) throw new Error('Failed to fetch movers');
  const data = await res.json();
  return { gainers: data.gainers || [], losers: data.losers || [] };
}

export async function fetchMacroIndicators(): Promise<IndexData[]> {
  const names: Record<string, string> = {
    'GC=F': 'Gold',
    'CL=F': 'WTI Crude',
    '2YY=F': 'US 2Y Yield',
    '^TNX': 'US 10Y Yield',
    'BTC-USD': 'Bitcoin',
    'EURUSD=X': 'EUR/USD',
    'EURCNY=X': 'EUR/CNY',
  };

  const res = await fetch('/api/macro');
  if (!res.ok) throw new Error('Failed to fetch macro data');
  const results = await res.json();

  return results
    .map((data: Record<string, unknown>) => {
      const result = (data as { chart?: { result?: Array<{ meta: Record<string, number>; timestamp?: number[]; indicators?: { quote?: Array<{ close?: number[] }> } }> } }).chart?.result?.[0];
      if (!result) return null;

      const meta = result.meta;
      const timestamps = result.timestamp || [];
      const closes = result.indicators?.quote?.[0]?.close || [];
      const sparkline: ChartPoint[] = timestamps
        .slice(-30)
        .map((t: number, i: number) => ({
          time: t as unknown as string,
          open: closes[i] || 0,
          high: closes[i] || 0,
          low: closes[i] || 0,
          close: closes[i] || 0,
        }))
        .filter((p: ChartPoint) => p.close > 0);

      return {
        symbol: meta.symbol,
        name: names[meta.symbol] || meta.shortName || meta.symbol,
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.chartPreviousClose,
        changePercent:
          ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
        sparkline,
      };
    })
    .filter(Boolean) as IndexData[];
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  const res = await fetch(`/api/search/${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();

  const docs = data.finance?.result?.[0]?.documents || [];
  return docs.slice(0, 8).map((q: { symbol: string; shortName?: string; exchange?: string; quoteType?: string }) => ({
    symbol: q.symbol,
    name: q.shortName || q.symbol,
    exchange: q.exchange || '',
    type: q.quoteType || '',
  }));
}

export interface EconDataPoint {
  date: string;
  value: number;
}

async function fetchEconData(endpoint: string): Promise<EconDataPoint[]> {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Economic data fetch failed: ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

export function fetchFedRate(): Promise<EconDataPoint[]> {
  return fetchEconData('/api/economy/fed-rate');
}

export function fetchNfp(): Promise<EconDataPoint[]> {
  return fetchEconData('/api/economy/nfp');
}

export function fetchCpi(): Promise<EconDataPoint[]> {
  return fetchEconData('/api/economy/cpi');
}

export function fetchGdp(): Promise<EconDataPoint[]> {
  return fetchEconData('/api/economy/gdp');
}

export async function fetchSentiment(): Promise<SentimentData> {
  const res = await fetch('/api/sentiment');
  if (!res.ok) throw new Error('Failed to fetch sentiment data');
  return res.json();
}
