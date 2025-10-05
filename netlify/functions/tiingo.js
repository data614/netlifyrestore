import {
  loadEod,
  loadFundamentals,
  loadNews,
  loadDocuments,
  loadActions,
  loadIntradayLatest,
} from './tiingo-data.js';

const BASE_PRICE_MAP = {
  AAPL: 258.0,
  MSFT: 415.0,
  GOOGL: 167.0,
  TSLA: 240.0,
  WOW: 26.55,  // Updated to match official Woolworths share price
  "WOW.AX": 26.55,  // Updated to match official Woolworths share price
  CBA: 130.5,
  "CBA.AX": 130.5,
  BHP: 42.8,
  "BHP.AX": 42.8,
  CSL: 280.0,
  "CSL.AX": 280.0,
  WES: 52.3,
  "WES.AX": 52.3,
  ANZ: 29.45,
  "ANZ.AX": 29.45,
  NAB: 37.2,
  "NAB.AX": 37.2,
  WBC: 26.8,
  "WBC.AX": 26.8,
  RIO: 118.5,
  "RIO.AX": 118.5,
  TLS: 4.12,
  "TLS.AX": 4.12,
  DEFAULT: 100.0,
};

const ASX_SYMBOL_MAP = {
  WOW: "WOW.AX",
  CBA: "CBA.AX",
  BHP: "BHP.AX",
  CSL: "CSL.AX",
  WES: "WES.AX",
  ANZ: "ANZ.AX",
  NAB: "NAB.AX",
  WBC: "WBC.AX",
  RIO: "RIO.AX",
  TLS: "TLS.AX",
};

function ensureNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function previewToken(token) {
  if (!token) return "";
  const trimmed = String(token).trim();
  if (!trimmed) return "";
  if (trimmed.length <= 4) return trimmed;
  return `${trimmed.slice(0, 4)}***`;
}

function mapSymbolForAPI(symbol) {
  const raw = String(symbol ?? "").trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (upper.includes(".AX")) return upper;
  return ASX_SYMBOL_MAP[upper] || upper;
}

function detectCurrency(symbol) {
  const upper = String(symbol ?? "").toUpperCase();
  if (upper.endsWith(".AX")) return "AUD";
  if (upper.endsWith(".L") || upper.includes(".LON")) return "GBP";
  if (upper.endsWith(".TO") || upper.endsWith(".TSE")) return "CAD";
  return "USD";
}

function detectExchange(symbol) {
  const upper = String(symbol ?? "").toUpperCase();
  if (upper.endsWith(".AX")) return "ASX";
  if (upper.endsWith(".L") || upper.includes(".LON")) return "LSE";
  if (upper.endsWith(".TO") || upper.endsWith(".TSE")) return "TSE";
  return "NASDAQ/NYSE";
}

function buildQuoteFromTiingo(quote, mappedSymbol, originalSymbol) {
  const last = ensureNumber(quote?.last ?? quote?.tngoLast, 0);
  const prevClose = ensureNumber(quote?.prevClose, last);
  const open = ensureNumber(quote?.open, last);
  const high = ensureNumber(quote?.high, Math.max(open, last));
  const low = ensureNumber(quote?.low, Math.min(open, last));
  const change = last - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;
  const timestamp = quote?.timestamp || quote?.lastSaleTimestamp || new Date().toISOString();
  const exchange = detectExchange(mappedSymbol);
  const currency = detectCurrency(mappedSymbol);

  return {
    symbol: String(originalSymbol || "").toUpperCase(),
    last,
    close: last,
    price: last,
    prevClose,
    previousClose: prevClose,
    open,
    high,
    low,
    volume: ensureNumber(quote?.volume, 0),
    change,
    changePercent,
    exchange,
    exchangeCode: exchange,
    currency,
    timestamp,
  };
}

function generateFallbackQuote(originalSymbol, mappedSymbol) {
  const key = String(mappedSymbol || originalSymbol || "DEFAULT").toUpperCase();
  const base = ensureNumber(BASE_PRICE_MAP[key], BASE_PRICE_MAP.DEFAULT);
  const last = Number((base * (0.99 + Math.random() * 0.02)).toFixed(2));
  const prevClose = Number((last * (0.995 + Math.random() * 0.01)).toFixed(2));
  const open = Number((last * (0.995 + Math.random() * 0.01)).toFixed(2));
  const high = Number((Math.max(open, last) * (1 + Math.random() * 0.01)).toFixed(2));
  const low = Number((Math.min(open, last) * (1 - Math.random() * 0.01)).toFixed(2));
  const change = Number((last - prevClose).toFixed(2));
  const changePercent = Number(prevClose ? ((change / prevClose) * 100).toFixed(2) : 0);
  const exchange = detectExchange(mappedSymbol);
  const currency = detectCurrency(mappedSymbol);

  return {
    symbol: String(originalSymbol || "").toUpperCase(),
    last,
    close: last,
    price: last,
    prevClose,
    previousClose: prevClose,
    open,
    high,
    low,
    volume: Math.floor(Math.random() * 1500000) + 250000,
    change,
    changePercent,
    exchange,
    exchangeCode: exchange,
    currency,
    timestamp: new Date().toISOString(),
    source: "fallback",
  };
}

function parseIntervalMinutes(interval) {
  const value = String(interval ?? "").trim().toLowerCase();
  const match = value.match(/(\d+)/);
  if (match) {
    const raw = parseInt(match[1], 10);
    if (Number.isFinite(raw) && raw > 0) return raw;
  }
  return 5;
}

function generateFallbackIntradaySeries(originalSymbol, mappedSymbol, limit = 150, intervalMinutes = 5) {
  const key = String(mappedSymbol || originalSymbol || "DEFAULT").toUpperCase();
  const base = ensureNumber(BASE_PRICE_MAP[key], BASE_PRICE_MAP.DEFAULT);
  const results = [];
  const now = Date.now();
  let price = base;

  for (let i = limit - 1; i >= 0; i -= 1) {
    const ts = new Date(now - i * intervalMinutes * 60 * 1000);
    const drift = Math.sin((limit - i) / 10) * 0.005;
    const random = (Math.random() - 0.5) * 0.02;
    price = Math.max(0.5, price * (1 + drift + random));
    const open = price * (0.995 + Math.random() * 0.01);
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    results.push({
      timestamp: ts.toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 120000) + 20000,
    });
  }

  return results;
}

function generateFallbackDailySeries(originalSymbol, mappedSymbol, limit = 60) {
  const key = String(mappedSymbol || originalSymbol || "DEFAULT").toUpperCase();
  const base = ensureNumber(BASE_PRICE_MAP[key], BASE_PRICE_MAP.DEFAULT);
  const results = [];
  const now = new Date();
  let price = base;

  for (let i = limit - 1; i >= 0; i -= 1) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const drift = Math.sin((limit - i) / 14) * 0.01;
    const random = (Math.random() - 0.5) * 0.03;
    price = Math.max(0.5, price * (1 + drift + random));
    const open = price * (0.98 + Math.random() * 0.03);
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.015);
    const low = Math.min(open, close) * (1 - Math.random() * 0.015);
    results.push({
      date: day.toISOString().split("T")[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1500000) + 300000,
      adjClose: Number(close.toFixed(2)),
    });
  }

  return results;
}

function normaliseKind(kind) {
  const value = String(kind ?? "").trim().toLowerCase();
  return value || "intraday_latest";
}

function applyFallback(meta, source, fallbackKey, reasonMessage) {
  meta.reason = "fallback";
  meta.source = source;
  meta.fallback = fallbackKey;
  if (reasonMessage) {
    meta.message = reasonMessage;
  }
}

export async function handler(event) {
  const baseHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: baseHeaders, body: "" };
  }

  const query = event.queryStringParameters || {};
  const rawSymbol = String(query.symbol ?? "").trim();
  const kind = normaliseKind(query.kind);
  const token = process.env.TIINGO_KEY;

  if (!rawSymbol) {
    return {
      statusCode: 400,
      headers: baseHeaders,
      body: JSON.stringify({ error: "Missing symbol parameter" }),
    };
  }

  const mappedSymbol = mapSymbolForAPI(rawSymbol);
  const timestamp = new Date().toISOString();

  const meta = {
    currency: detectCurrency(mappedSymbol),
    exchange: detectExchange(mappedSymbol),
    timestamp,
    kind,
    source: "live",
    fallback: "",
    reason: "ok",
    chosenKey: token ? "env:TIINGO_KEY" : "",
    tokenPreview: previewToken(token),
  };

  let warning = "";
  let data;

  switch (kind) {
    case "intraday_latest": {
      let quoteData = null;
      if (token) {
        try {
          const url = `https://api.tiingo.com/iex?tickers=${mappedSymbol}&token=${token}`;
          const response = await fetch(url);
          const rawData = await response.json();
          if (!response.ok) {
            throw new Error(`Tiingo API error: ${response.status}`);
          }
          const quote = Array.isArray(rawData) ? rawData[0] : rawData;
          if (quote && (quote.last || quote.tngoLast)) {
            quoteData = buildQuoteFromTiingo(quote, mappedSymbol, rawSymbol);
          } else {
            throw new Error("No quote returned");
          }
        } catch (error) {
          console.warn("Tiingo intraday_latest fallback:", error);
          warning = "Live data unavailable. Showing fallback quote.";
          applyFallback(meta, "fallback", "intraday_latest", error.message);
        }
      } else {
        warning = "Tiingo token missing. Showing sample data.";
        applyFallback(meta, "mock", "missing-token", "Token not configured");
      }

      if (!quoteData) {
        quoteData = generateFallbackQuote(rawSymbol, mappedSymbol);
      }

      data = [quoteData];
      break;
    }

    case "intraday": {
      const limit = Math.min(parseInt(query.limit ?? "150", 10) || 150, 300);
      const interval = String(query.interval ?? "5min");
      const intervalMinutes = parseIntervalMinutes(interval);
      let rows = null;

      if (token) {
        try {
          const minutesPerTradingDay = 390;
          const requiredMinutes = limit * intervalMinutes;
          const minimumDays = Math.max(1, Math.ceil(requiredMinutes / minutesPerTradingDay));
          const lookbackDays = Math.min(10, Math.max(minimumDays + 2, 3));
          const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
          const url = `https://api.tiingo.com/iex/${mappedSymbol}/prices?startDate=${startDate.toISOString().split('T')[0]}&resampleFreq=${interval}&token=${token}`;
          const response = await fetch(url);
          const rawData = await response.json();
          if (!response.ok) {
            const detail = typeof rawData === "object" && rawData !== null
              ? rawData.detail || rawData.message || rawData.error || ""
              : "";
            throw new Error(detail || `Tiingo API error: ${response.status}`);
          }
          if (!Array.isArray(rawData) || rawData.length === 0) {
            throw new Error("No intraday data returned.");
          }
          rows = rawData.slice(-limit).map((item) => ({
            timestamp: item.date,
            open: ensureNumber(item.open),
            high: ensureNumber(item.high),
            low: ensureNumber(item.low),
            close: ensureNumber(item.close),
            volume: ensureNumber(item.volume),
          }));
        } catch (error) {
          console.warn("Tiingo intraday fallback:", error);
          warning = "Live intraday data unavailable. Showing fallback series.";
          applyFallback(meta, "fallback", "intraday", error.message);
        }
      } else {
        warning = "Tiingo token missing. Showing sample intraday series.";
        applyFallback(meta, "mock", "missing-token", "Token not configured");
      }

      if (!rows || rows.length === 0) {
        rows = generateFallbackIntradaySeries(rawSymbol, mappedSymbol, limit, intervalMinutes);
      }

      data = rows;
      break;
    }
    case "eod": {
      const limit = Math.min(parseInt(query.limit ?? "180", 10) || 180, 365);
      let rows = null;

      if (token) {
        try {
          const startDate = new Date(Date.now() - limit * 24 * 60 * 60 * 1000);
          const url = `https://api.tiingo.com/tiingo/daily/${mappedSymbol}/prices?token=${token}&startDate=${startDate.toISOString().split("T")[0]}`;
          const response = await fetch(url);
          const rawData = await response.json();
          if (!response.ok || !Array.isArray(rawData) || rawData.length === 0) {
            throw new Error(`Tiingo API error: ${response.status}`);
          }
          rows = rawData.slice(-limit).map((item) => ({
            date: item.date,
            open: ensureNumber(item.open),
            high: ensureNumber(item.high),
            low: ensureNumber(item.low),
            close: ensureNumber(item.close),
            volume: ensureNumber(item.volume),
            adjClose: ensureNumber(item.adjClose ?? item.close),
          }));
        } catch (error) {
          console.warn("Tiingo EOD fallback:", error);
          warning = "Live EOD data unavailable. Showing fallback series.";
          applyFallback(meta, "eod-fallback", "eod", error.message);
        }
      } else {
        warning = "Tiingo token missing. Showing sample EOD series.";
        applyFallback(meta, "mock", "missing-token", "Token not configured");
      }

      if (!rows || rows.length === 0) {
        if (meta.source !== "mock") {
          meta.source = "eod-fallback";
        }
        rows = generateFallbackDailySeries(rawSymbol, mappedSymbol, limit);
      }

      data = rows;
      break;
    }

    case "news":
    case "documents":
    case "actions":
    case "filings":
    case "statements": {
      data = [];
      if (!token) {
        meta.source = "mock";
        meta.reason = "fallback";
        meta.fallback = meta.fallback || "missing-token";
      }
      break;
    }

    default: {
      data = { message: `${kind} data not implemented`, symbol: rawSymbol };
      meta.source = "mock";
      meta.reason = "unsupported";
      meta.fallback = meta.fallback || "unsupported-kind";
      warning = warning || "Requested data type is not implemented.";
      break;
    }
  }

  const responseBody = {
    originalSymbol: rawSymbol.toUpperCase(),
    mappedSymbol,
    symbol: rawSymbol.toUpperCase(),
    data,
    meta,
  };

  if (warning) {
    responseBody.warning = warning;
  }

  const responseHeaders = {
    ...baseHeaders,
    "x-tiingo-source": meta.source || "",
    "x-tiingo-fallback": meta.fallback || "",
    "x-tiingo-token-preview": meta.tokenPreview || "",
    "x-tiingo-chosen-key": meta.chosenKey || "",
  };

  return {
    statusCode: 200,
    headers: responseHeaders,
    body: JSON.stringify(responseBody),
  };
}


export default handler;

// Re-export the main functions from tiingo-data.js
export { loadEod, loadFundamentals, loadIntradayLatest, loadNews, loadDocuments, loadActions };

// Alias exports for backward compatibility
export { loadNews as loadCompanyNews };
export { loadDocuments as loadCompanyDocuments };  
export { loadActions as loadCorporateActions };

export async function loadValuation(symbol, token) {
  // Stub implementation for valuation
  return { symbol, data: null, source: 'stub' };
}

export async function loadCompanyOverview(symbol, token) {
  // Stub implementation for company overview  
  return { symbol, data: null, source: 'stub' };
}

// Export mock data for backward compatibility
export const __private = {
  // Mock data exports for testing
};