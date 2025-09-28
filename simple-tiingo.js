#!/usr/bin/env node
/**
 * Simple Tiingo API implementation that directly calls the Tiingo API
 * Usage: node simple-tiingo.js [SYMBOL] [KIND]
 * 
 * Examples:
 * node simple-tiingo.js AAPL eod
 * node simple-tiingo.js MSFT news
 * node simple-tiingo.js TSLA fundamentals
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
export async function loadEnvFile() {
  try {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const envPath = join(currentDir, '.env');
    const envContent = await readFile(envPath, 'utf-8');
    
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
        }
      }
    }
  } catch (error) {
    console.warn('Could not load .env file:', error.message);
  }
}

// Tiingo API configuration
const TIINGO_BASE_URL = 'https://api.tiingo.com';
const TIINGO_TOKEN_KEYS = [
  'TIINGO_KEY',
  'TIINGO_API_KEY', 
  'TIINGO_TOKEN',
  'TIINGO_ACCESS_TOKEN',
  'REACT_APP_TIINGO_KEY',
  'REACT_APP_TIINGO_TOKEN'
];

function getTiingoToken() {
  for (const key of TIINGO_TOKEN_KEYS) {
    const value = process.env[key];
    if (value && typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

async function callTiingoAPI(endpoint, params = {}) {
  const token = getTiingoToken();
  if (!token) {
    throw new Error('Tiingo API token not found. Please set TIINGO_KEY in your .env file.');
  }
  
  const url = new URL(endpoint, TIINGO_BASE_URL);
  url.searchParams.set('token', token);
  
  // Add other parameters
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }
  
  console.log(`Fetching: ${url.toString()}`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tiingo API error ${response.status}: ${errorText}`);
  }
  
  return response.json();
}

// API endpoint functions
export async function getEndOfDayPrices(symbol, options = {}) {
  const { limit = 30, startDate = null, endDate = null } = options;
  
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  params.resampleFreq = 'daily';
  
  const data = await callTiingoAPI(`/tiingo/daily/${encodeURIComponent(symbol)}/prices`, params);
  return Array.isArray(data) ? data.slice(-limit) : [];
}

export async function getIntradayPrices(symbol, options = {}) {
  const { interval = '5min', limit = 100, startDate = null, endDate = null } = options;
  
  const params = { resampleFreq: interval };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const data = await callTiingoAPI(`/iex/${encodeURIComponent(symbol)}/prices`, params);
  return Array.isArray(data) ? data.slice(-limit) : [];
}

export async function getLatestPrice(symbol) {
  const data = await callTiingoAPI(`/iex/${encodeURIComponent(symbol)}`);
  return Array.isArray(data) ? data[0] : data;
}

export async function getCompanyNews(symbol, options = {}) {
  const { limit = 20, startDate = null, endDate = null } = options;
  
  const params = {};
  if (limit) params.limit = limit;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const data = await callTiingoAPI(`/tiingo/news`, { ...params, tickers: symbol });
  return Array.isArray(data) ? data : [];
}

export async function getCompanyMeta(symbol) {
  const data = await callTiingoAPI(`/tiingo/daily/${encodeURIComponent(symbol)}`);
  return data;
}

export async function testConnection() {
  try {
    const data = await callTiingoAPI('/api/test');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// CLI interface
async function main() {
  await loadEnvFile();
  
  const args = process.argv.slice(2);
  const symbol = args[0] || 'AAPL';
  const kind = args[1] || 'eod';
  
  console.log(`\n=== Tiingo API Test ===`);
  console.log(`Symbol: ${symbol.toUpperCase()}`);
  console.log(`Kind: ${kind}`);
  
  // Test connection first
  console.log('\n1. Testing API connection...');
  const connectionTest = await testConnection();
  if (!connectionTest.success) {
    console.error('❌ Connection test failed:', connectionTest.error);
    process.exit(1);
  }
  console.log('✅ API connection successful:', connectionTest.data);
  
  try {
    let data;
    
    switch (kind.toLowerCase()) {
      case 'eod':
      case 'daily':
        console.log(`\n2. Fetching end-of-day prices for ${symbol}...`);
        data = await getEndOfDayPrices(symbol, { limit: 10 });
        break;
        
      case 'intraday':
        console.log(`\n2. Fetching intraday prices for ${symbol}...`);
        data = await getIntradayPrices(symbol, { limit: 10 });
        break;
        
      case 'latest':
      case 'quote':
        console.log(`\n2. Fetching latest price for ${symbol}...`);
        data = await getLatestPrice(symbol);
        break;
        
      case 'news':
        console.log(`\n2. Fetching company news for ${symbol}...`);
        data = await getCompanyNews(symbol, { limit: 5 });
        break;
        
      case 'meta':
      case 'info':
        console.log(`\n2. Fetching company metadata for ${symbol}...`);
        data = await getCompanyMeta(symbol);
        break;
        
      default:
        console.log(`\n2. Fetching end-of-day prices for ${symbol} (default)...`);
        data = await getEndOfDayPrices(symbol, { limit: 10 });
        break;
    }
    
    console.log('\n✅ Data retrieved successfully:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}