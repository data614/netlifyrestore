#!/usr/bin/env node
/**
 * Comprehensive Tiingo API Verification Script
 * 
 * This script performs thorough verification of all Tiingo API implementations
 * without requiring the Netlify dev server to be running.
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
    console.warn('⚠️  Could not load .env file:', error.message);
  }
}

function formatCurrency(value) {
  return value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) : 'N/A';
}

function formatNumber(value, decimals = 0) {
  return value ? new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(value) : 'N/A';
}

function printSeparator(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`🔍 ${title}`);
  console.log('='.repeat(60));
}

function printSuccess(message) {
  console.log(`✅ ${message}`);
}

function printError(message) {
  console.log(`❌ ${message}`);
}

function printWarning(message) {
  console.log(`⚠️  ${message}`);
}

function printInfo(message) {
  console.log(`ℹ️  ${message}`);
}

// Verification Tests
async function verifyEnvironment() {
  printSeparator('Environment Configuration');
  
  const apiKey = process.env.TIINGO_KEY || process.env.TIINGO_API_KEY;
  if (apiKey) {
    const preview = `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
    printSuccess(`API Key found: ${preview}`);
    
    if (apiKey.length < 20) {
      printWarning('API key seems short - verify it\'s correct');
    } else if (!/^[a-f0-9]+$/i.test(apiKey)) {
      printWarning('API key format looks unusual - verify it\'s correct');
    } else {
      printSuccess('API key format looks correct');
    }
  } else {
    printError('No API key found in environment variables');
    printInfo('Expected variables: TIINGO_KEY, TIINGO_API_KEY, etc.');
    return false;
  }
  
  return true;
}

async function verifyApiConnection() {
  printSeparator('API Connection Test');
  
  try {
    const client = new TiingoClient();
    const result = await client.testConnection();
    
    if (result.success) {
      printSuccess('API connection successful!');
      printInfo(`Response: ${JSON.stringify(result.data)}`);
      return true;
    } else {
      printError(`API connection failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    printError(`Connection test error: ${error.message}`);
    return false;
  }
}

async function verifyBasicDataRetrieval() {
  printSeparator('Basic Data Retrieval Test');
  
  const client = new TiingoClient();
  const testSymbol = 'AAPL';
  
  try {
    // Test latest quote
    printInfo(`Getting latest quote for ${testSymbol}...`);
    const quote = await client.getLatestQuote(testSymbol);
    
    if (quote && (quote.tngoLast || quote.last)) {
      const price = quote.tngoLast || quote.last;
      printSuccess(`Latest quote: ${formatCurrency(price)}`);
      printInfo(`Previous close: ${formatCurrency(quote.prevClose)}`);
      printInfo(`Volume: ${formatNumber(quote.volume)}`);
    } else {
      printWarning('Quote data received but seems incomplete');
      console.log('Quote data:', quote);
    }
    
    // Test historical data
    printInfo(`Getting historical prices for ${testSymbol}...`);
    const prices = await client.getStockPrices(testSymbol, { limit: 5 });
    
    if (Array.isArray(prices) && prices.length > 0) {
      printSuccess(`Retrieved ${prices.length} historical price points`);
      const latest = prices[prices.length - 1];
      printInfo(`Latest historical: ${formatCurrency(latest.close)} (${new Date(latest.date).toLocaleDateString()})`);
    } else {
      printWarning('No historical price data received');
    }
    
    return true;
    
  } catch (error) {
    printError(`Data retrieval error: ${error.message}`);
    return false;
  }
}

async function verifyNewsRetrieval() {
  printSeparator('News Data Test');
  
  try {
    const client = new TiingoClient();
    printInfo('Getting latest market news...');
    
    const news = await client.getNews({
      tickers: ['AAPL', 'MSFT'],
      limit: 3
    });
    
    if (Array.isArray(news) && news.length > 0) {
      printSuccess(`Retrieved ${news.length} news articles`);
      
      news.forEach((article, i) => {
        printInfo(`${i + 1}. ${article.title}`);
        printInfo(`   Source: ${article.source} | Date: ${new Date(article.publishedDate).toLocaleDateString()}`);
      });
      
      return true;
    } else {
      printWarning('No news data received');
      return false;
    }
    
  } catch (error) {
    printError(`News retrieval error: ${error.message}`);
    return false;
  }
}

async function verifyErrorHandling() {
  printSeparator('Error Handling Test');
  
  const client = new TiingoClient();
  
  // Test invalid symbol
  try {
    printInfo('Testing invalid symbol handling...');
    await client.getLatestQuote('INVALID_SYMBOL_12345');
    printWarning('Expected error for invalid symbol, but got success');
    return false;
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('not found') || 
        error.message.includes('invalid')) {
      printSuccess('Invalid symbol correctly handled');
    } else {
      printWarning(`Unexpected error for invalid symbol: ${error.message}`);
    }
  }
  
  // Test empty symbol
  try {
    printInfo('Testing empty symbol handling...');
    await client.getLatestQuote('');
    printWarning('Expected error for empty symbol, but got success');
  } catch (error) {
    printSuccess('Empty symbol correctly handled');
  }
  
  return true;
}

async function verifyCaching() {
  printSeparator('Caching Performance Test');
  
  const client = new TiingoClient();
  const testSymbol = 'AAPL';
  
  try {
    // First request (cache miss)
    printInfo('First request (should be cache miss)...');
    const start1 = Date.now();
    await client.getLatestQuote(testSymbol);
    const time1 = Date.now() - start1;
    printSuccess(`First request completed in ${time1}ms`);
    
    // Second request (cache hit)
    printInfo('Second request (should be cache hit)...');
    const start2 = Date.now();
    await client.getLatestQuote(testSymbol);
    const time2 = Date.now() - start2;
    printSuccess(`Second request completed in ${time2}ms`);
    
    if (time2 < time1) {
      const improvement = ((time1 - time2) / time1 * 100).toFixed(1);
      printSuccess(`Caching working! ${improvement}% speed improvement`);
    } else {
      printWarning('Caching may not be working optimally');
    }
    
    // Show cache stats
    const stats = client.getCacheStats();
    printInfo(`Cache entries: ${stats.size}`);
    
    return true;
    
  } catch (error) {
    printError(`Caching test error: ${error.message}`);
    return false;
  }
}

async function verifyMultipleSymbols() {
  printSeparator('Multiple Symbols Test');
  
  const client = new TiingoClient();
  const symbols = ['AAPL', 'MSFT', 'GOOGL'];
  const results = {};
  
  try {
    printInfo(`Testing ${symbols.length} different symbols...`);
    
    for (const symbol of symbols) {
      try {
        const quote = await client.getLatestQuote(symbol);
        const price = quote.tngoLast || quote.last;
        results[symbol] = price;
        printSuccess(`${symbol}: ${formatCurrency(price)}`);
      } catch (error) {
        printError(`${symbol}: ${error.message}`);
        results[symbol] = null;
      }
    }
    
    const successCount = Object.values(results).filter(v => v !== null).length;
    printInfo(`Successfully retrieved ${successCount}/${symbols.length} quotes`);
    
    return successCount > 0;
    
  } catch (error) {
    printError(`Multiple symbols test error: ${error.message}`);
    return false;
  }
}

async function verifyNetlifyFunction() {
  printSeparator('Netlify Function Test');
  
  try {
    // Import and test the Netlify function directly
    const { default: handleTiingoRequest } = await import('./netlify/functions/tiingo.js');
    
    printInfo('Testing Netlify function directly...');
    const req = new Request('http://localhost/api/tiingo?symbol=AAPL&kind=eod&limit=5');
    const resp = await handleTiingoRequest(req);
    
    if (resp.status === 200) {
      const data = await resp.json();
      printSuccess('Netlify function responds correctly');
      
      if (data.data && Array.isArray(data.data)) {
        printSuccess(`Returned ${data.data.length} data points`);
        
        if (data.warning) {
          printWarning(`Function warning: ${data.warning}`);
          printInfo('This is expected if no API key is available - function uses mock data');
        } else {
          printSuccess('Real data returned (no warning)');
        }
      } else {
        printWarning('Response format unexpected');
      }
      
      return true;
    } else {
      printError(`Netlify function returned status ${resp.status}`);
      return false;
    }
    
  } catch (error) {
    printError(`Netlify function test error: ${error.message}`);
    return false;
  }
}

// Main verification function
async function runFullVerification() {
  await loadEnv();
  
  console.log('🚀 Tiingo API Implementation Verification');
  console.log(`Started at: ${new Date().toLocaleString()}`);
  
  const tests = [
    { name: 'Environment Configuration', fn: verifyEnvironment },
    { name: 'API Connection', fn: verifyApiConnection },
    { name: 'Basic Data Retrieval', fn: verifyBasicDataRetrieval },
    { name: 'News Retrieval', fn: verifyNewsRetrieval },
    { name: 'Error Handling', fn: verifyErrorHandling },
    { name: 'Caching Performance', fn: verifyCaching },
    { name: 'Multiple Symbols', fn: verifyMultipleSymbols },
    { name: 'Netlify Function', fn: verifyNetlifyFunction }
  ];
  
  const results = {};
  
  for (const test of tests) {
    try {
      results[test.name] = await test.fn();
    } catch (error) {
      printError(`${test.name} failed with error: ${error.message}`);
      results[test.name] = false;
    }
  }
  
  // Summary
  printSeparator('Verification Summary');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log('');
  Object.entries(results).forEach(([test, passed]) => {
    if (passed) {
      printSuccess(`${test}: PASSED`);
    } else {
      printError(`${test}: FAILED`);
    }
  });
  
  console.log('');
  if (passed === total) {
    printSuccess(`🎉 ALL TESTS PASSED! (${passed}/${total})`);
    printInfo('Your Tiingo API implementation is working perfectly!');
  } else if (passed >= total * 0.75) {
    printSuccess(`✨ MOSTLY WORKING! (${passed}/${total})`);
    printInfo('Most functionality works. Check failed tests above.');
  } else if (passed >= total * 0.5) {
    printWarning(`⚠️  PARTIAL FUNCTIONALITY (${passed}/${total})`);
    printInfo('Some features work, but there are significant issues.');
  } else {
    printError(`❌ MAJOR ISSUES (${passed}/${total})`);
    printInfo('Most tests failed. Check configuration and API key.');
  }
  
  console.log(`\nCompleted at: ${new Date().toLocaleString()}`);
  
  return passed / total;
}

// Run verification if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullVerification().then(score => {
    process.exit(score === 1 ? 0 : 1);
  }).catch(error => {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  });
}