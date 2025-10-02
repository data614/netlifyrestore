// Australian Stock Live Testing Script for Trading Desk Application
// This script tests QAN, WOW, and WBC directly in the main application

console.log('🇦🇺 Starting Live Australian Stock Testing in Trading Desk...');

// Helper function to wait for elements to load
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkElement = () => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            } else {
                setTimeout(checkElement, 100);
            }
        };
        checkElement();
    });
}

// Helper function to simulate typing in search
function simulateSearch(query) {
    return new Promise((resolve, reject) => {
        try {
            const searchInput = document.querySelector('#stock-search') || 
                              document.querySelector('[placeholder*="search"]') ||
                              document.querySelector('input[type="text"]');
            
            if (!searchInput) {
                reject(new Error('Search input not found'));
                return;
            }

            // Clear and type the search query
            searchInput.value = '';
            searchInput.focus();
            
            // Simulate typing character by character
            query.split('').forEach((char, index) => {
                setTimeout(() => {
                    searchInput.value += char;
                    // Trigger input events
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    searchInput.dispatchEvent(new Event('keyup', { bubbles: true }));
                    
                    if (index === query.length - 1) {
                        setTimeout(resolve, 1000); // Wait for search results
                    }
                }, index * 100);
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to wait for and check if charts are loaded
function waitForChartLoad(timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkChart = () => {
            // Look for various chart indicators
            const chartElements = [
                document.querySelector('canvas'), // Chart.js or similar
                document.querySelector('.chart'),
                document.querySelector('[id*="chart"]'),
                document.querySelector('.trading-view-widget'),
                document.querySelector('svg'), // D3.js charts
            ].filter(Boolean);

            const priceElements = [
                document.querySelector('[class*="price"]'),
                document.querySelector('[class*="stock-price"]'),
                document.querySelector('.current-price'),
            ].filter(Boolean);

            if (chartElements.length > 0 || priceElements.length > 0) {
                resolve({
                    hasChart: chartElements.length > 0,
                    hasPrice: priceElements.length > 0,
                    chartElements,
                    priceElements
                });
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Chart/price data not loaded within ${timeout}ms`));
            } else {
                setTimeout(checkChart, 500);
            }
        };
        checkChart();
    });
}

// Test individual stock
async function testStockInApp(symbol, name) {
    console.log(`\n🔍 Testing ${symbol} (${name}) in Trading Desk...`);
    
    const result = {
        symbol,
        name,
        searchFound: false,
        dataLoaded: false,
        chartDisplayed: false,
        priceDisplayed: false,
        errors: []
    };

    try {
        // Step 1: Search for the stock
        console.log(`Searching for ${symbol}...`);
        await simulateSearch(symbol);
        
        // Step 2: Wait for search results
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if search results appeared
        const searchResults = document.querySelectorAll('[class*="search-result"], [class*="result"], .symbol-result');
        if (searchResults.length > 0) {
            result.searchFound = true;
            console.log(`✅ ${symbol}: Search results found (${searchResults.length} results)`);
            
            // Click on the first result
            searchResults[0].click();
            console.log(`Clicked on ${symbol} search result...`);
            
            // Step 3: Wait for stock data to load
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Step 4: Check for chart and price data
            try {
                const chartData = await waitForChartLoad(8000);
                
                if (chartData.hasChart) {
                    result.chartDisplayed = true;
                    console.log(`✅ ${symbol}: Chart displayed`);
                }
                
                if (chartData.hasPrice) {
                    result.priceDisplayed = true;
                    console.log(`✅ ${symbol}: Price data displayed`);
                }
                
                result.dataLoaded = true;
                console.log(`✅ ${symbol}: Data loaded successfully`);
                
            } catch (chartError) {
                result.errors.push(`Chart loading failed: ${chartError.message}`);
                console.log(`⚠️ ${symbol}: ${chartError.message}`);
            }
            
        } else {
            result.errors.push('No search results found');
            console.log(`❌ ${symbol}: No search results found`);
        }
        
    } catch (error) {
        result.errors.push(`Testing failed: ${error.message}`);
        console.log(`❌ ${symbol}: Testing failed - ${error.message}`);
    }

    return result;
}

// Main testing function
async function testAllAustralianStocks() {
    console.log('\n🚀 Starting comprehensive Australian stock testing...');
    
    const stocks = [
        { symbol: 'QAN', name: 'Qantas Airways Ltd' },
        { symbol: 'WOW', name: 'Woolworths Group Limited' },
        { symbol: 'WBC', name: 'Westpac Banking Corporation' }
    ];
    
    const results = [];
    
    for (let i = 0; i < stocks.length; i++) {
        const stock = stocks[i];
        console.log(`\n📊 Testing ${i + 1}/${stocks.length}: ${stock.symbol}`);
        
        try {
            const result = await testStockInApp(stock.symbol, stock.name);
            results.push(result);
            
            // Wait between tests to avoid overwhelming the system
            if (i < stocks.length - 1) {
                console.log('Waiting before next test...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error(`Failed to test ${stock.symbol}:`, error);
            results.push({
                symbol: stock.symbol,
                name: stock.name,
                searchFound: false,
                dataLoaded: false,
                chartDisplayed: false,
                priceDisplayed: false,
                errors: [error.message]
            });
        }
    }
    
    // Generate final report
    console.log('\n📋 FINAL AUSTRALIAN STOCK TESTING REPORT');
    console.log('==========================================');
    
    const fullyWorking = results.filter(r => 
        r.searchFound && r.dataLoaded && r.chartDisplayed && r.priceDisplayed
    );
    const partiallyWorking = results.filter(r => 
        r.searchFound && (r.dataLoaded || r.chartDisplayed || r.priceDisplayed)
    );
    const notWorking = results.filter(r => !r.searchFound);
    
    console.log(`✅ Fully Working: ${fullyWorking.length}/${results.length} stocks`);
    console.log(`⚠️ Partially Working: ${partiallyWorking.length - fullyWorking.length}/${results.length} stocks`);
    console.log(`❌ Not Working: ${notWorking.length}/${results.length} stocks`);
    
    results.forEach(result => {
        const status = (result.searchFound && result.dataLoaded && result.chartDisplayed && result.priceDisplayed) 
            ? '✅ FULLY FUNCTIONAL' 
            : result.searchFound 
                ? '⚠️ PARTIALLY FUNCTIONAL' 
                : '❌ NOT FUNCTIONAL';
                
        console.log(`\n${result.symbol} (${result.name}): ${status}`);
        console.log(`  - Search: ${result.searchFound ? '✅' : '❌'}`);
        console.log(`  - Data: ${result.dataLoaded ? '✅' : '❌'}`);
        console.log(`  - Chart: ${result.chartDisplayed ? '✅' : '❌'}`);
        console.log(`  - Price: ${result.priceDisplayed ? '✅' : '❌'}`);
        
        if (result.errors.length > 0) {
            console.log(`  - Errors: ${result.errors.join(', ')}`);
        }
    });
    
    // Summary for user
    if (fullyWorking.length === results.length) {
        console.log('\n🎉 EXCELLENT: All Australian stocks are fully functional!');
        console.log('✅ QAN, WOW, and WBC can all be searched, loaded, and display charts/data properly.');
    } else if (fullyWorking.length > 0) {
        console.log(`\n✅ GOOD: ${fullyWorking.map(r => r.symbol).join(', ')} ${fullyWorking.length === 1 ? 'is' : 'are'} fully functional.`);
        const issues = results.filter(r => !fullyWorking.includes(r));
        if (issues.length > 0) {
            console.log(`⚠️ Issues with: ${issues.map(r => r.symbol).join(', ')}`);
        }
    } else {
        console.log('\n❌ ATTENTION NEEDED: Australian stocks require investigation.');
    }
    
    return results;
}

// Auto-run the test
if (typeof window !== 'undefined') {
    // Wait for page to fully load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(testAllAustralianStocks, 2000);
        });
    } else {
        setTimeout(testAllAustralianStocks, 2000);
    }
}

// Export for manual use
window.testAustralianStocks = testAllAustralianStocks;