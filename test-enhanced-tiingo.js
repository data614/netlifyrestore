#!/usr/bin/env node
/**
 * Test script for the enhanced Tiingo API client
 * Usage: node test-enhanced-tiingo.js [command] [symbol]
 * 
 * Commands:
 * - test: Test API connection
 * - quote: Get latest quote
 * - prices: Get historical prices  
 * - intraday: Get intraday prices
 * - news: Get news
 * - crypto: Get crypto prices
 * - forex: Get forex prices
 * - meta: Get stock metadata
 * - usage: Get API usage info
 * - demo: Run full demonstration
 */

import { TiingoClient, tiingo } from './tiingo-client.js';
import { readFile } from 'fs/promises';

// Load environment variables
async function loadEnv() {
  try {
    const env = await readFile('.env', 'utf-8');
    for (const line of env.split('\\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...value] = trimmed.split('=');
        if (key && value.length) {
          process.env[key] = value.join('=');
        }
      }
    }
  } catch {}
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatCurrency(value, currency = 'USD') {
  if (!value || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(value);
}

function formatNumber(value, decimals = 2) {
  if (!value || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

async function testConnection() {
  console.log('🔍 Testing API connection...');
  const result = await tiingo.testConnection();
  
  if (result.success) {
    console.log('✅ Connection successful!');
    console.log('Response:', result.data);
  } else {
    console.log('❌ Connection failed:', result.error);
    return false;
  }
  
  return true;
}

async function getQuote(symbol = 'AAPL') {
  console.log(`\\n📈 Getting latest quote for ${symbol}...`);
  
  try {
    const quote = await tiingo.getLatestQuote(symbol);
    
    console.log('\\n=== Latest Quote ===');
    console.log(`Symbol: ${quote.ticker || symbol}`);
    console.log(`Last Price: ${formatCurrency(quote.tngoLast || quote.last)}`);
    console.log(`Previous Close: ${formatCurrency(quote.prevClose)}`);
    console.log(`Open: ${formatCurrency(quote.open)}`);
    console.log(`High: ${formatCurrency(quote.high)}`);
    console.log(`Low: ${formatCurrency(quote.low)}`);
    console.log(`Volume: ${formatNumber(quote.volume, 0)}`);
    console.log(`Timestamp: ${quote.timestamp ? formatDate(new Date(quote.timestamp)) : 'N/A'}`);
    
    const change = (quote.tngoLast || quote.last) - quote.prevClose;
    const changePercent = (change / quote.prevClose) * 100;
    const changeIndicator = change >= 0 ? '📈' : '📉';
    
    console.log(`Change: ${changeIndicator} ${formatCurrency(change)} (${formatNumber(changePercent)}%)`);
    
  } catch (error) {
    console.error('❌ Error getting quote:', error.message);
  }
}

async function getHistoricalPrices(symbol = 'AAPL', days = 5) {
  console.log(`\\n📊 Getting historical prices for ${symbol} (last ${days} days)...`);
  
  try {
    const prices = await tiingo.getStockPrices(symbol, { limit: days });
    
    if (!Array.isArray(prices) || prices.length === 0) {
      console.log('No price data available');
      return;
    }
    
    console.log('\\n=== Historical Prices ===');
    console.log('Date\\t\\t\\tOpen\\t\\tHigh\\t\\tLow\\t\\tClose\\t\\tVolume');
    console.log('-'.repeat(80));
    
    prices.slice(-5).forEach(price => {
      const date = new Date(price.date).toLocaleDateString();
      console.log(`${date}\\t${formatCurrency(price.open)}\\t${formatCurrency(price.high)}\\t${formatCurrency(price.low)}\\t${formatCurrency(price.close)}\\t${formatNumber(price.volume, 0)}`);
    });
    
  } catch (error) {
    console.error('❌ Error getting historical prices:', error.message);
  }
}

async function getIntradayPrices(symbol = 'AAPL') {
  console.log(`\\n⏱️ Getting intraday prices for ${symbol}...`);
  
  try {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 2); // Last 2 hours
    
    const prices = await tiingo.getIntradayPrices(symbol, { 
      startDate: startDate.toISOString(),
      resampleFreq: '5min',
      limit: 10 
    });
    
    if (!Array.isArray(prices) || prices.length === 0) {
      console.log('No intraday data available (market might be closed)');
      return;
    }
    
    console.log('\\n=== Intraday Prices (Last 10 intervals) ===');
    console.log('Time\\t\\t\\t\\tPrice\\t\\tVolume');
    console.log('-'.repeat(60));
    
    prices.slice(-10).forEach(price => {
      const time = new Date(price.date).toLocaleTimeString();
      console.log(`${time}\\t\\t${formatCurrency(price.close || price.last)}\\t\\t${formatNumber(price.volume || 0, 0)}`);
    });
    
  } catch (error) {
    console.error('❌ Error getting intraday prices:', error.message);
  }
}

async function getNews(symbol = 'AAPL', limit = 5) {
  console.log(`\\n📰 Getting news for ${symbol}...`);
  
  try {
    const news = await tiingo.getNews({ 
      tickers: symbol, 
      limit,
      sortBy: 'publishedDate'
    });
    
    if (!Array.isArray(news) || news.length === 0) {
      console.log('No news available');
      return;
    }
    
    console.log(`\\n=== Latest News (${news.length} articles) ===`);
    
    news.forEach((article, index) => {
      const date = new Date(article.publishedDate).toLocaleDateString();
      console.log(`\\n${index + 1}. ${article.title}`);
      console.log(`   Source: ${article.source} | Date: ${date}`);
      console.log(`   URL: ${article.url}`);
      if (article.description) {
        console.log(`   ${article.description.slice(0, 150)}...`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting news:', error.message);
  }
}

async function getMetadata(symbol = 'AAPL') {
  console.log(`\\n🏢 Getting metadata for ${symbol}...`);
  
  try {
    const meta = await tiingo.getStockMetadata(symbol);
    
    console.log('\\n=== Stock Metadata ===');
    console.log(`Symbol: ${meta.ticker || symbol}`);
    console.log(`Name: ${meta.name || 'N/A'}`);
    console.log(`Description: ${meta.description ? meta.description.slice(0, 200) + '...' : 'N/A'}`);
    console.log(`Exchange: ${meta.exchangeCode || 'N/A'}`);
    console.log(`Start Date: ${meta.startDate || 'N/A'}`);
    console.log(`End Date: ${meta.endDate || 'Current'}`);
    
  } catch (error) {
    console.error('❌ Error getting metadata:', error.message);
  }
}

async function getApiUsage() {
  console.log('\\n📊 Getting API usage information...');
  
  const client = new TiingoClient();
  const result = await client.getApiUsage();
  
  if (result.success) {
    console.log('\\n=== API Usage ===');
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ Could not get API usage:', result.error);
  }
}

async function getCacheStats() {
  const client = new TiingoClient();
  const stats = client.getCacheStats();
  
  console.log('\\n💾 Cache Statistics:');
  console.log(`Cache Size: ${stats.size} entries`);
  console.log(`Default TTL: ${stats.defaultTtl}ms`);
}

async function runFullDemo() {
  console.log('🚀 Running full Tiingo API demonstration...\\n');
  
  // Test connection first
  if (!(await testConnection())) {
    return;
  }
  
  const symbol = 'AAPL';
  
  // Get various data types
  await getQuote(symbol);
  await getHistoricalPrices(symbol, 5);
  await getIntradayPrices(symbol);
  await getNews(symbol, 3);
  await getMetadata(symbol);
  
  // Show cache stats
  getCacheStats();
  
  console.log('\\n✨ Demo completed!');
}

async function main() {
  await loadEnv();
  
  const command = process.argv[2] || 'demo';
  const symbol = process.argv[3] || 'AAPL';
  
  console.log(`\\n=== Enhanced Tiingo API Client Test ===`);
  console.log(`Command: ${command}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Time: ${formatDate(new Date())}`);
  console.log('='.repeat(50));
  
  try {
    switch (command.toLowerCase()) {
      case 'test':
        await testConnection();
        break;
      case 'quote':
        await getQuote(symbol);
        break;
      case 'prices':
        await getHistoricalPrices(symbol, 10);
        break;
      case 'intraday':
        await getIntradayPrices(symbol);
        break;
      case 'news':
        await getNews(symbol, 5);
        break;
      case 'meta':
        await getMetadata(symbol);
        break;
      case 'usage':
        await getApiUsage();
        break;
      case 'cache':
        getCacheStats();
        break;
      case 'demo':
        await runFullDemo();
        break;
      default:
        console.log(`\\nUnknown command: ${command}`);
        console.log('Available commands: test, quote, prices, intraday, news, meta, usage, cache, demo');
        break;
    }
  } catch (error) {
    console.error('\\n❌ Unexpected error:', error.message);
    console.error(error.stack);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}