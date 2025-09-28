#!/usr/bin/env node
/**
 * Comprehensive Tiingo API Usage Examples
 * 
 * This script demonstrates all the capabilities of the Tiingo API implementation
 * including various data types, error handling, and best practices.
 */

import { readFile } from 'fs/promises';
import { TiingoClient } from './tiingo-client.js';

// Load environment variables
async function loadEnv() {
  try {
    const env = await readFile('.env', 'utf-8');
    for (const line of env.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...value] = trimmed.split('=');
        if (key && value.length) {
          process.env[key] = value.join('=');
        }
      }
    }
  } catch (error) {
    console.warn('Could not load .env file:', error.message);
  }
}

// Utility functions for formatting
const formatCurrency = (value) => 
  value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) : 'N/A';

const formatNumber = (value, decimals = 0) =>
  value ? new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(value) : 'N/A';

const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString() : 'N/A';

// Example 1: Basic Stock Data
async function example1_BasicStockData(client) {
  console.log('\n📈 Example 1: Basic Stock Data');
  console.log('='.repeat(50));
  
  const symbol = 'AAPL';
  
  try {
    // Get latest quote
    const quote = await client.getLatestQuote(symbol);
    console.log(`\n${symbol} Latest Quote:`);
    console.log(`Price: ${formatCurrency(quote.tngoLast || quote.last)}`);
    console.log(`Previous Close: ${formatCurrency(quote.prevClose)}`);
    console.log(`Volume: ${formatNumber(quote.volume)}`);
    
    // Get historical prices
    const prices = await client.getStockPrices(symbol, { limit: 5 });
    console.log(`\n${symbol} Recent Prices:`);
    prices.forEach((price, i) => {
      console.log(`${formatDate(price.date)}: ${formatCurrency(price.close)} (Vol: ${formatNumber(price.volume)})`);
    });
    
  } catch (error) {
    console.error('Error in Example 1:', error.message);
  }
}

// Example 2: Real-time Intraday Data
async function example2_IntradayData(client) {
  console.log('\n⏱️ Example 2: Intraday Data');
  console.log('='.repeat(50));
  
  const symbol = 'MSFT';
  
  try {
    // Get recent intraday data
    const intradayData = await client.getIntradayPrices(symbol, {
      resampleFreq: '5min',
      limit: 10
    });
    
    if (intradayData && intradayData.length > 0) {
      console.log(`\n${symbol} Intraday Data (5-minute intervals):`);
      intradayData.forEach(data => {
        const time = new Date(data.date).toLocaleTimeString();
        console.log(`${time}: ${formatCurrency(data.close)} (Vol: ${formatNumber(data.volume)})`);
      });
    } else {
      console.log('No intraday data available (market may be closed)');
    }
    
  } catch (error) {
    console.error('Error in Example 2:', error.message);
  }
}

// Example 3: Company News and Sentiment
async function example3_NewsData(client) {
  console.log('\n📰 Example 3: Company News');
  console.log('='.repeat(50));
  
  try {
    const news = await client.getNews({
      tickers: ['AAPL', 'GOOGL'],
      limit: 5,
      sortBy: 'publishedDate'
    });
    
    if (news && news.length > 0) {
      console.log('\nLatest Market News:');
      news.forEach((article, i) => {
        console.log(`\n${i + 1}. ${article.title}`);
        console.log(`   Source: ${article.source} | Date: ${formatDate(article.publishedDate)}`);
        if (article.description) {
          console.log(`   ${article.description.slice(0, 120)}...`);
        }
        console.log(`   URL: ${article.url}`);
      });
    } else {
      console.log('No news data available');
    }
    
  } catch (error) {
    console.error('Error in Example 3:', error.message);
  }
}

// Example 4: Stock Metadata and Company Info
async function example4_CompanyMetadata(client) {
  console.log('\n🏢 Example 4: Company Metadata');
  console.log('='.repeat(50));
  
  const symbols = ['AAPL', 'TSLA', 'NVDA'];
  
  for (const symbol of symbols) {
    try {
      const metadata = await client.getStockMetadata(symbol);
      
      console.log(`\n${symbol} - ${metadata.name || 'N/A'}`);
      console.log(`Description: ${metadata.description ? metadata.description.slice(0, 150) + '...' : 'N/A'}`);
      console.log(`Exchange: ${metadata.exchangeCode || 'N/A'}`);
      console.log(`Trading Since: ${formatDate(metadata.startDate)}`);
      
    } catch (error) {
      console.error(`Error getting metadata for ${symbol}:`, error.message);
    }
  }
}

// Example 5: Portfolio Analysis
async function example5_PortfolioAnalysis(client) {
  console.log('\n💼 Example 5: Portfolio Analysis');
  console.log('='.repeat(50));
  
  const portfolio = [
    { symbol: 'AAPL', shares: 100 },
    { symbol: 'MSFT', shares: 50 },
    { symbol: 'GOOGL', shares: 25 }
  ];
  
  let totalValue = 0;
  const positions = [];
  
  console.log('\nPortfolio Positions:');
  console.log('Symbol\tShares\tPrice\t\tValue\t\tChange%');
  console.log('-'.repeat(60));
  
  for (const position of portfolio) {
    try {
      const quote = await client.getLatestQuote(position.symbol);
      const currentPrice = quote.tngoLast || quote.last || 0;
      const previousPrice = quote.prevClose || 0;
      const value = position.shares * currentPrice;
      const changePercent = previousPrice ? ((currentPrice - previousPrice) / previousPrice * 100) : 0;
      
      totalValue += value;
      positions.push({
        ...position,
        currentPrice,
        value,
        changePercent
      });
      
      const changeIndicator = changePercent >= 0 ? '+' : '';
      console.log(`${position.symbol}\t${position.shares}\t${formatCurrency(currentPrice)}\t${formatCurrency(value)}\t${changeIndicator}${changePercent.toFixed(2)}%`);
      
    } catch (error) {
      console.error(`Error analyzing ${position.symbol}:`, error.message);
    }
  }
  
  console.log('-'.repeat(60));
  console.log(`Total Portfolio Value: ${formatCurrency(totalValue)}`);
}

// Example 6: Market Comparison
async function example6_MarketComparison(client) {
  console.log('\n📊 Example 6: Market Comparison');
  console.log('='.repeat(50));
  
  const techStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
  const comparisons = [];
  
  console.log('\nTech Stock Comparison:');
  console.log('Symbol\tPrice\t\tChange\t\tChange%\t\tVolume');
  console.log('-'.repeat(70));
  
  for (const symbol of techStocks) {
    try {
      const quote = await client.getLatestQuote(symbol);
      const currentPrice = quote.tngoLast || quote.last || 0;
      const previousPrice = quote.prevClose || 0;
      const change = currentPrice - previousPrice;
      const changePercent = previousPrice ? (change / previousPrice * 100) : 0;
      
      comparisons.push({
        symbol,
        currentPrice,
        change,
        changePercent,
        volume: quote.volume || 0
      });
      
      const changeStr = change >= 0 ? `+${formatCurrency(change)}` : formatCurrency(change);
      const changePercentStr = changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
      
      console.log(`${symbol}\t${formatCurrency(currentPrice)}\t${changeStr}\t${changePercentStr}\t\t${formatNumber(quote.volume)}`);
      
    } catch (error) {
      console.error(`Error comparing ${symbol}:`, error.message);
    }
  }
  
  // Find best and worst performers
  if (comparisons.length > 0) {
    const bestPerformer = comparisons.reduce((best, stock) => 
      stock.changePercent > best.changePercent ? stock : best
    );
    const worstPerformer = comparisons.reduce((worst, stock) => 
      stock.changePercent < worst.changePercent ? stock : worst
    );
    
    console.log('\n📈 Best Performer:', `${bestPerformer.symbol} (+${bestPerformer.changePercent.toFixed(2)}%)`);
    console.log('📉 Worst Performer:', `${worstPerformer.symbol} (${worstPerformer.changePercent.toFixed(2)}%)`);
  }
}

// Example 7: Error Handling and Resilience
async function example7_ErrorHandling(client) {
  console.log('\n🛡️ Example 7: Error Handling');
  console.log('='.repeat(50));
  
  const testSymbols = ['AAPL', 'INVALID_SYMBOL', 'MSFT', ''];
  
  for (const symbol of testSymbols) {
    try {
      if (!symbol) {
        console.log('\nTesting empty symbol...');
        await client.getLatestQuote('');
      } else {
        console.log(`\nTesting symbol: ${symbol}`);
        const quote = await client.getLatestQuote(symbol);
        console.log(`✅ Success: ${symbol} = ${formatCurrency(quote.tngoLast || quote.last)}`);
      }
    } catch (error) {
      if (symbol === 'INVALID_SYMBOL' || symbol === '') {
        console.log(`❌ Expected error for "${symbol}": ${error.message}`);
      } else {
        console.log(`❌ Unexpected error for ${symbol}: ${error.message}`);
      }
    }
  }
}

// Example 8: Caching and Performance
async function example8_CachingPerformance(client) {
  console.log('\n🚀 Example 8: Caching Performance');
  console.log('='.repeat(50));
  
  const symbol = 'AAPL';
  
  // First request (cache miss)
  console.log('\n1st request (cache miss):');
  const start1 = Date.now();
  await client.getLatestQuote(symbol);
  const time1 = Date.now() - start1;
  console.log(`Time taken: ${time1}ms`);
  
  // Second request (cache hit)
  console.log('\n2nd request (cache hit):');
  const start2 = Date.now();
  await client.getLatestQuote(symbol);
  const time2 = Date.now() - start2;
  console.log(`Time taken: ${time2}ms`);
  
  console.log(`\nSpeed improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
  
  // Show cache stats
  const stats = client.getCacheStats();
  console.log(`\nCache Statistics:`);
  console.log(`- Entries: ${stats.size}`);
  console.log(`- Default TTL: ${stats.defaultTtl}ms`);
}

// Main execution
async function runAllExamples() {
  await loadEnv();
  
  console.log('🚀 Tiingo API Comprehensive Examples');
  console.log('====================================');
  console.log(`Start Time: ${new Date().toLocaleString()}`);
  
  // Create client with custom configuration
  const client = new TiingoClient({
    enableCache: true,
    cacheTtl: 60000,           // 1 minute cache
    timeout: 10000,            // 10 second timeout
    maxRetries: 2,             // 2 retries
    enableRateLimit: true,     // Enable rate limiting
    maxRequestsPerMinute: 200  // 200 requests per minute
  });
  
  // Test API connection first
  console.log('\n🔍 Testing API Connection...');
  const connectionTest = await client.testConnection();
  if (!connectionTest.success) {
    console.error('❌ API connection failed:', connectionTest.error);
    console.error('Please check your API key and internet connection.');
    return;
  }
  console.log('✅ API connection successful!');
  
  // Run all examples
  try {
    await example1_BasicStockData(client);
    await example2_IntradayData(client);
    await example3_NewsData(client);
    await example4_CompanyMetadata(client);
    await example5_PortfolioAnalysis(client);
    await example6_MarketComparison(client);
    await example7_ErrorHandling(client);
    await example8_CachingPerformance(client);
    
  } catch (error) {
    console.error('\n❌ Unexpected error during examples:', error.message);
  }
  
  console.log('\n✨ All examples completed!');
  console.log(`End Time: ${new Date().toLocaleString()}`);
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}