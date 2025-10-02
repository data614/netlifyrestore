// Australian Shares Validation: Tiingo vs Yahoo Finance
// Tests 10 ASX stocks to ensure data accuracy for stakeholder confidence

const BASE_URL = 'http://localhost:8888';

// Top 10 Australian stocks for comprehensive testing
const AUSTRALIAN_STOCKS = [
    { symbol: 'CBA', yahooSymbol: 'CBA.AX', name: 'Commonwealth Bank', sector: 'Banking' },
    { symbol: 'BHP', yahooSymbol: 'BHP.AX', name: 'BHP Group', sector: 'Mining' },
    { symbol: 'CSL', yahooSymbol: 'CSL.AX', name: 'CSL Limited', sector: 'Healthcare' },
    { symbol: 'WBC', yahooSymbol: 'WBC.AX', name: 'Westpac Banking', sector: 'Banking' },
    { symbol: 'ANZ', yahooSymbol: 'ANZ.AX', name: 'ANZ Group Holdings', sector: 'Banking' },
    { symbol: 'WOW', yahooSymbol: 'WOW.AX', name: 'Woolworths Group', sector: 'Retail' },
    { symbol: 'NAB', yahooSymbol: 'NAB.AX', name: 'National Australia Bank', sector: 'Banking' },
    { symbol: 'WES', yahooSymbol: 'WES.AX', name: 'Wesfarmers', sector: 'Retail' },
    { symbol: 'MQG', yahooSymbol: 'MQG.AX', name: 'Macquarie Group', sector: 'Financial Services' },
    { symbol: 'TLS', yahooSymbol: 'TLS.AX', name: 'Telstra Group', sector: 'Telecommunications' }
];

async function getTiingoData(symbol) {
    try {
        const url = `${BASE_URL}/api/tiingo?symbol=${symbol}&kind=intraday_latest`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
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
            success: true,
            price: quote.lastPrice || quote.last || quote.close || 0,
            prevClose: quote.prevClose || 0,
            volume: quote.volume || 0,
            timestamp: quote.timestamp || new Date().toISOString(),
            currency: 'AUD',
            source: 'Tiingo',
            headers: {
                chosenKey: response.headers.get('x-tiingo-chosen-key'),
                fallback: response.headers.get('x-tiingo-fallback'),
                dataSource: response.headers.get('X-Tiingo-Source')
            },
            rawQuote: quote
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            source: 'Tiingo'
        };
    }
}

async function getYahooData(yahooSymbol) {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators.quote[0];
        const timestamps = result.timestamp;
        
        // Get the latest data point
        const latestIndex = timestamps.length - 1;
        
        return {
            success: true,
            price: quote.close[latestIndex] || meta.regularMarketPrice,
            prevClose: meta.previousClose,
            volume: quote.volume[latestIndex],
            timestamp: new Date(timestamps[latestIndex] * 1000).toISOString(),
            currency: meta.currency,
            source: 'Yahoo Finance',
            exchange: meta.exchangeName,
            marketState: meta.marketState,
            companyName: meta.longName || meta.shortName
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            source: 'Yahoo Finance'
        };
    }
}

function calculateAccuracy(tiingoPrice, yahooPrice) {
    if (!tiingoPrice || !yahooPrice || tiingoPrice <= 0 || yahooPrice <= 0) {
        return { status: 'Cannot Calculate', difference: 'N/A', percentage: 'N/A' };
    }
    
    const difference = Math.abs(tiingoPrice - yahooPrice);
    const percentage = (difference / yahooPrice) * 100;
    
    let status;
    if (percentage < 0.5) {
        status = '✅ EXCELLENT';
    } else if (percentage < 2.0) {
        status = '✅ GOOD';
    } else if (percentage < 5.0) {
        status = '⚠️ ACCEPTABLE';
    } else {
        status = '❌ POOR';
    }
    
    return {
        status,
        difference: difference.toFixed(4),
        percentage: percentage.toFixed(2) + '%'
    };
}

function formatPrice(price, currency = 'AUD') {
    if (!price || price <= 0) return 'N/A';
    return `$${price.toFixed(2)} ${currency}`;
}

async function validateAustralianStocks() {
    console.log('🇦🇺 AUSTRALIAN SHARES VALIDATION TEST');
    console.log('==============================================');
    console.log(`Testing ${AUSTRALIAN_STOCKS.length} ASX stocks against Yahoo Finance`);
    console.log(`Test time: ${new Date().toISOString()}`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log('');
    
    const results = [];
    let successCount = 0;
    let tiingoSuccessCount = 0;
    let yahooSuccessCount = 0;
    
    console.log('📊 Processing stocks...');
    console.log('');
    
    for (let i = 0; i < AUSTRALIAN_STOCKS.length; i++) {
        const stock = AUSTRALIAN_STOCKS[i];
        const stockNum = i + 1;
        
        console.log(`[${stockNum}/${AUSTRALIAN_STOCKS.length}] Testing ${stock.name} (${stock.symbol})...`);
        
        try {
            // Fetch data from both sources in parallel
            const [tiingoData, yahooData] = await Promise.all([
                getTiingoData(stock.symbol),
                getYahooData(stock.yahooSymbol)
            ]);
            
            const result = {
                symbol: stock.symbol,
                name: stock.name,
                sector: stock.sector,
                tiingo: tiingoData,
                yahoo: yahooData,
                accuracy: null
            };
            
            // Display immediate results
            if (tiingoData.success) {
                console.log(`  ✅ Tiingo: ${formatPrice(tiingoData.price)}`);
                tiingoSuccessCount++;
            } else {
                console.log(`  ❌ Tiingo: ${tiingoData.error}`);
            }
            
            if (yahooData.success) {
                console.log(`  ✅ Yahoo: ${formatPrice(yahooData.price)}`);
                yahooSuccessCount++;
            } else {
                console.log(`  ❌ Yahoo: ${yahooData.error}`);
            }
            
            // Calculate accuracy if both succeeded
            if (tiingoData.success && yahooData.success) {
                result.accuracy = calculateAccuracy(tiingoData.price, yahooData.price);
                console.log(`  📊 Accuracy: ${result.accuracy.status} (${result.accuracy.percentage} difference)`);
                successCount++;
            } else {
                console.log(`  ⚠️ Cannot compare - API error`);
            }
            
            results.push(result);
            console.log('');
            
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
            results.push({
                symbol: stock.symbol,
                name: stock.name,
                sector: stock.sector,
                error: error.message
            });
            console.log('');
        }
        
        // Add small delay to avoid overwhelming APIs
        if (i < AUSTRALIAN_STOCKS.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    // Generate comprehensive report
    console.log('📈 SUMMARY REPORT');
    console.log('==============================================');
    console.log(`Total stocks tested: ${AUSTRALIAN_STOCKS.length}`);
    console.log(`Tiingo API success: ${tiingoSuccessCount}/${AUSTRALIAN_STOCKS.length} (${(tiingoSuccessCount/AUSTRALIAN_STOCKS.length*100).toFixed(1)}%)`);
    console.log(`Yahoo Finance success: ${yahooSuccessCount}/${AUSTRALIAN_STOCKS.length} (${(yahooSuccessCount/AUSTRALIAN_STOCKS.length*100).toFixed(1)}%)`);
    console.log(`Successful comparisons: ${successCount}/${AUSTRALIAN_STOCKS.length} (${(successCount/AUSTRALIAN_STOCKS.length*100).toFixed(1)}%)`);
    console.log('');
    
    // Detailed comparison table
    console.log('📋 DETAILED COMPARISON TABLE');
    console.log('==============================================');
    console.log('Symbol | Company           | Tiingo    | Yahoo     | Accuracy | Status');
    console.log('-------|-------------------|-----------|-----------|----------|--------');
    
    results.forEach(result => {
        const symbol = result.symbol.padEnd(6);
        const name = result.name.substring(0, 17).padEnd(17);
        const tiingoPrice = result.tiingo?.success ? 
            `$${result.tiingo.price.toFixed(2)}`.padEnd(9) : 
            'ERROR'.padEnd(9);
        const yahooPrice = result.yahoo?.success ? 
            `$${result.yahoo.price.toFixed(2)}`.padEnd(9) : 
            'ERROR'.padEnd(9);
        const accuracy = result.accuracy ? 
            result.accuracy.percentage.padEnd(8) : 
            'N/A'.padEnd(8);
        const status = result.accuracy ? result.accuracy.status : '❌ FAILED';
        
        console.log(`${symbol} | ${name} | ${tiingoPrice} | ${yahooPrice} | ${accuracy} | ${status}`);
    });
    
    console.log('');
    
    // Quality assessment
    const excellentCount = results.filter(r => r.accuracy?.status === '✅ EXCELLENT').length;
    const goodCount = results.filter(r => r.accuracy?.status === '✅ GOOD').length;
    const acceptableCount = results.filter(r => r.accuracy?.status === '⚠️ ACCEPTABLE').length;
    const poorCount = results.filter(r => r.accuracy?.status === '❌ POOR').length;
    
    console.log('🎯 DATA QUALITY ASSESSMENT');
    console.log('==============================================');
    console.log(`✅ Excellent accuracy (<0.5%): ${excellentCount} stocks`);
    console.log(`✅ Good accuracy (0.5-2%): ${goodCount} stocks`);
    console.log(`⚠️ Acceptable accuracy (2-5%): ${acceptableCount} stocks`);
    console.log(`❌ Poor accuracy (>5%): ${poorCount} stocks`);
    console.log('');
    
    // Stakeholder readiness assessment
    const stakeholderReady = (excellentCount + goodCount) >= (AUSTRALIAN_STOCKS.length * 0.7);
    console.log('🎪 STAKEHOLDER PRESENTATION READINESS');
    console.log('==============================================');
    if (stakeholderReady) {
        console.log('✅ READY FOR STAKEHOLDER PRESENTATION');
        console.log(`   ${excellentCount + goodCount}/${AUSTRALIAN_STOCKS.length} stocks show excellent/good accuracy`);
        console.log('   Data quality meets professional standards');
    } else {
        console.log('⚠️ NEEDS IMPROVEMENT BEFORE STAKEHOLDER PRESENTATION');
        console.log(`   Only ${excellentCount + goodCount}/${AUSTRALIAN_STOCKS.length} stocks show good accuracy`);
        console.log('   Recommend investigating data quality issues');
    }
    
    console.log('');
    console.log('🔧 DETAILED ERROR ANALYSIS');
    console.log('==============================================');
    
    const tiingoErrors = results.filter(r => !r.tiingo?.success);
    const yahooErrors = results.filter(r => !r.yahoo?.success);
    
    if (tiingoErrors.length > 0) {
        console.log('Tiingo API Errors:');
        tiingoErrors.forEach(r => {
            console.log(`  ${r.symbol}: ${r.tiingo?.error || 'Unknown error'}`);
        });
    }
    
    if (yahooErrors.length > 0) {
        console.log('Yahoo Finance Errors:');
        yahooErrors.forEach(r => {
            console.log(`  ${r.symbol}: ${r.yahoo?.error || 'Unknown error'}`);
        });
    }
    
    if (tiingoErrors.length === 0 && yahooErrors.length === 0) {
        console.log('No API errors detected - all endpoints responding correctly');
    }
    
    return {
        totalStocks: AUSTRALIAN_STOCKS.length,
        tiingoSuccess: tiingoSuccessCount,
        yahooSuccess: yahooSuccessCount,
        comparisons: successCount,
        qualityBreakdown: { excellentCount, goodCount, acceptableCount, poorCount },
        stakeholderReady,
        results
    };
}

// Run the validation
console.log('Starting Australian stocks validation...');
console.log('Make sure the dev server is running at http://localhost:8888');
console.log('');

validateAustralianStocks()
    .then(summary => {
        console.log('');
        console.log('✅ Validation completed successfully');
        console.log(`Final success rate: ${(summary.comparisons/summary.totalStocks*100).toFixed(1)}%`);
    })
    .catch(error => {
        console.error('❌ Validation failed:', error.message);
        console.error('Ensure dev server is running: npm run dev');
    });