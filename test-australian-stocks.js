// Australian Stock Testing Script
// This script will test QAN, WOW, and WBC in the Trading Desk application

console.log('🇦🇺 Starting Australian Stock Testing...');

// Test data structure
const testStocks = [
  { symbol: 'QAN', name: 'Qantas Airways Ltd', exchange: 'ASX' },
  { symbol: 'WOW', name: 'Woolworths Group Limited', exchange: 'ASX' },
  { symbol: 'WBC', name: 'Westpac Banking Corporation', exchange: 'ASX' }
];

// Test each stock
async function testAustralianStocks() {
  const results = [];
  
  for (const stock of testStocks) {
    console.log(`\n📊 Testing ${stock.symbol} (${stock.name})...`);
    
    try {
      // Test search functionality
      const searchUrl = new URL('/api/search', window.location.origin);
      searchUrl.searchParams.set('q', stock.symbol);
      searchUrl.searchParams.set('limit', '1');
      searchUrl.searchParams.set('exchange', 'ASX');
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      // Test Tiingo data fetch
      const tiingoUrl = new URL('/api/tiingo', window.location.origin);
      tiingoUrl.searchParams.set('symbol', stock.symbol);
      tiingoUrl.searchParams.set('kind', 'meta');
      
      const tiingoResponse = await fetch(tiingoUrl);
      const tiingoData = await tiingoResponse.json();
      
      // Test historical data
      const histUrl = new URL('/api/tiingo', window.location.origin);
      histUrl.searchParams.set('symbol', stock.symbol);
      histUrl.searchParams.set('kind', 'history');
      histUrl.searchParams.set('days', '30');
      
      const histResponse = await fetch(histUrl);
      const histData = await histResponse.json();
      
      const result = {
        symbol: stock.symbol,
        name: stock.name,
        searchAvailable: searchResponse.ok && searchData?.data?.length > 0,
        metaDataAvailable: tiingoResponse.ok && tiingoData?.data,
        historicalDataAvailable: histResponse.ok && histData?.data?.length > 0,
        errors: []
      };
      
      if (!searchResponse.ok) result.errors.push(`Search failed: ${searchResponse.status}`);
      if (!tiingoResponse.ok) result.errors.push(`Meta data failed: ${tiingoResponse.status}`);
      if (!histResponse.ok) result.errors.push(`Historical data failed: ${histResponse.status}`);
      
      results.push(result);
      
      console.log(`✅ ${stock.symbol} Search: ${result.searchAvailable ? 'OK' : 'FAIL'}`);
      console.log(`✅ ${stock.symbol} Meta Data: ${result.metaDataAvailable ? 'OK' : 'FAIL'}`);
      console.log(`✅ ${stock.symbol} Historical: ${result.historicalDataAvailable ? 'OK' : 'FAIL'}`);
      
      if (result.errors.length > 0) {
        console.log(`❌ Errors: ${result.errors.join(', ')}`);
      }
      
    } catch (error) {
      console.error(`❌ ${stock.symbol} test failed:`, error);
      results.push({
        symbol: stock.symbol,
        name: stock.name,
        searchAvailable: false,
        metaDataAvailable: false,
        historicalDataAvailable: false,
        errors: [error.message]
      });
    }
  }
  
  // Summary
  console.log('\n🏁 Australian Stock Testing Summary:');
  console.log('=====================================');
  
  results.forEach(result => {
    const status = (result.searchAvailable && result.metaDataAvailable && result.historicalDataAvailable) ? '✅ PASS' : '❌ FAIL';
    console.log(`${result.symbol} (${result.name}): ${status}`);
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.join(', ')}`);
    }
  });
  
  return results;
}

// Run the test if this script is executed directly
if (typeof window !== 'undefined') {
  testAustralianStocks().then(results => {
    console.log('Test completed!', results);
  }).catch(error => {
    console.error('Test suite failed:', error);
  });
}

export { testAustralianStocks };