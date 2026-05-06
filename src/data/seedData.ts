import { usePortfolioStore } from '../stores/portfolioStore';
import { useFinanceStore } from '../stores/financeStore';
import type { FinanceCategory } from '../types';

/**
 * Seed data from 数据/20260505.xlsx
 * Runs once on first load when stores are empty.
 */

interface SeedEntry {
  date: string;
  type: 'income' | 'expense';
  category: FinanceCategory;
  amount: number;
  description: string;
  recurring: boolean;
}

const SEED_ENTRIES: SeedEntry[] = [
  // === April 2026 ===
  // SA (收入账户): salary in EUR
  { date: '2026-04-01', type: 'income', category: 'salary', amount: 5549.38, description: '月薪 (SA 收入账户)', recurring: true },

  // WE (人民币支出账户): ¥19,724 → ¥17,440 = ¥2,284 spent → ~€286 at 8.0 CNY/EUR
  { date: '2026-04-01', type: 'expense', category: 'food', amount: 100, description: '餐饮 (WE ¥800)', recurring: true },
  { date: '2026-04-01', type: 'expense', category: 'housing', amount: 80, description: '住房 (WE ¥640)', recurring: true },
  { date: '2026-04-01', type: 'expense', category: 'transport', amount: 30, description: '交通 (WE ¥240)', recurring: true },
  { date: '2026-04-01', type: 'expense', category: 'utilities', amount: 25, description: '水电 (WE ¥200)', recurring: true },
  { date: '2026-04-01', type: 'expense', category: 'entertainment', amount: 25, description: '娱乐 (WE ¥200)', recurring: true },
  { date: '2026-04-01', type: 'expense', category: 'shopping', amount: 26, description: '购物 (WE ¥204)', recurring: true },

  // IB 投资转入 (SA → IB)
  { date: '2026-04-16', type: 'expense', category: 'investments', amount: 2597, description: 'SA→IB 转入投资', recurring: false },

  // === May 2026 (current month) ===
  { date: '2026-05-01', type: 'income', category: 'salary', amount: 5549.38, description: '月薪 (SA 收入账户)', recurring: true },
  { date: '2026-05-01', type: 'expense', category: 'food', amount: 100, description: '餐饮 (WE)', recurring: true },
  { date: '2026-05-01', type: 'expense', category: 'housing', amount: 80, description: '住房 (WE)', recurring: true },
  { date: '2026-05-01', type: 'expense', category: 'transport', amount: 30, description: '交通 (WE)', recurring: true },
  { date: '2026-05-01', type: 'expense', category: 'utilities', amount: 25, description: '水电 (WE)', recurring: true },
  { date: '2026-05-01', type: 'expense', category: 'entertainment', amount: 25, description: '娱乐 (WE)', recurring: true },
  { date: '2026-05-01', type: 'expense', category: 'shopping', amount: 26, description: '购物 (WE)', recurring: true },
];

const SEED_HOLDINGS = [
  // === 美股个股 ===
  { symbol: 'NVDA', shares: 3, buyPrice: 170.00, platform: 'IBKR' },
  { symbol: 'TSM', shares: 3, buyPrice: 349.62, platform: 'IBKR+TR' },
  { symbol: 'MSFT', shares: 5, buyPrice: 403.85, platform: 'IBKR' },
  { symbol: 'GOOG', shares: 3, buyPrice: 289.80, platform: 'IBKR' },
  { symbol: 'ORCL', shares: 10, buyPrice: 159.25, platform: 'IBKR+TR' },
  // === ETF ===
  { symbol: 'SPYL.DE', shares: 169.24, buyPrice: 14.73, platform: 'IBKR' },
  { symbol: 'SXR8.DE', shares: 3, buyPrice: 40.19, platform: 'DEGIRO' },
  // === 欧洲个股 (buyPrice 已含汇率费，统一 USD) ===
  { symbol: 'IBE.MC', shares: 20, buyPrice: 19.77, platform: 'TR' },
  { symbol: 'CABK.MC', shares: 20, buyPrice: 11.73, platform: 'TR' },
  { symbol: 'GAS.MC', shares: 5, buyPrice: 27.83, platform: 'TR' },
  { symbol: 'SAB.MC', shares: 15, buyPrice: 3.52, platform: 'TR' },
  { symbol: 'SAN.MC', shares: 10, buyPrice: 11.62, platform: 'DEGIRO' },
];

const SEED_SNAPSHOTS = [
  { date: '2026-04-07', principal: 16089.29, marketValue: 11901.34, cashBalance: 47915.23 },
  { date: '2026-04-15', principal: 16089.52, marketValue: 12199, cashBalance: 4670.34 },
  { date: '2026-04-16', principal: 16089, marketValue: 12346.2, cashBalance: 4380.34 },
  { date: '2026-04-24', principal: 16089, marketValue: 12762, cashBalance: 4345.01 },
  { date: '2026-05-05', principal: 18790.14, marketValue: 15140.55, cashBalance: 5263 },
];

const SEED_KEY = 'stock-finance-seeded';
const PORTFOLIO_SEED_KEY = 'stock-portfolio-seeded-v6';

export function seedData() {
  const financeSeeded = localStorage.getItem(SEED_KEY);
  if (!financeSeeded) {
    const store = useFinanceStore.getState();
    if (store.entries.length === 0) {
      for (const entry of SEED_ENTRIES) {
        store.addEntry(entry);
      }
    }
    if (store.snapshots.length === 0) {
      for (const snap of SEED_SNAPSHOTS) {
        store.addSnapshot(snap);
      }
    }
    localStorage.setItem(SEED_KEY, 'true');
  }

  const portfolioSeeded = localStorage.getItem(PORTFOLIO_SEED_KEY);
  if (!portfolioSeeded) {
    const store = usePortfolioStore.getState();
    store.replaceHoldings(SEED_HOLDINGS);
    localStorage.setItem(PORTFOLIO_SEED_KEY, 'true');
  }
}
