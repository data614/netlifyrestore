export async function handler(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { symbol, kind } = event.queryStringParameters || {};
  const token = process.env.TIINGO_KEY;

  if (!symbol) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing symbol parameter' })
    };
  }

  if (!token) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'TIINGO_KEY not configured' })
    };
  }

  try {
    let url;
    let data;

    switch (kind) {
      case 'intraday_latest':
        // Get latest price data
        url = `https://api.tiingo.com/iex?tickers=${symbol}&token=${token}`;
        const response = await fetch(url);
        const rawData = await response.json();
        
        if (!response.ok) {
          throw new Error(`Tiingo API error: ${response.status}`);
        }

        const quote = Array.isArray(rawData) ? rawData[0] : rawData;
        if (!quote) {
          throw new Error('No data returned from Tiingo');
        }

        data = {
          symbol: symbol.toUpperCase(),
          price: quote.last || quote.tngoLast || 0,
          previousClose: quote.prevClose || 0,
          change: (quote.last || 0) - (quote.prevClose || 0),
          changePercent: quote.prevClose ? ((quote.last - quote.prevClose) / quote.prevClose * 100) : 0,
          volume: quote.volume || 0,
          timestamp: quote.timestamp || new Date().toISOString()
        };
        break;

      case 'intraday':
        // Get intraday chart data
        const interval = event.queryStringParameters?.interval || '5min';
        const limit = Math.min(parseInt(event.queryStringParameters?.limit) || 150, 300);
        
        // Get data for last trading day
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        
        url = `https://api.tiingo.com/iex/${symbol}/prices?startDate=${startDate.toISOString().split('T')[0]}&resampleFreq=${interval}&token=${token}`;
        const chartResponse = await fetch(url);
        const chartData = await chartResponse.json();
        
        if (!chartResponse.ok) {
          throw new Error(`Tiingo API error: ${chartResponse.status}`);
        }

        data = Array.isArray(chartData) ? chartData.slice(-limit).map(item => ({
          timestamp: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume
        })) : [];
        break;

      case 'eod':
        // Get EOD (End of Day) historical data  
        const eodLimit = Math.min(parseInt(event.queryStringParameters?.limit) || 180, 365);
        url = `https://api.tiingo.com/tiingo/daily/${symbol}/prices?token=${token}&startDate=${new Date(Date.now() - eodLimit * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`;
        const eodResponse = await fetch(url);
        const eodData = await eodResponse.json();
        
        if (!eodResponse.ok) {
          throw new Error(`Tiingo API error: ${eodResponse.status}`);
        }

        data = Array.isArray(eodData) ? eodData.slice(-eodLimit).map(item => ({
          date: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
          adjClose: item.adjClose
        })) : [];
        break;

      case 'news':
        // For now, return empty array as news endpoint is different
        data = [];
        break;

      case 'statements':
      case 'filings': 
      case 'actions':
      case 'documents':
        // Return empty arrays for unsupported document endpoints
        data = [];
        break;

      default:
        // Return mock data for unsupported endpoints
        data = { message: `${kind} data not yet implemented`, symbol };
    }

    const responseData = {
      symbol: symbol.toUpperCase(),
      data: kind === 'intraday_latest' ? [data] : data,
      meta: {
        source: 'live',
        timestamp: new Date().toISOString(),
        kind
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('Tiingo API error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        symbol,
        kind,
        timestamp: new Date().toISOString()
      })
    };
  }
}

// Add stub exports for backward compatibility with other functions
export async function loadEod(symbol, options = {}) {
  // Stub implementation for EOD data
  return { symbol, data: [], source: 'stub' };
}

export async function loadNews(symbol, options = {}) {
  // Stub implementation for news data
  return { symbol, data: [], source: 'stub' };
}

export async function loadDocuments(symbol, options = {}) {
  // Stub implementation for documents
  return { symbol, data: [], source: 'stub' };
}

export async function loadActions(symbol, options = {}) {
  // Stub implementation for actions
  return { symbol, data: [], source: 'stub' };
}

export async function loadFundamentals(symbol, options = {}) {
  // Stub implementation for fundamentals
  return { symbol, data: [], source: 'stub' };
}

export async function loadIntradayLatest(symbol, options = {}) {
  // Intraday latest data
  try {
    const token = process.env.TIINGO_KEY;
    const url = `https://api.tiingo.com/iex?tickers=${symbol}&token=${token}`;
    const response = await fetch(url);
    const rawData = await response.json();
    
    if (!response.ok) {
      throw new Error(`Tiingo API error: ${response.status}`);
    }

    const quote = Array.isArray(rawData) ? rawData[0] : rawData;
    return {
      symbol: symbol.toUpperCase(),
      data: {
        price: quote.last || quote.tngoLast || 0,
        previousClose: quote.prevClose || 0,
        change: (quote.last || 0) - (quote.prevClose || 0),
        changePercent: quote.prevClose ? ((quote.last - quote.prevClose) / quote.prevClose * 100) : 0,
        volume: quote.volume || 0,
        timestamp: quote.timestamp || new Date().toISOString()
      },
      source: 'live'
    };
  } catch (error) {
    console.error('loadIntradayLatest error:', error);
    return { symbol, data: null, error: error.message, source: 'error' };
  }
}

// Default export for the main handler
export default handler;