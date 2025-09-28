/**
 * Enhanced Tiingo API Client
 * 
 * A comprehensive TypeScript/JavaScript client for the Tiingo financial data API.
 * Provides both direct API access and caching functionality suitable for production use.
 * 
 * Features:
 * - Full Tiingo API coverage (stocks, crypto, forex, news, fundamentals)
 * - Built-in caching and rate limiting
 * - Error handling and retry logic
 * - Environment variable support
 * - TypeScript definitions
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuration
const TIINGO_BASE_URL = 'https://api.tiingo.com';
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Environment variable keys for Tiingo tokens
const TIINGO_TOKEN_KEYS = [
  'TIINGO_KEY',
  'TIINGO_API_KEY',
  'TIINGO_TOKEN',
  'TIINGO_ACCESS_TOKEN',
  'REACT_APP_TIINGO_KEY',
  'REACT_APP_TIINGO_TOKEN',
  'TIINGO_ACCESS_KEY',
  'TIINGO_AUTH_TOKEN'
];

/**
 * Simple in-memory cache with TTL support
 */
class SimpleCache {
  constructor(defaultTtl = 60000) { // 1 minute default
    this.cache = new Map();
    this.defaultTtl = defaultTtl;
  }
  
  set(key, value, ttl = this.defaultTtl) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }
  
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  delete(key) {
    return this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
  
  size() {
    // Clean up expired entries
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

/**
 * Rate limiter using token bucket algorithm
 */
class RateLimiter {
  constructor(maxRequests = 200, windowMs = 60000) { // 200 requests per minute
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.tokens = maxRequests;
    this.lastRefill = Date.now();
  }
  
  async acquire() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    
    // Refill tokens based on time passed
    const tokensToAdd = Math.floor((timePassed / this.windowMs) * this.maxRequests);
    this.tokens = Math.min(this.maxRequests, this.tokens + tokensToAdd);
    this.lastRefill = now;
    
    if (this.tokens > 0) {
      this.tokens--;
      return;
    }
    
    // Wait for next token
    const waitTime = this.windowMs / this.maxRequests;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return this.acquire();
  }
}

/**
 * Enhanced Tiingo API Client
 */
export class TiingoClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || this.loadApiKeyFromEnv();
    this.baseUrl = options.baseUrl || TIINGO_BASE_URL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries || MAX_RETRIES;
    this.retryDelay = options.retryDelay || RETRY_DELAY;
    
    // Initialize cache and rate limiter
    this.cache = new SimpleCache(options.cacheTtl || 60000);
    this.rateLimiter = new RateLimiter(
      options.maxRequestsPerMinute || 200,
      options.rateLimitWindowMs || 60000
    );
    
    this.enableCache = options.enableCache !== false;
    this.enableRateLimit = options.enableRateLimit !== false;
    
    if (!this.apiKey) {
      console.warn('Tiingo API key not found. Set TIINGO_KEY environment variable.');
    }
  }
  
  loadApiKeyFromEnv() {
    for (const key of TIINGO_TOKEN_KEYS) {
      const value = process.env[key];
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }
  
  async loadEnvFile(envPath = '.env') {
    try {
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const fullPath = join(currentDir, envPath);
      const envContent = await readFile(fullPath, 'utf-8');
      
      for (const line of envContent.split('\\n')) {
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
      // Silently ignore if .env file doesn't exist
    }
  }
  
  getCacheKey(endpoint, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${sortedParams}`;
  }
  
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async makeRequest(endpoint, params = {}, options = {}) {
    const { 
      cacheTtl = 60000, 
      skipCache = false, 
      skipRateLimit = false,
      retries = this.maxRetries 
    } = options;
    
    // Check cache first
    const cacheKey = this.getCacheKey(endpoint, params);
    if (this.enableCache && !skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    // Apply rate limiting
    if (this.enableRateLimit && !skipRateLimit) {
      await this.rateLimiter.acquire();
    }
    
    // Build URL
    const url = new URL(endpoint, this.baseUrl);
    if (this.apiKey) {
      url.searchParams.set('token', this.apiKey);
    }
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    }
    
    // Make request with retries
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TiingoClient/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Tiingo API error ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        // Cache successful responses
        if (this.enableCache && !skipCache) {
          this.cache.set(cacheKey, data, cacheTtl);
        }
        
        return data;
        
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.message.includes('400') || error.message.includes('401') || 
            error.message.includes('403') || error.message.includes('404')) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }
  
  // === Stock Data Methods ===
  
  /**
   * Get end-of-day stock prices
   */
  async getStockPrices(symbol, options = {}) {
    const { startDate, endDate, resampleFreq = 'daily', limit } = options;
    
    const params = { resampleFreq };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    let data = await this.makeRequest(`/tiingo/daily/${encodeURIComponent(symbol)}/prices`, params, {
      cacheTtl: 300000 // 5 minutes
    });
    
    if (Array.isArray(data) && limit) {
      data = data.slice(-limit);
    }
    
    return data;
  }
  
  /**
   * Get intraday stock prices
   */
  async getIntradayPrices(symbol, options = {}) {
    const { startDate, endDate, resampleFreq = '5min', limit } = options;
    
    const params = { resampleFreq };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    let data = await this.makeRequest(`/iex/${encodeURIComponent(symbol)}/prices`, params, {
      cacheTtl: 30000 // 30 seconds
    });
    
    if (Array.isArray(data) && limit) {
      data = data.slice(-limit);
    }
    
    return data;
  }
  
  /**
   * Get latest stock quote
   */
  async getLatestQuote(symbol) {
    const data = await this.makeRequest(`/iex/${encodeURIComponent(symbol)}`, {}, {
      cacheTtl: 15000 // 15 seconds
    });
    
    return Array.isArray(data) ? data[0] : data;
  }
  
  /**
   * Get stock metadata
   */
  async getStockMetadata(symbol) {
    return this.makeRequest(`/tiingo/daily/${encodeURIComponent(symbol)}`, {}, {
      cacheTtl: 3600000 // 1 hour
    });
  }
  
  // === News Methods ===
  
  /**
   * Get company news
   */
  async getNews(options = {}) {
    const { 
      tickers, 
      tags, 
      sources, 
      startDate, 
      endDate, 
      sortBy = 'publishedDate',
      limit = 100,
      offset = 0
    } = options;
    
    const params = { sortBy, limit, offset };
    if (tickers) {
      params.tickers = Array.isArray(tickers) ? tickers.join(',') : tickers;
    }
    if (tags) {
      params.tags = Array.isArray(tags) ? tags.join(',') : tags;
    }
    if (sources) {
      params.sources = Array.isArray(sources) ? sources.join(',') : sources;
    }
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return this.makeRequest('/tiingo/news', params, {
      cacheTtl: 180000 // 3 minutes
    });
  }
  
  // === Fundamental Data Methods ===
  
  /**
   * Get company fundamentals (requires subscription)
   */
  async getFundamentals(symbol, options = {}) {
    const { asOf } = options;
    
    const params = {};
    if (asOf) params.asOf = asOf;
    
    return this.makeRequest(`/tiingo/fundamentals/${encodeURIComponent(symbol)}`, params, {
      cacheTtl: 3600000 // 1 hour
    });
  }
  
  // === Crypto Methods ===
  
  /**
   * Get cryptocurrency prices
   */
  async getCryptoPrices(ticker, options = {}) {
    const { startDate, endDate, resampleFreq = '1day' } = options;
    
    const params = { resampleFreq };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return this.makeRequest(`/tiingo/crypto/prices`, { 
      ...params, 
      tickers: ticker 
    }, {
      cacheTtl: 300000 // 5 minutes
    });
  }
  
  /**
   * Get latest crypto quote
   */
  async getLatestCryptoQuote(ticker) {
    return this.makeRequest('/tiingo/crypto/top', { 
      tickers: ticker 
    }, {
      cacheTtl: 30000 // 30 seconds
    });
  }
  
  // === Forex Methods ===
  
  /**
   * Get forex prices
   */
  async getForexPrices(ticker, options = {}) {
    const { startDate, endDate, resampleFreq = '1day' } = options;
    
    const params = { resampleFreq };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return this.makeRequest(`/tiingo/fx/${encodeURIComponent(ticker)}/prices`, params, {
      cacheTtl: 300000 // 5 minutes
    });
  }
  
  /**
   * Get latest forex quote
   */
  async getLatestForexQuote(ticker) {
    return this.makeRequest('/tiingo/fx/top', { 
      tickers: ticker 
    }, {
      cacheTtl: 30000 // 30 seconds
    });
  }
  
  // === Utility Methods ===
  
  /**
   * Test API connection and key validity
   */
  async testConnection() {
    try {
      const data = await this.makeRequest('/api/test', {}, { 
        skipCache: true,
        cacheTtl: 0
      });
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get API usage and limits
   */
  async getApiUsage() {
    try {
      const data = await this.makeRequest('/api/account', {}, { 
        skipCache: true,
        cacheTtl: 0
      });
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size(),
      maxSize: 'unlimited',
      defaultTtl: this.cache.defaultTtl
    };
  }
}

// Export a default instance
let defaultClient = null;

export function getDefaultClient(options = {}) {
  if (!defaultClient) {
    defaultClient = new TiingoClient(options);
  }
  return defaultClient;
}

// Convenience functions using default client
export const tiingo = {
  getStockPrices: (...args) => getDefaultClient().getStockPrices(...args),
  getIntradayPrices: (...args) => getDefaultClient().getIntradayPrices(...args),
  getLatestQuote: (...args) => getDefaultClient().getLatestQuote(...args),
  getStockMetadata: (...args) => getDefaultClient().getStockMetadata(...args),
  getNews: (...args) => getDefaultClient().getNews(...args),
  getFundamentals: (...args) => getDefaultClient().getFundamentals(...args),
  getCryptoPrices: (...args) => getDefaultClient().getCryptoPrices(...args),
  getLatestCryptoQuote: (...args) => getDefaultClient().getLatestCryptoQuote(...args),
  getForexPrices: (...args) => getDefaultClient().getForexPrices(...args),
  getLatestForexQuote: (...args) => getDefaultClient().getLatestForexQuote(...args),
  testConnection: (...args) => getDefaultClient().testConnection(...args),
  getApiUsage: (...args) => getDefaultClient().getApiUsage(...args),
  clearCache: (...args) => getDefaultClient().clearCache(...args),
  getCacheStats: (...args) => getDefaultClient().getCacheStats(...args)
};

export default TiingoClient;