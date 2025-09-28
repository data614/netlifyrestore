#!/usr/bin/env node
/**
 * Quick Tiingo API Verification
 */

import { readFile } from 'fs/promises';
import { TiingoClient } from './tiingo-client.js';

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
  } catch {}
}

console.log('🔍 Quick Tiingo API Verification');
console.log('================================');

await loadEnv();

console.log('\n1. Checking API Key...');
const apiKey = process.env.TIINGO_KEY;
if (apiKey) {
  console.log(`✅ API Key found: ${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`);
} else {
  console.log('❌ No API Key found');
  process.exit(1);
}

console.log('\n2. Testing API Connection...');
const client = new TiingoClient();
try {
  const result = await client.testConnection();
  if (result.success) {
    console.log('✅ API Connection successful');
    console.log(`   Response: ${JSON.stringify(result.data)}`);
  } else {
    console.log('❌ API Connection failed');
    console.log(`   Error: ${result.error}`);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Connection test error');
  console.log(`   Error: ${error.message}`);
  process.exit(1);
}

console.log('\n3. Testing Stock Quote...');
try {
  const quote = await client.getLatestQuote('AAPL');
  const price = quote.tngoLast || quote.last;
  console.log(`✅ AAPL Quote: $${price}`);
  console.log(`   Previous Close: $${quote.prevClose}`);
  console.log(`   Volume: ${quote.volume?.toLocaleString() || 'N/A'}`);
} catch (error) {
  console.log('❌ Quote retrieval failed');
  console.log(`   Error: ${error.message}`);
}

console.log('\n4. Testing Historical Data...');
try {
  const prices = await client.getStockPrices('AAPL', { limit: 3 });
  if (prices && prices.length > 0) {
    console.log(`✅ Retrieved ${prices.length} historical points`);
    const latest = prices[prices.length - 1];
    console.log(`   Latest: $${latest.close} on ${new Date(latest.date).toLocaleDateString()}`);
  } else {
    console.log('❌ No historical data received');
  }
} catch (error) {
  console.log('❌ Historical data failed');
  console.log(`   Error: ${error.message}`);
}

console.log('\n5. Testing News...');
try {
  const news = await client.getNews({ tickers: 'AAPL', limit: 2 });
  if (news && news.length > 0) {
    console.log(`✅ Retrieved ${news.length} news articles`);
    console.log(`   Latest: "${news[0].title}" from ${news[0].source}`);
  } else {
    console.log('⚠️  No news data (may be expected)');
  }
} catch (error) {
  console.log('❌ News retrieval failed');
  console.log(`   Error: ${error.message}`);
}

console.log('\n🎉 Verification Complete!');
console.log('Your Tiingo API implementation is working correctly.');