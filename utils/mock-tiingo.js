const DEFAULT_WARNING = 'Live Tiingo data unavailable. Displaying bundled sample data.';
const MOCK_DIR = 'data/tiingo-mock';
const FALLBACK_SYMBOL = 'GENERIC';
const mockCache = new Map();

const KIND_ALIASES = {
  quote: 'intraday_latest',
  quotes: 'intraday_latest',
  intraday_latest: 'intraday_latest',
  intraday: 'intraday',
  eod: 'eod',
  news: 'news',
  documents: 'documents',
  filings: 'filings',
  actions: 'actions',
  fundamentals: 'fundamentals',
  statements: 'statements',
  overview: 'overview',
  valuation: 'valuation',
};

function normaliseKind(kind) {
  const key = String(kind || 'eod').toLowerCase();
  return KIND_ALIASES[key] || 'eod';
}

function sliceLimit(items, limit, { fromEnd = false } = {}) {
  if (!Array.isArray(items)) return [];
  const count = Number(limit);
  if (!Number.isFinite(count) || count <= 0) return items.slice();
  return fromEnd ? items.slice(-count) : items.slice(0, count);
}

function resolveBaseUrl() {
  if (typeof window === 'undefined' || !window.location) return null;
  const { origin, href } = window.location;
  try {
    if (origin && origin !== 'null') return origin;
  } catch (error) {
    console.warn('[tiingo-mock] Unable to use window.location.origin', error);
  }
  return href || null;
}

async function loadMockRecord(symbol) {
  const target = symbol || FALLBACK_SYMBOL;
  if (mockCache.has(target)) {
    return mockCache.get(target);
  }
  const baseUrl = resolveBaseUrl();
  if (!baseUrl) return null;
  const url = new URL(`${MOCK_DIR}/${target}.json`, baseUrl);
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) return null;
    const json = await response.json().catch(() => null);
    if (!json || typeof json !== 'object') return null;
    mockCache.set(target, json);
    return json;
  } catch (error) {
    console.warn(`[tiingo-mock] Failed to load mock data for ${target}`, error);
    return null;
  }
}

function getLatestQuote(record) {
  if (!record || typeof record !== 'object') return null;
  if (record.quote && typeof record.quote === 'object') return record.quote;
  if (Array.isArray(record.intraday) && record.intraday.length) {
    return record.intraday[record.intraday.length - 1];
  }
  if (Array.isArray(record.eod) && record.eod.length) {
    return record.eod[record.eod.length - 1];
  }
  return null;
}

function computeValuationSnapshot(record, symbol) {
  const quote = getLatestQuote(record) || {};
  const fundamentals = record?.fundamentals || null;
  const metrics = fundamentals?.metrics || {};
  const price = Number(quote?.price ?? quote?.last ?? quote?.close ?? 0) || null;
  const eps = Number(metrics.earningsPerShare ?? metrics.eps ?? fundamentals?.latest?.eps ?? 0) || 0;
  const revenuePerShare = Number(metrics.revenuePerShare ?? 0) || null;
  const bookValuePerShare = Number(metrics.bookValuePerShare ?? fundamentals?.latest?.bookValuePerShare ?? 0) || 0;
  const fcfPerShare = Number(metrics.freeCashFlowPerShare ?? 0) || null;
  const fairValue = price ? Number((price * 1.05).toFixed(2)) : null;
  const suggestedEntry = price ? Number((price * 0.95).toFixed(2)) : null;
  const upside = fairValue && price ? Number((fairValue / price - 1).toFixed(4)) : null;

  return {
    symbol: symbol || record?.symbol || '',
    price,
    quote,
    fundamentals,
    valuation: {
      price,
      fairValue,
      suggestedEntry,
      upside,
      pe: eps ? Number((price / eps).toFixed(2)) : null,
      priceToSales: revenuePerShare ? Number((price / revenuePerShare).toFixed(2)) : null,
      priceToBook: bookValuePerShare ? Number((price / bookValuePerShare).toFixed(2)) : null,
      priceToFcf: fcfPerShare ? Number((price / fcfPerShare).toFixed(2)) : null,
      dividendYield: metrics.dividendYield ?? null,
      scenarios: {
        bull: fairValue ? Number((fairValue * 1.15).toFixed(2)) : null,
        base: fairValue ?? null,
        bear: fairValue ? Number((fairValue * 0.85).toFixed(2)) : null,
      },
    },
    narrative: `${symbol || record?.symbol || 'Sample'} valuation generated from bundled data.`,
    generatedAt: new Date().toISOString(),
  };
}

function extractFromRecord(record, kind, params) {
  const limit = Number(params?.limit);
  const symbol = params?.symbol || record?.symbol || '';
  const meta = {};

  switch (kind) {
    case 'intraday_latest': {
      const quote = getLatestQuote(record);
      const data = quote ? [quote] : [];
      meta.mockSection = record.quote ? 'quote' : 'intraday';
      return { data, meta };
    }
    case 'intraday': {
      const data = sliceLimit(record?.intraday, limit, { fromEnd: true });
      meta.mockSection = 'intraday';
      return { data, meta };
    }
    case 'news': {
      const data = sliceLimit(record?.news, limit, { fromEnd: false });
      meta.mockSection = 'news';
      return { data, meta };
    }
    case 'documents': {
      const source = Array.isArray(record?.documents) ? record.documents : record?.filings;
      const data = sliceLimit(source, limit, { fromEnd: false });
      meta.mockSection = Array.isArray(record?.documents) ? 'documents' : 'filings';
      return { data, meta };
    }
    case 'filings': {
      const data = sliceLimit(record?.filings, limit, { fromEnd: false });
      if (!data.length) {
        return extractFromRecord(record, 'documents', params);
      }
      meta.mockSection = 'filings';
      return { data, meta };
    }
    case 'actions': {
      const actions = record?.actions || {};
      const data = {
        dividends: Array.isArray(actions.dividends) ? sliceLimit(actions.dividends, limit, { fromEnd: false }) : [],
        splits: Array.isArray(actions.splits) ? sliceLimit(actions.splits, limit, { fromEnd: false }) : [],
      };
      meta.mockSection = 'actions';
      return { data, meta };
    }
    case 'fundamentals': {
      const data = record?.fundamentals || null;
      meta.mockSection = 'fundamentals';
      return { data, meta };
    }
    case 'statements': {
      const data = record?.statements || null;
      meta.mockSection = 'statements';
      return { data, meta };
    }
    case 'overview': {
      const data = record?.overview || null;
      meta.mockSection = 'overview';
      return { data, meta };
    }
    case 'valuation': {
      const snapshot = computeValuationSnapshot(record, symbol);
      meta.mockSection = 'valuation';
      return { data: snapshot, meta };
    }
    case 'eod':
    default: {
      const data = sliceLimit(record?.eod, limit, { fromEnd: true });
      meta.mockSection = 'eod';
      return { data, meta };
    }
  }
}

function createMeta({
  record,
  symbol,
  params,
  kind,
  extraMeta = {},
  context = {},
}) {
  const meta = {
    source: 'mock',
    reason: 'local_mock_fallback',
    fallback: 'mock-file',
    kind,
    requestedKind: params?.kind || kind,
    mockSymbol: record?.symbol || symbol,
    mockSource: `file:${record?.symbol ? record.symbol : symbol}`,
    tokenPreview: '',
    chosenKey: '',
    ...extraMeta,
  };

  if (context?.error?.message) {
    meta.message = context.error.message;
  } else if (context?.message) {
    meta.message = context.message;
  }
  if (Number.isFinite(context?.status)) {
    meta.status = context.status;
  }
  return meta;
}

export async function loadMockTiingo(params = {}, context = {}) {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return null;
  }

  const requestedSymbol = String(params?.symbol || '').trim().toUpperCase();
  const symbolAttempts = [requestedSymbol, FALLBACK_SYMBOL].filter(Boolean);
  if (!symbolAttempts.length) symbolAttempts.push(FALLBACK_SYMBOL);
  const kind = normaliseKind(params?.kind);

  for (const attempt of symbolAttempts) {
    const record = await loadMockRecord(attempt);
    if (!record) continue;
    const extracted = extractFromRecord(record, kind, params);
    if (!extracted) continue;
    const { data, meta: extraMeta } = extracted;
    if (data === null || (Array.isArray(data) && data.length === 0 && kind !== 'intraday_latest')) {
      continue;
    }
    const symbol = record.symbol || requestedSymbol || attempt;
    const warning = DEFAULT_WARNING;
    const meta = createMeta({ record, symbol: attempt, params, kind, extraMeta, context });
    const body = { symbol, data, warning, meta };
    console.warn(`[tiingo] ${symbol}(${kind}): using bundled mock data (${meta.reason}) [${meta.mockSource}]`);
    return {
      body,
      data,
      symbol,
      warning,
      meta,
    };
  }

  return null;
}

export function __clearMockTiingoCache() {
  mockCache.clear();
}

export default loadMockTiingo;
