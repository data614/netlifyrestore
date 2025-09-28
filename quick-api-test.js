// Quick test to check if the API is working
console.log('Testing Tiingo API endpoint...');

async function testAPI() {
  const endpoints = [
    'http://localhost:8888/api/tiingo?symbol=AAPL&kind=eod&limit=3',
    'http://localhost:8888/.netlify/functions/tiingo?symbol=AAPL&kind=eod&limit=3',
    'http://localhost:8888/.netlify/functions/tiingo-data?symbol=AAPL&kind=eod&limit=3'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\nTesting: ${endpoint}`);
    try {
      const response = await fetch(endpoint);
      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);
      
      const text = await response.text();
      console.log('Response text (first 200 chars):', text.substring(0, 200));
      
      // Try to parse as JSON
      try {
        const json = JSON.parse(text);
        console.log('✅ Valid JSON response:', json);
        return; // Stop testing if we found a working endpoint
      } catch (e) {
        console.log('❌ Not JSON response. Likely HTML page returned.');
      }
      
    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
  }
}

testAPI();