#!/usr/bin/env node
/**
 * Simple test of the Tiingo Client
 */

// Load environment variables
import { readFile } from 'fs/promises';

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

await loadEnv();

// Import the client
import { TiingoClient } from './tiingo-client.js';

async function test() {
  console.log('Creating Tiingo client...');
  const client = new TiingoClient();
  
  console.log('Testing connection...');
  const result = await client.testConnection();
  
  if (result.success) {
    console.log('✅ Connection successful!');
    console.log('Response:', result.data);
    
    console.log('\nTesting stock quote...');
    try {
      const quote = await client.getLatestQuote('AAPL');
      console.log('Quote data:', quote);
    } catch (error) {
      console.error('Quote error:', error.message);
    }
    
  } else {
    console.log('❌ Connection failed:', result.error);
  }
}

test().catch(console.error);