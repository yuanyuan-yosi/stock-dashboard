import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRouter from './chat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

const YAHOO_BASE = 'https://query1.finance.yahoo.com';
const YAHOO_BASE2 = 'https://query2.finance.yahoo.com';

async function fetchYahoo(path) {
  const res = await fetch(`${YAHOO_BASE}${path}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  if (!res.ok) throw new Error(`Yahoo API error: ${res.status}`);
  return res.json();
}

// Yahoo crumb auth for endpoints that require it (e.g. quoteSummary)
let yahooCrumb = null;
let yahooCookie = null;

async function getYahooCrumb() {
  if (yahooCrumb) return { crumb: yahooCrumb, cookie: yahooCookie };
  const cookieRes = await fetch('https://fc.yahoo.com', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    redirect: 'manual',
  });
  const setCookie = cookieRes.headers.getSetCookie?.() || [];
  yahooCookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  const crumbRes = await fetch(`${YAHOO_BASE2}/v1/test/getcrumb`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Cookie: yahooCookie },
  });
  yahooCrumb = await crumbRes.text();
  return { crumb: yahooCrumb, cookie: yahooCookie };
}

async function fetchYahooAuth(path) {
  const { crumb, cookie } = await getYahooCrumb();
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${YAHOO_BASE2}${path}${sep}crumb=${crumb}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Cookie: cookie },
  });
  if (!res.ok) {
    // Crumb might be stale, reset and retry once
    yahooCrumb = null;
    const { crumb: c2, cookie: k2 } = await getYahooCrumb();
    const res2 = await fetch(`${YAHOO_BASE2}${path}${sep}crumb=${c2}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Cookie: k2 },
    });
    if (!res2.ok) throw new Error(`Yahoo Auth API error: ${res2.status}`);
    return res2.json();
  }
  return res.json();
}

// Quote endpoint
app.get('/api/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const range = req.query.range || '1d';
    const interval = req.query.interval || '1d';
    const data = await fetchYahoo(
      `/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=true`
    );
    res.set('Cache-Control', 'public, max-age=15');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chart data endpoint
app.get('/api/chart/:symbol', async ( req, res) => {
  try {
    const { symbol } = req.params;
    const range = req.query.range || '1d';
    const interval = req.query.interval || '5m';
    const data = await fetchYahoo(
      `/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=true`
    );
    res.set('Cache-Control', 'public, max-age=60');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Treasury yields from US Treasury (free, no API key)
async function fetchTreasuryYields() {
  const year = new Date().getFullYear();
  const res = await fetch(
    `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${year}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${year}&page&_format=csv`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  if (!res.ok) throw new Error(`Treasury API error: ${res.status}`);
  const csv = await res.text();
  const lines = csv.trim().split('\n');
  const header = lines[0].split(',').map((h) => h.replace(/"/g, ''));
  const row = lines[1]?.split(',').map((v) => v.replace(/"/g, ''));
  if (!row) return null;

  const getField = (name) => {
    const idx = header.indexOf(name);
    return idx >= 0 ? parseFloat(row[idx]) : null;
  };

  const prevRow = lines[2]?.split(',').map((v) => v.replace(/"/g, ''));
  const getPrevField = (name) => {
    if (!prevRow) return null;
    const idx = header.indexOf(name);
    return idx >= 0 ? parseFloat(prevRow[idx]) : null;
  };

  return {
    date: row[0],
    yields: {
      'US 2Y Yield': getField('2 Yr'),
      'US 10Y Yield': getField('10 Yr'),
    },
    prevYields: {
      'US 2Y Yield': getPrevField('2 Yr'),
      'US 10Y Yield': getPrevField('10 Yr'),
    },
  };
}

// Macro indicators (Yahoo Finance + Treasury yields)
app.get('/api/macro', async (_req, res) => {
  try {
    const symbols = ['GC=F', 'CL=F', 'BTC-USD', 'EURUSD=X', 'EURCNY=X'];
    const [yahooResults, treasury] = await Promise.all([
      Promise.all(
        symbols.map((s) =>
          fetchYahoo(`/v8/finance/chart/${s}?range=1d&interval=5m&includePrePost=false`)
        )
      ),
      fetchTreasuryYields().catch(() => null),
    ]);

    // Build treasury results in Yahoo Finance format
    const treasuryResults = [];
    for (const name of ['US 2Y Yield', 'US 10Y Yield']) {
      const yield_ = treasury?.yields?.[name];
      const prevYield = treasury?.prevYields?.[name];
      if (yield_ != null) {
        treasuryResults.push({
          chart: {
            result: [{
              meta: {
                symbol: name,
                shortName: name,
                regularMarketPrice: yield_,
                chartPreviousClose: prevYield ?? yield_,
              },
            }],
          },
        });
      }
    }

    // Insert treasury yields at positions 2 and 3 (after Gold, Crude)
    const results = [
      yahooResults[0], // Gold
      yahooResults[1], // Crude
      ...treasuryResults,
      ...yahooResults.slice(2), // BTC, EUR/USD, EUR/CNY
    ];

    res.set('Cache-Control', 'public, max-age=30');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Market indices
app.get('/api/market', async (_req, res) => {
  try {
    const symbols = ['^GSPC', '^IXIC', '^DJI', '^RUT'];
    const results = await Promise.all(
      symbols.map((s) =>
        fetchYahoo(`/v8/finance/chart/${s}?range=1d&interval=5m&includePrePost=false`)
      )
    );
    res.set('Cache-Control', 'public, max-age=30');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Quote detail (PE ratio, etc.) from quoteSummary
app.get('/api/quoteDetail/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await fetchYahooAuth(
      `/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryDetail`
    );
    res.set('Cache-Control', 'public, max-age=300');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Symbol search
app.get('/api/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const data = await fetchYahoo(`/v1/finance/lookup?query=${encodeURIComponent(query)}&type=equity&count=8&lang=en-US`);
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Top movers — batch quotes for popular stocks
const MOVER_SYMBOLS = [
  'AAPL','MSFT','GOOGL','AMZN','NVDA','TSLA','META','AMD','NFLX','CRM',
  'INTC','PYPL','DIS','NKE','BA','JPM','V','GS','SQ',
  'COIN','PLTR','SOFI','RIVN','LCID','SNAP','UBER','LYFT','ABNB','DKNG',
];

async function fetchMoversData() {
  const results = await Promise.all(
    MOVER_SYMBOLS.map((s) =>
      fetchYahoo(`/v8/finance/chart/${s}?range=1d&interval=1d&includePrePost=false`)
        .catch(() => null)
    )
  );
  const quotes = results
    .filter(Boolean)
    .map((data) => {
      const r = data.chart?.result?.[0];
      if (!r) return null;
      const m = r.meta;
      const prevClose = m.chartPreviousClose || m.previousClose || m.regularMarketPrice;
      const change = m.regularMarketPrice - prevClose;
      const changePercent = prevClose ? (change / prevClose) * 100 : 0;
      return {
        symbol: m.symbol,
        name: m.shortName || m.symbol,
        price: m.regularMarketPrice,
        change,
        changePercent,
        volume: m.regularMarketVolume || 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.changePercent - a.changePercent);

  const gainers = quotes.filter((q) => q.changePercent > 0).slice(0, 10);
  const losers = quotes.filter((q) => q.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 10);

  return { gainers, losers, all: quotes };
}

app.get('/api/movers', async (_req, res) => {
  try {
    const { gainers, losers } = await fetchMoversData();
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ gainers, losers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Economic data from FRED (Federal Reserve Economic Data)
const fredCache = new Map();

async function fetchFredCsv(seriesId) {
  const cached = fredCache.get(seriesId);
  if (cached && Date.now() - cached.time < 3600000) {
    return cached.data;
  }
  const res = await fetch(
    `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  if (!res.ok) throw new Error(`FRED API error: ${res.status}`);
  const csv = await res.text();
  const lines = csv.trim().split('\n');
  const header = lines[0].split(',');
  const dateIdx = header.findIndex((h) => h.trim().toLowerCase().includes('date'));
  const valueIdx = header.findIndex((h) => h.trim().toUpperCase() === seriesId.toUpperCase());
  if (dateIdx < 0 || valueIdx < 0) return [];
  const result = lines.slice(1)
    .map((line) => {
      const cols = line.split(',');
      const v = parseFloat(cols[valueIdx]);
      return cols[dateIdx] && !isNaN(v) ? { date: cols[dateIdx].trim(), value: v } : null;
    })
    .filter(Boolean);
  fredCache.set(seriesId, { data: result, time: Date.now() });
  return result;
}

app.get('/api/economy/fed-rate', async (_req, res) => {
  try {
    const data = await fetchFredCsv('FEDFUNDS');
    res.set('Cache-Control', 'no-store');
    res.json({ data });
  } catch (err) {
    console.error(`[fed-rate] error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/economy/nfp', async (_req, res) => {
  try {
    const data = await fetchFredCsv('PAYEMS');
    res.set('Cache-Control', 'no-store');
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/economy/cpi', async (_req, res) => {
  try {
    const data = await fetchFredCsv('CPIAUCSL');
    res.set('Cache-Control', 'no-store');
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/economy/gdp', async (_req, res) => {
  try {
    const data = await fetchFredCsv('GDP');
    res.set('Cache-Control', 'no-store');
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Market sentiment (composite score from VIX + market breadth)
app.get('/api/sentiment', async (_req, res) => {
  try {
    const [vixData, moversData] = await Promise.all([
      fetchYahoo('/v8/finance/chart/^VIX?range=1d&interval=1d&includePrePost=false').catch(() => null),
      fetchMoversData().catch(() => null),
    ]);

    // Parse VIX
    let vix = { price: 0, change: 0, changePercent: 0 };
    if (vixData?.chart?.result?.[0]) {
      const m = vixData.chart.result[0].meta;
      const prevClose = m.chartPreviousClose || m.previousClose || m.regularMarketPrice;
      const price = m.regularMarketPrice;
      vix = {
        price,
        change: price - prevClose,
        changePercent: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
      };
    }

    // Compute composite sentiment score (0-100) from VIX + breadth
    // VIX component: lower VIX = higher (bullish) score
    //   VIX < 12 → 90, VIX 12-15 → 75, VIX 15-20 → 50, VIX 20-25 → 30, VIX 25-30 → 15, VIX > 30 → 5
    let vixScore = 50;
    if (vix.price > 0) {
      if (vix.price < 12) vixScore = 90;
      else if (vix.price < 15) vixScore = 75;
      else if (vix.price < 18) vixScore = 60;
      else if (vix.price < 20) vixScore = 50;
      else if (vix.price < 25) vixScore = 30;
      else if (vix.price < 30) vixScore = 15;
      else vixScore = 5;
    }

    // Breadth component: advance/decline ratio from movers
    const gainers = moversData?.gainers?.length || 0;
    const losers = moversData?.losers?.length || 0;
    const total = gainers + losers;
    const breadthScore = total > 0 ? Math.round((gainers / total) * 100) : 50;

    // Weighted composite: 60% VIX + 40% breadth
    const compositeValue = Math.round(vixScore * 0.6 + breadthScore * 0.4);

    const getRating = (v) => {
      if (v <= 20) return 'Extreme Fear';
      if (v <= 40) return 'Fear';
      if (v <= 60) return 'Neutral';
      if (v <= 80) return 'Greed';
      return 'Extreme Greed';
    };

    const fearGreed = {
      value: compositeValue,
      rating: getRating(compositeValue),
      label: 'Composite Sentiment',
    };

    // Volume summary from movers
    const allStocks = moversData?.all || [];
    const totalVolume = allStocks.reduce((sum, s) => sum + (s.volume || 0), 0);
    const avgVolume = allStocks.length > 0 ? totalVolume / allStocks.length : 0;

    res.set('Cache-Control', 'public, max-age=60');
    res.json({ fearGreed, vix, breadth: { gainers, losers }, volume: { total: totalVolume, avg: avgVolume, count: allStocks.length } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/chat', chatRouter);

// Serve static frontend in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
