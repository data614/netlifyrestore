// Quick comparison test using Node.js and public APIs
const BASE_URL = 'http://localhost:8888';

const TEST_STOCKS = [
    { symbol: 'WOW', exchange: 'ASX', yahooSymbol: 'WOW.AX', name: 'Woolworths Group' },
    { symbol: 'AAPL', exchange: 'NASDAQ', yahooSymbol: 'AAPL', name: 'Apple Inc' },
    { symbol: 'MSFT', exchange: 'NASDAQ', yahooSymbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'GOOGL', exchange: 'NASDAQ', yahooSymbol: 'GOOGL', name: 'Alphabet' },
    { symbol: 'TSLA', exchange: 'NASDAQ', yahooSymbol: 'TSLA', name: 'Tesla' },
    { symbol: 'BHP', exchange: 'ASX', yahooSymbol: 'BHP.AX', name: 'BHP Group' },
    { symbol: 'CBA', exchange: 'ASX', yahooSymbol: 'CBA.AX', name: 'Commonwealth Bank' },
    { symbol: 'CSL', exchange: 'ASX', yahooSymbol: 'CSL.AX', name: 'CSL Limited' },
    { symbol: 'WES', exchange: 'ASX', yahooSymbol: 'WES.AX', name: 'Wesfarmers' },
    { symbol: 'TLS', exchange: 'ASX', yahooSymbol: 'TLS.AX', name: 'Telstra' }
];

async function getTiingoData(symbol) {
    try {
        const url = `${BASE_URL}/api/tiingo?symbol=${symbol}&kind=intraday_latest`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const headers = {
            chosenKey: response.headers.get('x-tiingo-chosen-key'),
            fallback: response.headers.get('x-tiingo-fallback'),
            source: response.headers.get('X-Tiingo-Source')
        };
        
        // Handle different response formats
        let quote;
        if (Array.isArray(data) && data.length > 0) {
            quote = data[0];
        } else if (typeof data === 'object') {
            quote = data;
        } else {
            throw new Error('Unexpected data format');
        }
        
        return {
            price: quote.lastPrice || quote.last || quote.close || 0,
            prevClose: quote.prevClose || 0,
            volume: quote.volume || 0,
            timestamp: quote.timestamp || new Date().toISOString(),
            headers
        };
    } catch (error) {
        return { error: error.message };
    }
}

async function getYahooFinanceData(yahooSymbol) {
    try {
        // Using Yahoo Finance API endpoint (note: this is for demonstration)
        // In production, you'd use a proper API with authentication
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators.quote[0];
        const timestamps = result.timestamp;
        
        // Get the latest data point
        const latestIndex = timestamps.length - 1;
        
        return {
            price: quote.close[latestIndex] || meta.regularMarketPrice,
            prevClose: meta.previousClose,
            volume: quote.volume[latestIndex],
            timestamp: new Date(timestamps[latestIndex] * 1000).toISOString(),
            currency: meta.currency
        };
    } catch (error) {
        return { error: error.message };
    }
}

function calculateDifference(tiingoPrice, yahooPrice) {
    if (!yahooPrice || yahooPrice === 0) return null;
    return Math.abs(tiingoPrice - yahooPrice) / yahooPrice * 100;
}

async function runComparison() {
    console.log('🔍 TIINGO vs YAHOO FINANCE COMPARISON TEST');
    console.log('='.repeat(60));
    console.log(`Testing ${TEST_STOCKS.length} stocks...`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Test time: ${new Date().toISOString()}`);
    console.log();
    
    const results = [];
    
    for (let i = 0; i < TEST_STOCKS.length; i++) {
        const stock = TEST_STOCKS[i];
        console.log(`[${i + 1}/${TEST_STOCKS.length}] Testing ${stock.name} (${stock.symbol})...`);
        
        // Test Tiingo API
        const tiingoData = await getTiingoData(stock.symbol);
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
        
        // Test Yahoo Finance API
        const yahooData = await getYahooFinanceData(stock.yahooSymbol);
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
        
        if (tiingoData.error) {
            console.log(`  ❌ Tiingo: ${tiingoData.error}`);
        } else {
            console.log(`  ✅ Tiingo: $${tiingoData.price.toFixed(2)} (${tiingoData.headers.source || 'unknown'})`);
            if (tiingoData.headers.fallback && tiingoData.headers.fallback !== 'none') {
                console.log(`    ⚠️  Fallback: ${tiingoData.headers.fallback}`);
            }
        }
        
        if (yahooData.error) {
            console.log(`  ❌ Yahoo: ${yahooData.error}`);
        } else {
            console.log(`  ✅ Yahoo: $${yahooData.price.toFixed(2)} ${yahooData.currency || ''}`);
        }
        
        // Calculate difference
        let difference = null;
        if (!tiingoData.error && !yahooData.error) {
            difference = calculateDifference(tiingoData.price, yahooData.price);
            console.log(`  📊 Difference: ${difference.toFixed(2)}%`);
        }
        
        results.push({
            ...stock,
            tiingo: tiingoData,
            yahoo: yahooData,
            difference,
            status: (!tiingoData.error && !yahooData.error) ? 'success' : 'error'
        });
        
        console.log();
    }
    
    // Summary Report
    console.log('📊 SUMMARY REPORT');
    console.log('='.repeat(60));
    
    const successfulTests = results.filter(r => r.status === 'success');
    const tiingoSuccessCount = results.filter(r => !r.tiingo.error).length;
    const yahooSuccessCount = results.filter(r => !r.yahoo.error).length;
    
    console.log(`Total tests: ${results.length}`);
    console.log(`Tiingo API success: ${tiingoSuccessCount}/${results.length}`);
    console.log(`Yahoo Finance success: ${yahooSuccessCount}/${results.length}`);
    console.log(`Successful comparisons: ${successfulTests.length}`);
    
    if (successfulTests.length > 0) {
        const differences = successfulTests.map(r => r.difference).filter(d => d !== null);
        const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
        const maxDiff = Math.max(...differences);
        const minDiff = Math.min(...differences);
        
        console.log(`\nPrice Accuracy Analysis:`);
        console.log(`  Average difference: ${avgDiff.toFixed(2)}%`);
        console.log(`  Maximum difference: ${maxDiff.toFixed(2)}%`);
        console.log(`  Minimum difference: ${minDiff.toFixed(2)}%`);
        
        // Check accuracy (within 5% for delayed data)
        const acceptableDiff = 5.0;
        const accurateCount = differences.filter(d => d <= acceptableDiff).length;
        const accuracyRate = (accurateCount / differences.length) * 100;
        
        console.log(`  Tests within ${acceptableDiff}% difference: ${accurateCount}/${differences.length} (${accuracyRate.toFixed(1)}%)`);
    }
    
    // Detailed Results Table
    console.log(`\n📋 DETAILED RESULTS`);
    console.log('='.repeat(80));
    console.log('Symbol'.padEnd(8) + 'Exchange'.padEnd(10) + 'Tiingo'.padEnd(12) + 'Yahoo'.padEnd(12) + 'Diff%'.padEnd(8) + 'Status');
    console.log('-'.repeat(80));
    
    results.forEach(result => {
        const symbol = result.symbol.padEnd(8);
        const exchange = result.exchange.padEnd(10);
        const tiingoPrice = result.tiingo.error ? 'ERROR'.padEnd(12) : `$${result.tiingo.price.toFixed(2)}`.padEnd(12);
        const yahooPrice = result.yahoo.error ? 'ERROR'.padEnd(12) : `$${result.yahoo.price.toFixed(2)}`.padEnd(12);
        const diff = result.difference ? `${result.difference.toFixed(2)}%`.padEnd(8) : 'N/A'.padEnd(8);
        const status = result.status;
        
        console.log(symbol + exchange + tiingoPrice + yahooPrice + diff + status);
    });
    
    // Environment Check
    console.log(`\n🔧 ENVIRONMENT INFO`);
    console.log('='.repeat(40));
    const tiingoResults = results.filter(r => !r.tiingo.error);
    if (tiingoResults.length > 0) {
        const chosenKey = tiingoResults[0].tiingo.headers.chosenKey || 'Not detected';
        console.log(`Tiingo API Key: ${chosenKey}`);
        
        const fallbackCount = tiingoResults.filter(r => 
            r.tiingo.headers.fallback && r.tiingo.headers.fallback !== 'none'
        ).length;
        console.log(`Tests using fallback data: ${fallbackCount}/${results.length}`);
        
        if (fallbackCount > 0) {
            console.log('⚠️  Some tests used mock/fallback data - check environment variables');
        } else {
            console.log('✅ All tests used live data from Tiingo API');
        }
    }
    
    // Special note about Woolworths
    const wowResult = results.find(r => r.symbol === 'WOW');
    if (wowResult && wowResult.status === 'success') {
        console.log(`\n🏪 WOOLWORTHS VERIFICATION`);
        console.log('='.repeat(30));
        console.log(`Expected: $26.52 AUD (from your screenshot)`);
        console.log(`Tiingo:   $${wowResult.tiingo.price.toFixed(2)}`);
        console.log(`Yahoo:    $${wowResult.yahoo.price.toFixed(2)}`);
        console.log(`Difference: ${wowResult.difference.toFixed(2)}%`);
    }
}

// Run the test
runComparison().catch(console.error);