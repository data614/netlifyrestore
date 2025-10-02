// 100 RANDOM STOCKS VALIDATION TEST
// Comprehensive comparison between Tiingo API and Yahoo Finance
// This provides statistically significant sample size for accuracy assessment

const BASE_URL = 'http://localhost:8888';

// 100 diverse stocks across multiple markets and sectors
const STOCK_UNIVERSE = [
    // US Large Cap Tech
    { symbol: 'AAPL', yahooSymbol: 'AAPL', name: 'Apple Inc', market: 'US', sector: 'Technology' },
    { symbol: 'MSFT', yahooSymbol: 'MSFT', name: 'Microsoft Corp', market: 'US', sector: 'Technology' },
    { symbol: 'GOOGL', yahooSymbol: 'GOOGL', name: 'Alphabet Inc', market: 'US', sector: 'Technology' },
    { symbol: 'AMZN', yahooSymbol: 'AMZN', name: 'Amazon.com Inc', market: 'US', sector: 'Technology' },
    { symbol: 'TSLA', yahooSymbol: 'TSLA', name: 'Tesla Inc', market: 'US', sector: 'Automotive' },
    { symbol: 'META', yahooSymbol: 'META', name: 'Meta Platforms', market: 'US', sector: 'Technology' },
    { symbol: 'NVDA', yahooSymbol: 'NVDA', name: 'NVIDIA Corp', market: 'US', sector: 'Technology' },
    { symbol: 'NFLX', yahooSymbol: 'NFLX', name: 'Netflix Inc', market: 'US', sector: 'Media' },
    { symbol: 'CRM', yahooSymbol: 'CRM', name: 'Salesforce Inc', market: 'US', sector: 'Technology' },
    { symbol: 'ORCL', yahooSymbol: 'ORCL', name: 'Oracle Corp', market: 'US', sector: 'Technology' },
    
    // US Finance & Banking
    { symbol: 'JPM', yahooSymbol: 'JPM', name: 'JPMorgan Chase', market: 'US', sector: 'Banking' },
    { symbol: 'BAC', yahooSymbol: 'BAC', name: 'Bank of America', market: 'US', sector: 'Banking' },
    { symbol: 'WFC', yahooSymbol: 'WFC', name: 'Wells Fargo', market: 'US', sector: 'Banking' },
    { symbol: 'GS', yahooSymbol: 'GS', name: 'Goldman Sachs', market: 'US', sector: 'Banking' },
    { symbol: 'MS', yahooSymbol: 'MS', name: 'Morgan Stanley', market: 'US', sector: 'Banking' },
    { symbol: 'V', yahooSymbol: 'V', name: 'Visa Inc', market: 'US', sector: 'Financial Services' },
    { symbol: 'MA', yahooSymbol: 'MA', name: 'Mastercard Inc', market: 'US', sector: 'Financial Services' },
    { symbol: 'AXP', yahooSymbol: 'AXP', name: 'American Express', market: 'US', sector: 'Financial Services' },
    { symbol: 'BRK.B', yahooSymbol: 'BRK-B', name: 'Berkshire Hathaway', market: 'US', sector: 'Conglomerate' },
    { symbol: 'C', yahooSymbol: 'C', name: 'Citigroup Inc', market: 'US', sector: 'Banking' },
    
    // US Healthcare & Pharma
    { symbol: 'JNJ', yahooSymbol: 'JNJ', name: 'Johnson & Johnson', market: 'US', sector: 'Healthcare' },
    { symbol: 'PFE', yahooSymbol: 'PFE', name: 'Pfizer Inc', market: 'US', sector: 'Pharmaceuticals' },
    { symbol: 'UNH', yahooSymbol: 'UNH', name: 'UnitedHealth Group', market: 'US', sector: 'Healthcare' },
    { symbol: 'ABBV', yahooSymbol: 'ABBV', name: 'AbbVie Inc', market: 'US', sector: 'Pharmaceuticals' },
    { symbol: 'MRK', yahooSymbol: 'MRK', name: 'Merck & Co', market: 'US', sector: 'Pharmaceuticals' },
    { symbol: 'TMO', yahooSymbol: 'TMO', name: 'Thermo Fisher', market: 'US', sector: 'Healthcare' },
    { symbol: 'ABT', yahooSymbol: 'ABT', name: 'Abbott Laboratories', market: 'US', sector: 'Healthcare' },
    { symbol: 'LLY', yahooSymbol: 'LLY', name: 'Eli Lilly', market: 'US', sector: 'Pharmaceuticals' },
    { symbol: 'BMY', yahooSymbol: 'BMY', name: 'Bristol Myers Squibb', market: 'US', sector: 'Pharmaceuticals' },
    { symbol: 'MDT', yahooSymbol: 'MDT', name: 'Medtronic PLC', market: 'US', sector: 'Healthcare' },
    
    // US Consumer & Retail
    { symbol: 'WMT', yahooSymbol: 'WMT', name: 'Walmart Inc', market: 'US', sector: 'Retail' },
    { symbol: 'PG', yahooSymbol: 'PG', name: 'Procter & Gamble', market: 'US', sector: 'Consumer Goods' },
    { symbol: 'KO', yahooSymbol: 'KO', name: 'Coca-Cola Co', market: 'US', sector: 'Beverages' },
    { symbol: 'PEP', yahooSymbol: 'PEP', name: 'PepsiCo Inc', market: 'US', sector: 'Beverages' },
    { symbol: 'MCD', yahooSymbol: 'MCD', name: 'McDonalds Corp', market: 'US', sector: 'Restaurants' },
    { symbol: 'NKE', yahooSymbol: 'NKE', name: 'Nike Inc', market: 'US', sector: 'Apparel' },
    { symbol: 'SBUX', yahooSymbol: 'SBUX', name: 'Starbucks Corp', market: 'US', sector: 'Restaurants' },
    { symbol: 'HD', yahooSymbol: 'HD', name: 'Home Depot Inc', market: 'US', sector: 'Retail' },
    { symbol: 'LOW', yahooSymbol: 'LOW', name: 'Lowes Companies', market: 'US', sector: 'Retail' },
    { symbol: 'TGT', yahooSymbol: 'TGT', name: 'Target Corp', market: 'US', sector: 'Retail' },
    
    // US Industrial & Energy
    { symbol: 'XOM', yahooSymbol: 'XOM', name: 'Exxon Mobil', market: 'US', sector: 'Energy' },
    { symbol: 'CVX', yahooSymbol: 'CVX', name: 'Chevron Corp', market: 'US', sector: 'Energy' },
    { symbol: 'BA', yahooSymbol: 'BA', name: 'Boeing Co', market: 'US', sector: 'Aerospace' },
    { symbol: 'CAT', yahooSymbol: 'CAT', name: 'Caterpillar Inc', market: 'US', sector: 'Industrial' },
    { symbol: 'GE', yahooSymbol: 'GE', name: 'General Electric', market: 'US', sector: 'Conglomerate' },
    { symbol: 'MMM', yahooSymbol: 'MMM', name: '3M Company', market: 'US', sector: 'Industrial' },
    { symbol: 'HON', yahooSymbol: 'HON', name: 'Honeywell Intl', market: 'US', sector: 'Industrial' },
    { symbol: 'UPS', yahooSymbol: 'UPS', name: 'United Parcel Service', market: 'US', sector: 'Logistics' },
    { symbol: 'FDX', yahooSymbol: 'FDX', name: 'FedEx Corp', market: 'US', sector: 'Logistics' },
    { symbol: 'DE', yahooSymbol: 'DE', name: 'Deere & Company', market: 'US', sector: 'Industrial' },
    
    // Australian Stocks (ASX)
    { symbol: 'CBA', yahooSymbol: 'CBA.AX', name: 'Commonwealth Bank', market: 'AU', sector: 'Banking' },
    { symbol: 'BHP', yahooSymbol: 'BHP.AX', name: 'BHP Group', market: 'AU', sector: 'Mining' },
    { symbol: 'CSL', yahooSymbol: 'CSL.AX', name: 'CSL Limited', market: 'AU', sector: 'Healthcare' },
    { symbol: 'WBC', yahooSymbol: 'WBC.AX', name: 'Westpac Banking', market: 'AU', sector: 'Banking' },
    { symbol: 'ANZ', yahooSymbol: 'ANZ.AX', name: 'ANZ Group', market: 'AU', sector: 'Banking' },
    { symbol: 'WOW', yahooSymbol: 'WOW.AX', name: 'Woolworths Group', market: 'AU', sector: 'Retail' },
    { symbol: 'NAB', yahooSymbol: 'NAB.AX', name: 'National Australia Bank', market: 'AU', sector: 'Banking' },
    { symbol: 'WES', yahooSymbol: 'WES.AX', name: 'Wesfarmers', market: 'AU', sector: 'Retail' },
    { symbol: 'MQG', yahooSymbol: 'MQG.AX', name: 'Macquarie Group', market: 'AU', sector: 'Financial Services' },
    { symbol: 'TLS', yahooSymbol: 'TLS.AX', name: 'Telstra Group', market: 'AU', sector: 'Telecommunications' },
    { symbol: 'RIO', yahooSymbol: 'RIO.AX', name: 'Rio Tinto', market: 'AU', sector: 'Mining' },
    { symbol: 'WDS', yahooSymbol: 'WDS.AX', name: 'Woodside Energy', market: 'AU', sector: 'Energy' },
    { symbol: 'FMG', yahooSymbol: 'FMG.AX', name: 'Fortescue Metals', market: 'AU', sector: 'Mining' },
    { symbol: 'TCL', yahooSymbol: 'TCL.AX', name: 'Transurban Group', market: 'AU', sector: 'Infrastructure' },
    { symbol: 'STO', yahooSymbol: 'STO.AX', name: 'Santos Limited', market: 'AU', sector: 'Energy' },
    
    // Additional US Mid-Cap
    { symbol: 'AMD', yahooSymbol: 'AMD', name: 'Advanced Micro Devices', market: 'US', sector: 'Technology' },
    { symbol: 'CRM', yahooSymbol: 'CRM', name: 'Salesforce Inc', market: 'US', sector: 'Technology' },
    { symbol: 'ADBE', yahooSymbol: 'ADBE', name: 'Adobe Inc', market: 'US', sector: 'Technology' },
    { symbol: 'INTC', yahooSymbol: 'INTC', name: 'Intel Corp', market: 'US', sector: 'Technology' },
    { symbol: 'CSCO', yahooSymbol: 'CSCO', name: 'Cisco Systems', market: 'US', sector: 'Technology' },
    { symbol: 'IBM', yahooSymbol: 'IBM', name: 'IBM Corp', market: 'US', sector: 'Technology' },
    { symbol: 'QCOM', yahooSymbol: 'QCOM', name: 'Qualcomm Inc', market: 'US', sector: 'Technology' },
    { symbol: 'TXN', yahooSymbol: 'TXN', name: 'Texas Instruments', market: 'US', sector: 'Technology' },
    { symbol: 'AVGO', yahooSymbol: 'AVGO', name: 'Broadcom Inc', market: 'US', sector: 'Technology' },
    { symbol: 'NOW', yahooSymbol: 'NOW', name: 'ServiceNow Inc', market: 'US', sector: 'Technology' },
    
    // US Communications & Media
    { symbol: 'T', yahooSymbol: 'T', name: 'AT&T Inc', market: 'US', sector: 'Telecommunications' },
    { symbol: 'VZ', yahooSymbol: 'VZ', name: 'Verizon Communications', market: 'US', sector: 'Telecommunications' },
    { symbol: 'DIS', yahooSymbol: 'DIS', name: 'Walt Disney Co', market: 'US', sector: 'Entertainment' },
    { symbol: 'CMCSA', yahooSymbol: 'CMCSA', name: 'Comcast Corp', market: 'US', sector: 'Media' },
    { symbol: 'WBD', yahooSymbol: 'WBD', name: 'Warner Bros Discovery', market: 'US', sector: 'Media' },
    
    // US Utilities & REITs
    { symbol: 'NEE', yahooSymbol: 'NEE', name: 'NextEra Energy', market: 'US', sector: 'Utilities' },
    { symbol: 'SO', yahooSymbol: 'SO', name: 'Southern Company', market: 'US', sector: 'Utilities' },
    { symbol: 'DUK', yahooSymbol: 'DUK', name: 'Duke Energy', market: 'US', sector: 'Utilities' },
    { symbol: 'AMT', yahooSymbol: 'AMT', name: 'American Tower', market: 'US', sector: 'REITs' },
    { symbol: 'PLD', yahooSymbol: 'PLD', name: 'Prologis Inc', market: 'US', sector: 'REITs' },
    
    // US Materials & Chemicals
    { symbol: 'LIN', yahooSymbol: 'LIN', name: 'Linde PLC', market: 'US', sector: 'Chemicals' },
    { symbol: 'APD', yahooSymbol: 'APD', name: 'Air Products', market: 'US', sector: 'Chemicals' },
    { symbol: 'ECL', yahooSymbol: 'ECL', name: 'Ecolab Inc', market: 'US', sector: 'Chemicals' },
    { symbol: 'SHW', yahooSymbol: 'SHW', name: 'Sherwin-Williams', market: 'US', sector: 'Chemicals' },
    { symbol: 'DD', yahooSymbol: 'DD', name: 'DuPont de Nemours', market: 'US', sector: 'Chemicals' },
    
    // Additional diverse stocks to reach 100
    { symbol: 'COST', yahooSymbol: 'COST', name: 'Costco Wholesale', market: 'US', sector: 'Retail' },
    { symbol: 'CVS', yahooSymbol: 'CVS', name: 'CVS Health', market: 'US', sector: 'Healthcare' },
    { symbol: 'WBA', yahooSymbol: 'WBA', name: 'Walgreens Boots', market: 'US', sector: 'Healthcare' },
    { symbol: 'KMB', yahooSymbol: 'KMB', name: 'Kimberly-Clark', market: 'US', sector: 'Consumer Goods' },
    { symbol: 'CL', yahooSymbol: 'CL', name: 'Colgate-Palmolive', market: 'US', sector: 'Consumer Goods' },
    { symbol: 'KHC', yahooSymbol: 'KHC', name: 'Kraft Heinz', market: 'US', sector: 'Food & Beverages' },
    { symbol: 'GIS', yahooSymbol: 'GIS', name: 'General Mills', market: 'US', sector: 'Food & Beverages' },
    { symbol: 'K', yahooSymbol: 'K', name: 'Kellogg Company', market: 'US', sector: 'Food & Beverages' },
    { symbol: 'MO', yahooSymbol: 'MO', name: 'Altria Group', market: 'US', sector: 'Tobacco' },
    { symbol: 'PM', yahooSymbol: 'PM', name: 'Philip Morris', market: 'US', sector: 'Tobacco' },
    { symbol: 'GILD', yahooSymbol: 'GILD', name: 'Gilead Sciences', market: 'US', sector: 'Pharmaceuticals' },
    { symbol: 'AMGN', yahooSymbol: 'AMGN', name: 'Amgen Inc', market: 'US', sector: 'Pharmaceuticals' },
    { symbol: 'BIIB', yahooSymbol: 'BIIB', name: 'Biogen Inc', market: 'US', sector: 'Pharmaceuticals' },
    { symbol: 'REGN', yahooSymbol: 'REGN', name: 'Regeneron Pharma', market: 'US', sector: 'Pharmaceuticals' },
    { symbol: 'VRTX', yahooSymbol: 'VRTX', name: 'Vertex Pharma', market: 'US', sector: 'Pharmaceuticals' },
    { symbol: 'ZTS', yahooSymbol: 'ZTS', name: 'Zoetis Inc', market: 'US', sector: 'Animal Health' },
    { symbol: 'DHR', yahooSymbol: 'DHR', name: 'Danaher Corp', market: 'US', sector: 'Healthcare' },
    { symbol: 'SYK', yahooSymbol: 'SYK', name: 'Stryker Corp', market: 'US', sector: 'Healthcare' },
    { symbol: 'BSX', yahooSymbol: 'BSX', name: 'Boston Scientific', market: 'US', sector: 'Healthcare' },
    { symbol: 'EW', yahooSymbol: 'EW', name: 'Edwards Lifesciences', market: 'US', sector: 'Healthcare' }
];

// Randomly select 100 stocks from the universe
function getRandomStocks(count = 100) {
    const shuffled = [...STOCK_UNIVERSE].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, STOCK_UNIVERSE.length));
}

async function getTiingoData(symbol) {
    try {
        const url = `${BASE_URL}/api/tiingo?symbol=${symbol}&kind=intraday_latest`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(url, { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        let quote;
        if (Array.isArray(data) && data.length > 0) {
            quote = data[0];
        } else if (typeof data === 'object' && data !== null) {
            quote = data;
        } else {
            throw new Error('Invalid response format');
        }
        
        const price = quote.lastPrice || quote.last || quote.close || quote.price;
        const volume = quote.volume || 0;
        const timestamp = quote.timestamp || quote.date || new Date().toISOString();
        
        if (!price || price <= 0) {
            throw new Error('No valid price data');
        }
        
        return {
            success: true,
            price: parseFloat(price),
            volume: parseInt(volume),
            timestamp,
            source: 'Tiingo',
            headers: {
                fallback: response.headers.get('x-tiingo-fallback'),
                source: response.headers.get('X-Tiingo-Source'),
                rateLimit: response.headers.get('x-ratelimit-remaining')
            },
            rawData: quote
        };
    } catch (error) {
        return {
            success: false,
            error: error.name === 'AbortError' ? 'Timeout (15s)' : error.message,
            source: 'Tiingo'
        };
    }
}

async function getYahooData(yahooSymbol) {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(url, { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.chart?.result?.[0]) {
            throw new Error('Invalid Yahoo Finance response');
        }
        
        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators?.quote?.[0];
        const timestamps = result.timestamp;
        
        if (!timestamps || timestamps.length === 0) {
            throw new Error('No price history available');
        }
        
        const latestIndex = timestamps.length - 1;
        let price = null;
        
        // Try multiple price sources in order of preference
        if (quote?.close?.[latestIndex]) {
            price = quote.close[latestIndex];
        } else if (meta?.regularMarketPrice) {
            price = meta.regularMarketPrice;
        } else if (meta?.previousClose) {
            price = meta.previousClose;
        }
        
        if (!price || price <= 0) {
            throw new Error('No valid price data');
        }
        
        return {
            success: true,
            price: parseFloat(price),
            volume: quote?.volume?.[latestIndex] || 0,
            timestamp: new Date(timestamps[latestIndex] * 1000).toISOString(),
            currency: meta.currency || 'USD',
            exchange: meta.exchangeName || 'Unknown',
            marketState: meta.marketState,
            source: 'Yahoo Finance',
            companyName: meta.longName || meta.shortName || yahooSymbol
        };
    } catch (error) {
        return {
            success: false,
            error: error.name === 'AbortError' ? 'Timeout (15s)' : error.message,
            source: 'Yahoo Finance'
        };
    }
}

function calculateAccuracy(tiingoPrice, yahooPrice) {
    if (!tiingoPrice || !yahooPrice || tiingoPrice <= 0 || yahooPrice <= 0) {
        return { status: 'CANNOT_CALCULATE', difference: null, percentage: null };
    }
    
    const difference = Math.abs(tiingoPrice - yahooPrice);
    const percentage = (difference / yahooPrice) * 100;
    
    let status, grade;
    if (percentage < 0.5) {
        status = 'EXCELLENT'; 
        grade = 'A+';
    } else if (percentage < 1.0) {
        status = 'VERY_GOOD';
        grade = 'A';
    } else if (percentage < 2.0) {
        status = 'GOOD';
        grade = 'B+';
    } else if (percentage < 5.0) {
        status = 'ACCEPTABLE';
        grade = 'B';
    } else if (percentage < 10.0) {
        status = 'POOR';
        grade = 'C';
    } else {
        status = 'VERY_POOR';
        grade = 'F';
    }
    
    return {
        status,
        grade,
        difference: difference.toFixed(4),
        percentage: percentage.toFixed(3),
        percentageNum: percentage
    };
}

function formatPrice(price, currency = 'USD') {
    if (!price || price <= 0) return 'N/A';
    return `$${price.toFixed(2)} ${currency}`;
}

async function runMassiveValidation() {
    console.log('🚀 100 RANDOM STOCKS VALIDATION TEST');
    console.log('================================================');
    console.log('Statistical sample for comprehensive accuracy assessment');
    console.log(`Test started: ${new Date().toISOString()}`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log('');
    
    const testStocks = getRandomStocks(100);
    const results = [];
    const stats = {
        totalTested: testStocks.length,
        tiingoSuccess: 0,
        yahooSuccess: 0,
        bothSuccess: 0,
        accuracyBreakdown: {
            excellent: 0,     // < 0.5%
            veryGood: 0,      // 0.5-1%
            good: 0,          // 1-2%
            acceptable: 0,    // 2-5%
            poor: 0,          // 5-10%
            veryPoor: 0       // > 10%
        },
        sectorBreakdown: {},
        marketBreakdown: {},
        errors: { tiingo: [], yahoo: [] }
    };
    
    console.log('📊 Processing 100 random stocks...');
    console.log('⏱️  Estimated completion time: 5-8 minutes');
    console.log('');
    
    // Process stocks in batches to avoid overwhelming APIs
    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < testStocks.length; i += batchSize) {
        batches.push(testStocks.slice(i, i + batchSize));
    }
    
    let processedCount = 0;
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchPromises = batch.map(async (stock) => {
            const [tiingoData, yahooData] = await Promise.all([
                getTiingoData(stock.symbol),
                getYahooData(stock.yahooSymbol)
            ]);
            
            const result = {
                ...stock,
                tiingo: tiingoData,
                yahoo: yahooData,
                accuracy: null,
                processed: true
            };
            
            // Calculate accuracy if both APIs succeeded
            if (tiingoData.success && yahooData.success) {
                result.accuracy = calculateAccuracy(tiingoData.price, yahooData.price);
                stats.bothSuccess++;
                
                // Update accuracy breakdown
                const status = result.accuracy.status;
                if (status === 'EXCELLENT') stats.accuracyBreakdown.excellent++;
                else if (status === 'VERY_GOOD') stats.accuracyBreakdown.veryGood++;
                else if (status === 'GOOD') stats.accuracyBreakdown.good++;
                else if (status === 'ACCEPTABLE') stats.accuracyBreakdown.acceptable++;
                else if (status === 'POOR') stats.accuracyBreakdown.poor++;
                else if (status === 'VERY_POOR') stats.accuracyBreakdown.veryPoor++;
            }
            
            // Update success counters
            if (tiingoData.success) stats.tiingoSuccess++;
            else stats.errors.tiingo.push({ symbol: stock.symbol, error: tiingoData.error });
            
            if (yahooData.success) stats.yahooSuccess++;
            else stats.errors.yahoo.push({ symbol: stock.symbol, error: yahooData.error });
            
            // Update sector/market breakdowns
            stats.sectorBreakdown[stock.sector] = (stats.sectorBreakdown[stock.sector] || 0) + 1;
            stats.marketBreakdown[stock.market] = (stats.marketBreakdown[stock.market] || 0) + 1;
            
            return result;
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        processedCount += batch.length;
        
        // Progress update
        const progressPercent = Math.round((processedCount / testStocks.length) * 100);
        console.log(`✅ Batch ${batchIndex + 1}/${batches.length} completed (${progressPercent}% overall)`);
        
        // Small delay between batches to be respectful to APIs
        if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Generate comprehensive report
    console.log('\n🎯 COMPREHENSIVE ANALYSIS RESULTS');
    console.log('================================================');
    
    // Overall Statistics
    const tiingoSuccessRate = (stats.tiingoSuccess / stats.totalTested * 100).toFixed(1);
    const yahooSuccessRate = (stats.yahooSuccess / stats.totalTested * 100).toFixed(1);
    const bothSuccessRate = (stats.bothSuccess / stats.totalTested * 100).toFixed(1);
    
    console.log(`📈 OVERALL PERFORMANCE:`);
    console.log(`   Total stocks tested: ${stats.totalTested}`);
    console.log(`   Tiingo API success: ${stats.tiingoSuccess}/${stats.totalTested} (${tiingoSuccessRate}%)`);
    console.log(`   Yahoo Finance success: ${stats.yahooSuccess}/${stats.totalTested} (${yahooSuccessRate}%)`);
    console.log(`   Successful comparisons: ${stats.bothSuccess}/${stats.totalTested} (${bothSuccessRate}%)`);
    console.log('');
    
    // Accuracy Breakdown
    console.log(`🎯 ACCURACY DISTRIBUTION:`);
    console.log(`   A+ Excellent (<0.5%): ${stats.accuracyBreakdown.excellent} stocks (${(stats.accuracyBreakdown.excellent/stats.bothSuccess*100).toFixed(1)}%)`);
    console.log(`   A  Very Good (0.5-1%): ${stats.accuracyBreakdown.veryGood} stocks (${(stats.accuracyBreakdown.veryGood/stats.bothSuccess*100).toFixed(1)}%)`);
    console.log(`   B+ Good (1-2%): ${stats.accuracyBreakdown.good} stocks (${(stats.accuracyBreakdown.good/stats.bothSuccess*100).toFixed(1)}%)`);
    console.log(`   B  Acceptable (2-5%): ${stats.accuracyBreakdown.acceptable} stocks (${(stats.accuracyBreakdown.acceptable/stats.bothSuccess*100).toFixed(1)}%)`);
    console.log(`   C  Poor (5-10%): ${stats.accuracyBreakdown.poor} stocks (${(stats.accuracyBreakdown.poor/stats.bothSuccess*100).toFixed(1)}%)`);
    console.log(`   F  Very Poor (>10%): ${stats.accuracyBreakdown.veryPoor} stocks (${(stats.accuracyBreakdown.veryPoor/stats.bothSuccess*100).toFixed(1)}%)`);
    console.log('');
    
    // Professional Grade Assessment
    const professionalGrade = stats.accuracyBreakdown.excellent + stats.accuracyBreakdown.veryGood + stats.accuracyBreakdown.good;
    const professionalPercent = (professionalGrade / stats.bothSuccess * 100).toFixed(1);
    
    console.log(`💼 PROFESSIONAL GRADE ASSESSMENT:`);
    console.log(`   Professional quality (≤2% error): ${professionalGrade}/${stats.bothSuccess} (${professionalPercent}%)`);
    
    if (professionalPercent >= 85) {
        console.log(`   ✅ EXCEPTIONAL - Ready for enterprise deployment`);
    } else if (professionalPercent >= 70) {
        console.log(`   ✅ PROFESSIONAL - Suitable for stakeholder presentation`);
    } else if (professionalPercent >= 50) {
        console.log(`   ⚠️  ACCEPTABLE - May need minor improvements`);
    } else {
        console.log(`   ❌ NEEDS WORK - Requires investigation`);
    }
    console.log('');
    
    // Market Breakdown
    console.log(`🌍 MARKET PERFORMANCE:`);
    Object.entries(stats.marketBreakdown).forEach(([market, count]) => {
        const marketResults = results.filter(r => r.market === market && r.accuracy);
        const marketAccuracy = marketResults.length > 0 ? 
            (marketResults.filter(r => r.accuracy.percentageNum <= 2).length / marketResults.length * 100).toFixed(1) : 
            'N/A';
        console.log(`   ${market}: ${count} stocks (${marketAccuracy}% professional grade)`);
    });
    console.log('');
    
    // Sector Performance
    console.log(`🏭 SECTOR PERFORMANCE:`);
    Object.entries(stats.sectorBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([sector, count]) => {
            const sectorResults = results.filter(r => r.sector === sector && r.accuracy);
            const sectorAccuracy = sectorResults.length > 0 ? 
                (sectorResults.filter(r => r.accuracy.percentageNum <= 2).length / sectorResults.length * 100).toFixed(1) : 
                'N/A';
            console.log(`   ${sector}: ${count} stocks (${sectorAccuracy}% professional grade)`);
        });
    console.log('');
    
    // Detailed Results Table (Top 20 best and worst)
    const successfulResults = results.filter(r => r.accuracy).sort((a, b) => a.accuracy.percentageNum - b.accuracy.percentageNum);
    
    console.log(`📋 TOP 20 MOST ACCURATE RESULTS:`);
    console.log('Symbol | Company                | Tiingo     | Yahoo      | Error   | Grade | Market');
    console.log('-------|------------------------|------------|------------|---------|-------|-------');
    
    successfulResults.slice(0, 20).forEach(result => {
        const symbol = result.symbol.padEnd(6);
        const name = result.name.substring(0, 22).padEnd(22);
        const tiingoPrice = `$${result.tiingo.price.toFixed(2)}`.padEnd(10);
        const yahooPrice = `$${result.yahoo.price.toFixed(2)}`.padEnd(10);
        const error = `${result.accuracy.percentage}%`.padEnd(7);
        const grade = result.accuracy.grade.padEnd(5);
        const market = result.market;
        
        console.log(`${symbol} | ${name} | ${tiingoPrice} | ${yahooPrice} | ${error} | ${grade} | ${market}`);
    });
    
    console.log('\n📋 TOP 20 LEAST ACCURATE RESULTS:');
    console.log('Symbol | Company                | Tiingo     | Yahoo      | Error   | Grade | Market');
    console.log('-------|------------------------|------------|------------|---------|-------|-------');
    
    successfulResults.slice(-20).reverse().forEach(result => {
        const symbol = result.symbol.padEnd(6);
        const name = result.name.substring(0, 22).padEnd(22);
        const tiingoPrice = `$${result.tiingo.price.toFixed(2)}`.padEnd(10);
        const yahooPrice = `$${result.yahoo.price.toFixed(2)}`.padEnd(10);
        const error = `${result.accuracy.percentage}%`.padEnd(7);
        const grade = result.accuracy.grade.padEnd(5);
        const market = result.market;
        
        console.log(`${symbol} | ${name} | ${tiingoPrice} | ${yahooPrice} | ${error} | ${grade} | ${market}`);
    });
    
    // Error Analysis
    if (stats.errors.tiingo.length > 0 || stats.errors.yahoo.length > 0) {
        console.log('\n🔧 ERROR ANALYSIS:');
        
        if (stats.errors.tiingo.length > 0) {
            console.log(`Tiingo API Errors (${stats.errors.tiingo.length}):`);
            const tiingoErrorTypes = {};
            stats.errors.tiingo.forEach(err => {
                tiingoErrorTypes[err.error] = (tiingoErrorTypes[err.error] || 0) + 1;
            });
            Object.entries(tiingoErrorTypes).forEach(([error, count]) => {
                console.log(`   ${error}: ${count} occurrences`);
            });
        }
        
        if (stats.errors.yahoo.length > 0) {
            console.log(`Yahoo Finance Errors (${stats.errors.yahoo.length}):`);
            const yahooErrorTypes = {};
            stats.errors.yahoo.forEach(err => {
                yahooErrorTypes[err.error] = (yahooErrorTypes[err.error] || 0) + 1;
            });
            Object.entries(yahooErrorTypes).forEach(([error, count]) => {
                console.log(`   ${error}: ${count} occurrences`);
            });
        }
    }
    
    // Final Assessment
    console.log('\n🎪 STAKEHOLDER PRESENTATION READINESS:');
    console.log('================================================');
    
    if (bothSuccessRate >= 80 && professionalPercent >= 85) {
        console.log('🏆 EXCEPTIONAL QUALITY - READY FOR IMMEDIATE DEPLOYMENT');
        console.log('   • API reliability exceeds industry standards');
        console.log('   • Data accuracy suitable for financial applications');
        console.log('   • Strong performance across multiple markets and sectors');
    } else if (bothSuccessRate >= 70 && professionalPercent >= 70) {
        console.log('✅ PROFESSIONAL QUALITY - READY FOR STAKEHOLDER PRESENTATION');
        console.log('   • Solid API performance with good accuracy');
        console.log('   • Suitable for production trading applications');
        console.log('   • Minor optimizations may enhance performance');
    } else if (bothSuccessRate >= 50 && professionalPercent >= 50) {
        console.log('⚠️  ACCEPTABLE QUALITY - NEEDS MINOR IMPROVEMENTS');
        console.log('   • Basic functionality working but improvements needed');
        console.log('   • Consider investigating error patterns');
        console.log('   • May require additional API configuration');
    } else {
        console.log('❌ NEEDS SIGNIFICANT IMPROVEMENT');
        console.log('   • Major issues affecting reliability and accuracy');
        console.log('   • Investigate API configuration and connectivity');
        console.log('   • Not ready for stakeholder presentation');
    }
    
    console.log(`\n✅ Mass validation completed in ${Math.round((Date.now() - Date.now()) / 1000)}s`);
    console.log(`📊 Final Statistics: ${bothSuccessRate}% comparison success, ${professionalPercent}% professional grade`);
    
    return {
        summary: stats,
        results: results,
        professionalGradePercent: parseFloat(professionalPercent),
        overallSuccessRate: parseFloat(bothSuccessRate),
        readyForStakeholders: bothSuccessRate >= 70 && professionalPercent >= 70
    };
}

// Execute the massive validation
console.log('Starting 100-stock validation test...');
console.log('Ensure dev server is running at http://localhost:8888');
console.log('This will take approximately 5-8 minutes to complete.');
console.log('');

runMassiveValidation()
    .then(result => {
        console.log('\n🎉 VALIDATION COMPLETE!');
        console.log(`Ready for stakeholders: ${result.readyForStakeholders ? 'YES' : 'NO'}`);
    })
    .catch(error => {
        console.error('\n❌ Validation failed:', error.message);
        console.error('Ensure the dev server is running: npm run dev');
    });