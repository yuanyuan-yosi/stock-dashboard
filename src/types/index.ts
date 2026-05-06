export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  week52High?: number;
  week52Low?: number;
  distFromHigh?: number; // percentage distance from 52-week high, e.g. -5.3
}

export interface ChartPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: ChartPoint[];
}

export interface MoverStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface PortfolioHolding {
  id: string;
  symbol: string;
  shares: number;
  buyPrice: number;
  currentPrice: number;
  platform?: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export type TimeRange = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y';

export interface JournalEntry {
  id: string;
  date: string;
  symbol: string;
  action: 'buy' | 'sell';
  shares: number;
  price: number;
  total: number;
  notes: string;
  tags: string[];
  createdAt: number;
}

export interface SentimentData {
  fearGreed: { value: number; rating: string; label: string };
  vix: { price: number; change: number; changePercent: number };
  breadth: { gainers: number; losers: number };
  volume: { total: number; avg: number; count: number };
}

export type FinanceCategory =
  | 'salary' | 'side-income' | 'dividends' | 'interest'
  | 'housing' | 'food' | 'transport' | 'utilities'
  | 'entertainment' | 'healthcare' | 'education' | 'shopping'
  | 'investments' | 'other';

export interface FinanceEntry {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: FinanceCategory;
  amount: number;
  description: string;
  recurring: boolean;
  createdAt: number;
}

export interface GrowthSnapshot {
  date: string;
  principal: number;
  marketValue: number;
  cashBalance: number;
}

export type TabType = 'overview' | 'watchlist' | 'portfolio' | 'chat' | 'economy' | 'finance';
