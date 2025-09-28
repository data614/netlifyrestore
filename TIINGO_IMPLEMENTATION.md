# Tiingo API Implementation Guide

This document provides a comprehensive guide to the Tiingo API implementation in this project, including multiple approaches for accessing financial data.

## Overview

The project includes several Tiingo API implementations:

1. **Netlify Function** (`netlify/functions/tiingo-data.js`) - Production serverless function
2. **Simple Client** (`simple-tiingo.js`) - Basic direct API access
3. **Enhanced Client** (`tiingo-client.js`) - Full-featured client with caching and rate limiting
4. **Test Scripts** - Various testing utilities

## API Key Configuration

The Tiingo API key can be configured using any of these environment variables (in order of preference):

```bash
TIINGO_KEY=your_api_key_here
TIINGO_API_KEY=your_api_key_here  
TIINGO_TOKEN=your_api_key_here
TIINGO_ACCESS_TOKEN=your_api_key_here
REACT_APP_TIINGO_KEY=your_api_key_here
REACT_APP_TIINGO_TOKEN=your_api_key_here
TIINGO_ACCESS_KEY=your_api_key_here
TIINGO_AUTH_TOKEN=your_api_key_here
```

Add your API key to the `.env` file:
```bash
TIINGO_KEY=aab69a760ed80b5c6c84a5a6f5e76423b3828b90
```

## Implementation Options

### 1. Netlify Function (Production)

**File:** `netlify/functions/tiingo-data.js`

This is the main production implementation that handles:
- Multiple data types (EOD, intraday, news, fundamentals, etc.)
- Fallback to mock data when API is unavailable
- Caching with appropriate TTL
- Error handling and logging
- CORS headers

**Usage via REST API:**
```
GET /api/tiingo?symbol=AAPL&kind=eod&limit=30
GET /api/tiingo?symbol=AAPL&kind=intraday&interval=5min
GET /api/tiingo?symbol=AAPL&kind=news&limit=10
```

**Supported Parameters:**
- `symbol` - Stock ticker symbol (required)
- `kind` - Data type: `eod`, `intraday`, `news`, `fundamentals`, `actions`, `overview`, `statements`, `valuation`
- `limit` - Number of results to return
- `interval` - For intraday data: `1min`, `5min`, `30min`, `1hour`

### 2. Simple Direct Client

**File:** `simple-tiingo.js`

A straightforward implementation for direct API access:

```javascript
import { getEndOfDayPrices, getLatestPrice, getCompanyNews } from './simple-tiingo.js';

// Get historical prices
const prices = await getEndOfDayPrices('AAPL', { limit: 30 });

// Get latest quote
const quote = await getLatestPrice('AAPL');

// Get company news
const news = await getCompanyNews('AAPL', { limit: 10 });
```

**CLI Usage:**
```bash
node simple-tiingo.js AAPL eod        # End of day prices
node simple-tiingo.js AAPL latest     # Latest quote
node simple-tiingo.js AAPL news       # Company news
node simple-tiingo.js AAPL intraday   # Intraday prices
```

### 3. Enhanced Client (Recommended)

**File:** `tiingo-client.js`

Full-featured client with advanced capabilities:

```javascript
import { TiingoClient, tiingo } from './tiingo-client.js';

// Using default client
const quote = await tiingo.getLatestQuote('AAPL');
const prices = await tiingo.getStockPrices('AAPL', { limit: 30 });
const news = await tiingo.getNews({ tickers: 'AAPL', limit: 10 });

// Using custom client instance
const client = new TiingoClient({
  apiKey: 'your-key',
  enableCache: true,
  cacheTtl: 60000,
  maxRequestsPerMinute: 200
});

const data = await client.getStockPrices('AAPL');
```

**Features:**
- ✅ Built-in caching with TTL
- ✅ Rate limiting (token bucket algorithm)
- ✅ Automatic retries with exponential backoff
- ✅ Request timeout handling
- ✅ Comprehensive error handling
- ✅ Support for all Tiingo endpoints
- ✅ TypeScript-friendly

## Available Data Types

### Stock Data
- **End of Day Prices**: Historical daily prices
- **Intraday Prices**: Real-time/recent intraday data
- **Latest Quotes**: Current market data
- **Stock Metadata**: Company information and trading details

### Fundamental Data
- **Company Overview**: Business description, sector, industry
- **Financial Statements**: Income, balance sheet, cash flow
- **Key Metrics**: Ratios, growth rates, valuation metrics
- **Corporate Actions**: Dividends, stock splits

### Market Data  
- **Company News**: Latest news articles
- **SEC Filings**: Regulatory documents
- **Market Events**: Earnings, announcements

### Other Assets
- **Cryptocurrency**: Crypto prices and metadata
- **Forex**: Foreign exchange rates
- **Mutual Funds**: Fund prices and information

## Error Handling

All implementations include comprehensive error handling:

```javascript
try {
  const data = await tiingo.getStockPrices('AAPL');
} catch (error) {
  if (error.message.includes('401')) {
    console.error('Invalid API key');
  } else if (error.message.includes('429')) {
    console.error('Rate limit exceeded');
  } else {
    console.error('API error:', error.message);
  }
}
```

## Rate Limits

Tiingo API has the following limits:
- **Free Tier**: 200 requests per hour
- **Paid Tiers**: Higher limits based on subscription

The enhanced client automatically handles rate limiting.

## Caching Strategy

Different data types use appropriate cache TTL:

| Data Type | TTL | Reason |
|-----------|-----|---------|
| Latest Quote | 15s | Real-time data |
| Intraday | 30s | Frequent updates during market hours |
| End of Day | 5min | Daily data, stable after market close |
| News | 3min | Relatively stable, occasional updates |
| Fundamentals | 1hr | Quarterly/annual data |
| Metadata | 1hr | Rarely changes |

## Testing

Multiple test scripts are available:

```bash
# Test basic functionality
node simple-tiingo.js AAPL eod

# Test enhanced client
node simple-test-client.js

# Test Netlify function locally (requires netlify dev)
node test-tiingo.js

# Test specific run
node run-tiingo.mjs
```

## Frontend Integration

The frontend uses the Netlify function through the API:

```javascript
// From app.js
const response = await fetch('/api/tiingo?symbol=AAPL&kind=eod');
const data = await response.json();

// From professional/api-client.js  
import { fetchPriceHistory, fetchLatestQuote } from './api-client.js';

const prices = await fetchPriceHistory('AAPL', '6M');
const quote = await fetchLatestQuote('AAPL');
```

## Environment Setup

1. **Install Dependencies**: No additional packages required (uses native Node.js fetch)

2. **Set API Key**: Add to `.env` file
   ```bash
   TIINGO_KEY=your_api_key_here
   ```

3. **Test Connection**:
   ```bash
   node simple-test-client.js
   ```

## Production Deployment

The Netlify function automatically deploys with your site:

1. Environment variables are configured in Netlify dashboard
2. Functions are deployed to `/.netlify/functions/`
3. API routes via `_redirects`: `/api/tiingo -> /.netlify/functions/tiingo`

## Best Practices

1. **Use appropriate caching** - Don't request real-time data more than necessary
2. **Handle errors gracefully** - Always provide fallback data or user feedback
3. **Respect rate limits** - Use the enhanced client for automatic rate limiting
4. **Monitor API usage** - Check your Tiingo dashboard regularly
5. **Use mock data for development** - The function provides sample data when API is unavailable

## Examples

### Get Stock Price History
```javascript
import { tiingo } from './tiingo-client.js';

const prices = await tiingo.getStockPrices('AAPL', {
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  resampleFreq: 'daily'
});

prices.forEach(price => {
  console.log(`${price.date}: $${price.close}`);
});
```

### Get Latest Market Data
```javascript
const quote = await tiingo.getLatestQuote('AAPL');
console.log(`AAPL: $${quote.tngoLast} (${quote.prevClose})`);
```

### Get Company News
```javascript
const news = await tiingo.getNews({
  tickers: ['AAPL', 'MSFT', 'GOOGL'],
  limit: 20,
  sortBy: 'publishedDate'
});

news.forEach(article => {
  console.log(`${article.title} - ${article.source}`);
});
```

### Custom Client Configuration
```javascript
const client = new TiingoClient({
  timeout: 5000,           // 5 second timeout
  maxRetries: 2,           // 2 retry attempts  
  enableCache: true,       // Enable caching
  cacheTtl: 120000,       // 2 minute cache
  maxRequestsPerMinute: 100 // Lower rate limit
});
```

## Troubleshooting

### Common Issues

1. **"API key not found"**
   - Check `.env` file exists and has `TIINGO_KEY=your_key`
   - Verify environment variables are loaded correctly

2. **"Rate limit exceeded"** 
   - Use the enhanced client with rate limiting
   - Consider upgrading your Tiingo plan

3. **"Connection timeout"**
   - Check internet connection
   - Increase timeout in client options

4. **"Invalid symbol"**
   - Verify ticker symbol is correct
   - Some symbols may not be available in your plan

### Debug Mode

Enable debug logging:
```javascript
const client = new TiingoClient({ debug: true });
```

This will log all API requests and cache operations.

## Support

For issues with:
- **Tiingo API**: Check [Tiingo Documentation](https://api.tiingo.com/documentation)
- **This Implementation**: Review test scripts and error messages
- **Netlify Functions**: Check Netlify function logs in dashboard