#!/usr/bin/env node
import fetch from 'node-fetch';

const symbol = process.argv[2] || 'AAPL';

const key = process.env.TIINGO_KEY
  || process.env.TIINGO_API_KEY
  || process.env.TIINGO_TOKEN;

if (!key) {
  console.error('❌ Missing TIINGO_KEY environment variable.');
  process.exit(1);
}

const redacted = key.length > 8 ? `${key.slice(0, 4)}…${key.slice(-4)}` : '[redacted]';
console.log(`🔐 Using Tiingo key: ${redacted}`);

const url = `https://api.tiingo.com/tiingo/daily/${encodeURIComponent(symbol)}`;
const res = await fetch(url, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${key}`,
  },
});

if (!res.ok) {
  console.error(`❌ Request failed (${res.status})`, await res.text());
  process.exit(1);
}

const data = await res.json();
console.log(`✅ Received response for ${symbol}:`, {
  ticker: data.ticker,
  name: data.name,
  exchange: data.exchangeCode,
});
