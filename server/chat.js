import express from 'express';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const YAHOO_BASE = 'https://query1.finance.yahoo.com';

// Session store: chatId → { sessionId, createdAt }
// In production, use Redis or a database
const chatSessions = new Map();

// Escape for Windows cmd shell
function escapeArg(s) {
  if (process.platform !== 'win32') return `'${s.replace(/'/g, "'\\''")}'`;
  // Windows: wrap in double quotes, escape internal double quotes
  return `"${s.replace(/"/g, '""')}"`;
}

async function askClaude(message, chatId) {
  const existing = chatId ? chatSessions.get(chatId) : null;
  const flags = ['-p', '--output-format', 'json', '--max-turns', '10'];
  if (existing?.sessionId) {
    flags.push('--resume', existing.sessionId);
  }

  try {
    // Pass message via env var to avoid Windows encoding issues
    const { stdout } = await execFileAsync('node', [
      join(__dirname, 'claude-wrapper.cjs'),
      ...flags,
    ], {
      timeout: 60000,
      maxBuffer: 1024 * 1024,
      cwd: process.env.USERPROFILE || process.env.HOME || '.',
      env: { ...process.env, CLAUDE_MSG: message },
    });
    const data = JSON.parse(stdout);
    if (chatId && data.session_id) {
      chatSessions.set(chatId, {
        sessionId: data.session_id,
        createdAt: Date.now(),
      });
    }
    return data.result || null;
  } catch (err) {
    console.error('[Chat] Claude CLI error:', err.message);
    return null;
  }
}

// Cleanup old sessions every hour (>24h old)
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, val] of chatSessions) {
    if (val.createdAt < cutoff) chatSessions.delete(key);
  }
}, 60 * 60 * 1000);

async function fetchYahoo(path) {
  const res = await fetch(`${YAHOO_BASE}${path}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!res.ok) throw new Error(`Yahoo API error: ${res.status}`);
  return res.json();
}

async function getQuote(symbol) {
  const data = await fetchYahoo(
    `/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d&includePrePost=false`
  );
  const r = data.chart?.result?.[0];
  if (!r) return null;
  const m = r.meta;
  const prevClose = m.chartPreviousClose || m.previousClose || m.regularMarketPrice;
  const change = m.regularMarketPrice - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;
  return {
    symbol: m.symbol,
    name: m.shortName || m.symbol,
    price: m.regularMarketPrice,
    change,
    changePct,
    volume: m.regularMarketVolume || 0,
    dayHigh: m.regularMarketDayHigh || 0,
    dayLow: m.regularMarketDayLow || 0,
    week52High: m.fiftyTwoWeekHigh || 0,
    week52Low: m.fiftyTwoWeekLow || 0,
    marketCap: m.marketCap,
    previousClose: prevClose,
  };
}

async function getMultiQuotes(symbols) {
  const results = await Promise.all(symbols.map((s) => getQuote(s).catch(() => null)));
  return results.filter(Boolean);
}

async function getIndices() {
  const symbols = ['^GSPC', '^IXIC', '^DJI', '^RUT'];
  const names = { '^GSPC': 'S&P 500', '^IXIC': 'NASDAQ', '^DJI': 'DOW', '^RUT': 'RUSSELL 2000' };
  const results = await Promise.all(symbols.map((s) => fetchYahoo(`/v8/finance/chart/${s}?range=1d&interval=1d`).catch(() => null)));
  return results
    .filter(Boolean)
    .map((data) => {
      const r = data.chart?.result?.[0];
      if (!r) return null;
      const m = r.meta;
      const prev = m.chartPreviousClose || m.previousClose;
      const change = m.regularMarketPrice - prev;
      const pct = prev ? (change / prev) * 100 : 0;
      return { symbol: m.symbol, name: names[m.symbol] || m.symbol, price: m.regularMarketPrice, change, pct };
    })
    .filter(Boolean);
}

async function getMovers() {
  const symbols = ['AAPL','MSFT','GOOGL','AMZN','NVDA','TSLA','META','AMD','NFLX','CRM','INTC','PYPL','BA','JPM','GS','COIN','PLTR','SOFI','SNAP','UBER','ORCL','COST','WMT','HD','PG','JNJ','V','MA','UNH','ABBV'];
  const results = await Promise.all(symbols.map((s) => fetchYahoo(`/v8/finance/chart/${s}?range=1d&interval=1d`).catch(() => null)));
  return results
    .filter(Boolean)
    .map((data) => {
      const r = data.chart?.result?.[0];
      if (!r) return null;
      const m = r.meta;
      const prev = m.chartPreviousClose || m.previousClose;
      const change = m.regularMarketPrice - prev;
      const pct = prev ? (change / prev) * 100 : 0;
      return { symbol: m.symbol, name: m.shortName || m.symbol, price: m.regularMarketPrice, change, pct };
    })
    .filter(Boolean);
}

function formatQuote(q) {
  const sign = q.change >= 0 ? '▲' : '▼';
  return `${q.name} (${q.symbol})\nPrice: $${q.price.toFixed(2)} ${sign}${Math.abs(q.change).toFixed(2)} (${q.changePct >= 0 ? '+' : ''}${q.changePct.toFixed(2)}%)\nDay Range: $${q.dayLow.toFixed(2)} - $${q.dayHigh.toFixed(2)}\nVolume: ${(q.volume / 1_000_000).toFixed(1)}M\n52W Range: $${q.week52Low.toFixed(2)} - $${q.week52High.toFixed(2)}`;
}

function formatCompactQuote(q) {
  const sign = q.change >= 0 ? '▲' : '▼';
  return `${q.symbol}: $${q.price.toFixed(2)} ${sign}${Math.abs(q.change).toFixed(2)} (${q.changePct >= 0 ? '+' : ''}${q.changePct.toFixed(2)}%)`;
}

const SECTOR_STOCKS = {
  tech: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META', 'AMD', 'CRM', 'NFLX', 'INTC', 'ORCL'],
  finance: ['JPM', 'V', 'GS', 'MS', 'BAC', 'WFC', 'C', 'AXP', 'BLK', 'SCHW'],
  health: ['UNH', 'JNJ', 'LLY', 'PFE', 'ABBV', 'MRK', 'TMO', 'ABT', 'AMGN', 'BMY'],
  energy: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL'],
  consumer: ['AMZN', 'TSLA', 'COST', 'WMT', 'HD', 'NKE', 'SBUX', 'MCD', 'TGT', 'LOW'],
  crypto: ['COIN', 'MSTR', 'RIOT', 'MARA', 'HOOD'],
};

const RULES = [
  // Help
  { pattern: /^(help|帮助|命令| cmds?)$/i, handler: () => HELP_TEXT },

  // Market overview
  { pattern: /^(market|大盘|指数|指数行情|indices)$/i, handler: async () => {
    const indices = await getIndices();
    return '📊 Market Indices\n\n' + indices.map((i) => `${i.name}: ${i.price.toFixed(2)}  ${i.change >= 0 ? '▲' : '▼'}${i.change.toFixed(2)} (${i.pct >= 0 ? '+' : ''}${i.pct.toFixed(2)}%)`).join('\n');
  }},

  // Gainers / Losers
  { pattern: /^(gainers?|涨幅|涨榜|top.*gain|向上)$/i, handler: async () => {
    const movers = await getMovers();
    const gainers = movers.filter((m) => m.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 8);
    if (gainers.length === 0) return 'No gainers found right now.';
    return '📈 Top Gainers\n\n' + gainers.map((g, i) => `${i + 1}. ${g.symbol.padEnd(6)} $${g.price.toFixed(2)}  ▲${g.pct.toFixed(2)}%`).join('\n');
  }},
  { pattern: /^(losers?|跌幅|跌榜|top.*loss|向下)$/i, handler: async () => {
    const movers = await getMovers();
    const losers = movers.filter((m) => m.pct < 0).sort((a, b) => a.pct - b.pct).slice(0, 8);
    if (losers.length === 0) return 'No losers found right now.';
    return '📉 Top Losers\n\n' + losers.map((l, i) => `${i + 1}. ${l.symbol.padEnd(6)} $${l.price.toFixed(2)}  ▼${Math.abs(l.pct).toFixed(2)}%`).join('\n');
  }},

  // Watchlist / Portfolio
  { pattern: /^(watchlist|自选股|自选)$/i, handler: async (_input, context) => {
    const symbols = context.watchlist || [];
    if (symbols.length === 0) return 'Your watchlist is empty.';
    const quotes = await getMultiQuotes(symbols);
    return '⭐ Watchlist\n\n' + quotes.map((q) => formatCompactQuote(q)).join('\n');
  }},
  { pattern: /^(portfolio|持仓|持仓汇总)$/i, handler: async (_input, context) => {
    const holdings = context.portfolio || [];
    if (holdings.length === 0) return 'No holdings in portfolio.';
    const totalCost = holdings.reduce((s, h) => s + h.shares * h.buyPrice, 0);
    const totalValue = holdings.reduce((s, h) => s + h.shares * (h.currentPrice || h.buyPrice), 0);
    const pnl = totalValue - totalCost;
    const pct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    const lines = holdings.map((h) => {
      const cur = h.currentPrice || h.buyPrice;
      const cost = h.shares * h.buyPrice;
      const val = h.shares * cur;
      const p = val - cost;
      return `${h.symbol}: ${h.shares} shares @ $${h.buyPrice.toFixed(2)} → $${cur.toFixed(2)} | P&L: ${p >= 0 ? '+' : ''}$${p.toFixed(2)}`;
    });
    lines.push(`\nTotal: $${totalValue.toFixed(2)} (Cost: $${totalCost.toFixed(2)}) P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`);
    return lines.join('\n');
  }},

  // Compare stocks: "compare AAPL MSFT" or "AAPL vs MSFT"
  { pattern: /^(?:compare|对比|比较)\s+([A-Za-z]{1,5})\s+([A-Za-z]{1,5})$/i, handler: async (_input, a, b) => {
    const quotes = await getMultiQuotes([a.toUpperCase(), b.toUpperCase()]);
    if (quotes.length < 2) return `Could not find data for both ${a.toUpperCase()} and ${b.toUpperCase()}.`;
    const [q1, q2] = quotes;
    return `⚖️ ${q1.symbol} vs ${q2.symbol}\n\n${q1.symbol}: $${q1.price.toFixed(2)} (${q1.changePct >= 0 ? '+' : ''}${q1.changePct.toFixed(2)}%)\n${q2.symbol}: $${q2.price.toFixed(2)} (${q2.changePct >= 0 ? '+' : ''}${q2.changePct.toFixed(2)}%)\n\nVolume: ${q1.symbol} ${(q1.volume / 1_000_000).toFixed(1)}M vs ${q2.symbol} ${(q2.volume / 1_000_000).toFixed(1)}M\n52W High: ${q1.symbol} $${q1.week52High.toFixed(2)} vs ${q2.symbol} $${q2.week52High.toFixed(2)}`;
  }},
  { pattern: /^([A-Za-z]{1,5})\s+(?:vs|versus|和|与)\s+([A-Za-z]{1,5})$/i, handler: async (_input, a, b) => {
    const quotes = await getMultiQuotes([a.toUpperCase(), b.toUpperCase()]);
    if (quotes.length < 2) return `Could not find data for both ${a.toUpperCase()} and ${b.toUpperCase()}.`;
    const [q1, q2] = quotes;
    return `⚖️ ${q1.symbol} vs ${q2.symbol}\n\n${q1.symbol}: $${q1.price.toFixed(2)} (${q1.changePct >= 0 ? '+' : ''}${q1.changePct.toFixed(2)}%)\n${q2.symbol}: $${q2.price.toFixed(2)} (${q2.changePct >= 0 ? '+' : ''}${q2.changePct.toFixed(2)}%)\n\nVolume: ${q1.symbol} ${(q1.volume / 1_000_000).toFixed(1)}M vs ${q2.symbol} ${(q2.volume / 1_000_000).toFixed(1)}M\n52W High: ${q1.symbol} $${q1.week52High.toFixed(2)} vs ${q2.symbol} $${q2.week52High.toFixed(2)}`;
  }},

  // Sector: "sector tech" / "板块 科技"
  { pattern: /^(?:sector|板块)\s+(tech|科技|finance|金融|health|医疗|energy|能源|consumer|消费|crypto|加密)$/i, handler: async (_input, sector) => {
    const sectorMap = { '科技': 'tech', '金融': 'finance', '医疗': 'health', '能源': 'energy', '消费': 'consumer', '加密': 'crypto' };
    const key = sectorMap[sector] || sector.toLowerCase();
    const symbols = SECTOR_STOCKS[key];
    if (!symbols) return `Unknown sector: ${sector}. Available: tech, finance, health, energy, consumer, crypto`;
    const quotes = await getMultiQuotes(symbols);
    const sorted = quotes.sort((a, b) => b.changePct - a.changePct);
    const emoji = key === 'crypto' ? '🪙' : key === 'tech' ? '💻' : key === 'finance' ? '🏦' : key === 'health' ? '🏥' : key === 'energy' ? '⚡' : '🛒';
    return `${emoji} ${sector.toUpperCase()} Sector\n\n` + sorted.map((q) => formatCompactQuote(q)).join('\n');
  }},

  // Stock with explanation keywords: "AAPL why", "oracle 为什么跌", "ORCL reason"
  { pattern: /^([A-Za-z]{1,5})\s+(why|为什么|怎么回事|原因|reason|explain|分析)$/i, handler: async (_input, symbol) => {
    const q = await getQuote(symbol.toUpperCase());
    if (!q) return `Could not find data for ${symbol.toUpperCase()}.`;
    const direction = q.change >= 0 ? 'up' : 'down';
    const cnDirection = q.change >= 0 ? '涨' : '跌';
    return `${q.name} (${q.symbol}) — ${cnDirection}${Math.abs(q.changePct).toFixed(2)}%\n\nCurrent: $${q.price.toFixed(2)} (${q.changePct >= 0 ? '+' : ''}${q.changePct.toFixed(2)}%)\nDay Range: $${q.dayLow.toFixed(2)} - $${q.dayHigh.toFixed(2)}\nVolume: ${(q.volume / 1_000_000).toFixed(1)}M\n52W Range: $${q.week52Low.toFixed(2)} - $${q.week52High.toFixed(2)}\n\nFor detailed analysis, check:\n• https://finance.yahoo.com/quote/${q.symbol}/news\n• https://www.google.com/finance/quote/${q.symbol}:NYSE`;
  }},
  { pattern: /^(why|为什么|怎么回事|原因)\s+([A-Za-z]{1,5})$/i, handler: async (_input, _word, symbol) => {
    const q = await getQuote(symbol.toUpperCase());
    if (!q) return `Could not find data for ${symbol.toUpperCase()}.`;
    const cnDirection = q.change >= 0 ? '涨' : '跌';
    return `${q.name} (${q.symbol}) — ${cnDirection}${Math.abs(q.changePct).toFixed(2)}%\n\nCurrent: $${q.price.toFixed(2)} (${q.changePct >= 0 ? '+' : ''}${q.changePct.toFixed(2)}%)\nDay Range: $${q.dayLow.toFixed(2)} - $${q.dayHigh.toFixed(2)}\nVolume: ${(q.volume / 1_000_000).toFixed(1)}M\n52W Range: $${q.week52Low.toFixed(2)} - $${q.week52High.toFixed(2)}\n\nFor detailed analysis, check:\n• https://finance.yahoo.com/quote/${q.symbol}/news\n• https://www.google.com/finance/quote/${q.symbol}:NYSE`;
  }},

  // News: "news AAPL" / "新闻 AAPL"
  { pattern: /^(?:news|新闻|消息)\s+([A-Za-z]{1,5})$/i, handler: async (_input, symbol) => {
    const q = await getQuote(symbol.toUpperCase());
    if (!q) return `Could not find data for ${symbol.toUpperCase()}.`;
    const sign = q.change >= 0 ? '▲' : '▼';
    return `📰 ${q.name} (${q.symbol}) $${q.price.toFixed(2)} ${sign}${Math.abs(q.changePct).toFixed(2)}%\n\nLatest news:\n• https://finance.yahoo.com/quote/${q.symbol}/news\n• https://www.google.com/finance/quote/${q.symbol}:NYSE\n• https://seekingalpha.com/symbol/${q.symbol}`;
  }},

  // Top stocks in a category: "top volume" / "最活跃"
  { pattern: /^(?:top|最大|最活跃|活跃)\s*(volume|成交量|vol)$/i, handler: async () => {
    const movers = await getMovers();
    const top = movers.sort((a, b) => {
      const va = a.volume || 0;
      const vb = b.volume || 0;
      return vb - va;
    }).slice(0, 8);
    return '🔥 Highest Volume\n\n' + top.map((t, i) => `${i + 1}. ${t.symbol.padEnd(6)} $${t.price.toFixed(2)}  Vol: ${(t.volume / 1_000_000).toFixed(1)}M`).join('\n');
  }},

  // Simple stock ticker (must be after all compound patterns)
  { pattern: /^([A-Z]{1,5})$/i, handler: async (input) => {
    const symbol = input.toUpperCase();
    const q = await getQuote(symbol);
    if (!q) return `Could not find data for ${symbol}. Check the ticker symbol.`;
    return formatQuote(q);
  }},

  // "AAPL price" / "AAPL 价格"
  { pattern: /^(.*\s+price|.*\s+价格|.*现价)$/i, handler: async (input) => {
    const symbol = input.replace(/\s*(price|价格|现价)\s*$/i, '').trim().toUpperCase();
    if (!symbol || symbol.length > 5 || !/^[A-Z]+$/.test(symbol)) return null;
    const q = await getQuote(symbol);
    if (!q) return `Could not find data for ${symbol}.`;
    return `${q.symbol}: $${q.price.toFixed(2)} (${q.changePct >= 0 ? '+' : ''}${q.changePct.toFixed(2)}%)`;
  }},

  // Chinese stock name patterns: "苹果" / "特斯拉"
  { pattern: /^(苹果|apple)$/i, handler: async () => formatQuote(await getQuote('AAPL')) },
  { pattern: /^(微软|microsoft|msft)$/i, handler: async () => formatQuote(await getQuote('MSFT')) },
  { pattern: /^(谷歌|google|googl)$/i, handler: async () => formatQuote(await getQuote('GOOGL')) },
  { pattern: /^(英伟达|nvidia|nvda)$/i, handler: async () => formatQuote(await getQuote('NVDA')) },
  { pattern: /^(特斯拉|tesla|tsla)$/i, handler: async () => formatQuote(await getQuote('TSLA')) },
  { pattern: /^(亚马逊|amazon|amzn)$/i, handler: async () => formatQuote(await getQuote('AMZN')) },
  { pattern: /^(meta|facebook|脸书)$/i, handler: async () => formatQuote(await getQuote('META')) },
  { pattern: /^(甲骨文|oracle|orcl)$/i, handler: async () => formatQuote(await getQuote('ORCL')) },
];

const HELP_TEXT = [
  '📋 Available Commands',
  '',
  '💹 Stock Quotes',
  '  AAPL / TSLA / ORCL',
  '  TSLA price / NVDA 价格',
  '',
  '📊 Market',
  '  market / 大盘 / 指数',
  '  gainers / 涨幅  |  losers / 跌幅',
  '',
  '⚖️ Compare',
  '  compare AAPL MSFT',
  '  AAPL vs MSFT',
  '',
  '🏭 Sectors',
  '  sector tech / finance / health / energy / consumer / crypto',
  '  板块 科技 / 金融 / 医疗 / 能源 / 消费',
  '',
  '📰 News & Analysis',
  '  news AAPL / 新闻 ORCL',
  '  AAPL why / oracle 为什么跌',
  '',
  '⭐ Lists',
  '  watchlist / 自选股',
  '  portfolio / 持仓',
  '',
  '🇨🇳 Chinese Names',
  '  苹果 / 特斯拉 / 英伟达 / 甲骨文',
].join('\n');

router.post('/', async (req, res) => {
  try {
    const { message, context, chatId } = req.body;
    if (!message) return res.json({ reply: 'Please type a message.' });

    const input = message.trim();

    // Try rule-based handlers first
    for (const rule of RULES) {
      const match = input.match(rule.pattern);
      if (match) {
        try {
          const reply = await rule.handler(input, ...match.slice(1), context || {});
          if (reply) return res.json({ reply });
        } catch (err) {
          return res.json({ reply: `Error fetching data: ${err.message}` });
        }
      }
    }

    // Fallback: Claude Code CLI (uses your mify endpoint + memory)
    const contextHint = [];
    if (context?.watchlist?.length) contextHint.push(`Watchlist: ${context.watchlist.join(', ')}`);
    if (context?.portfolio?.length) contextHint.push(`Portfolio: ${context.portfolio.map((h) => `${h.symbol} ${h.shares}sh @ $${h.buyPrice}`).join(', ')}`);
    const fullMessage = contextHint.length > 0
      ? `${message}\n\n[User context: ${contextHint.join(' | ')}]`
      : message;

    const claudeReply = await askClaude(fullMessage, chatId);
    if (claudeReply) return res.json({ reply: claudeReply, sessionId: chatSessions.get(chatId)?.sessionId });

    // Default: show help
    res.json({ reply: HELP_TEXT });
  } catch (err) {
    res.json({ reply: `Error: ${err.message}` });
  }
});

export default router;
