// Apple Inc (AAPL) Data Validation: Tiingo vs Yahoo Finance
const BASE_URL = 'http://localhost:8888';

async function getTiingoAppleData() {
    try {
        const url = `${BASE_URL}/api/tiingo?symbol=AAPL&kind=intraday_latest`;
        console.log(`🔗 Fetching Tiingo data: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Raw Tiingo response:', JSON.stringify(data, null, 2));
        
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
            symbol: 'AAPL',
            source: 'Tiingo',
            price: quote.lastPrice || quote.last || quote.close || 0,
            prevClose: quote.prevClose || 0,
            volume: quote.volume || 0,
            timestamp: quote.timestamp || new Date().toISOString(),
            currency: 'USD',
            exchange: 'NASDAQ',
            headers: {
                chosenKey: response.headers.get('x-tiingo-chosen-key'),
                fallback: response.headers.get('x-tiingo-fallback'),
                source: response.headers.get('X-Tiingo-Source')
            },
            rawData: quote
        };
    } catch (error) {
        console.error('❌ Tiingo API Error:', error.message);
        return { error: error.message, source: 'Tiingo' };
    }
}

async function getYahooAppleData() {
    try {
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/AAPL';
        console.log(`🔗 Fetching Yahoo Finance data: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Raw Yahoo response structure:', {
            hasChart: !!data.chart,
            hasResult: !!data.chart?.result,
            resultLength: data.chart?.result?.length || 0
        });
        
        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators.quote[0];
        const timestamps = result.timestamp;
        
        // Get the latest data point
        const latestIndex = timestamps.length - 1;
        
        return {
            symbol: meta.symbol,
            source: 'Yahoo Finance',
            price: quote.close[latestIndex] || meta.regularMarketPrice,
            prevClose: meta.previousClose,
            volume: quote.volume[latestIndex],
            timestamp: new Date(timestamps[latestIndex] * 1000).toISOString(),
            currency: meta.currency,
            exchange: meta.exchangeName,
            marketState: meta.marketState,
            companyName: meta.longName || meta.shortName,
            rawMeta: meta
        };
    } catch (error) {
        console.error('❌ Yahoo Finance API Error:', error.message);
        return { error: error.message, source: 'Yahoo Finance' };
    }
}

function calculateDifference(price1, price2) {
    if (!price1 || !price2) return 'N/A';
    const diff = Math.abs(price1 - price2);
    const percentage = (diff / price1) * 100;
    return {
        absolute: diff.toFixed(4),
        percentage: percentage.toFixed(2) + '%'
    };
}

function formatPrice(price, currency = 'USD') {
    if (!price) return 'N/A';
    return `$${price.toFixed(2)} ${currency}`;
}

async function validateAppleData() {
    console.log('🍎 APPLE INC (AAPL) DATA VALIDATION');
    console.log('=====================================================');
    console.log(`Test time: ${new Date().toISOString()}`);
    console.log('');
    
    console.log('📊 Fetching data from both sources...');
    const [tiingoData, yahooData] = await Promise.all([
        getTiingoAppleData(),
        getYahooAppleData()
    ]);
    
    console.log('\n📈 RESULTS COMPARISON');
    console.log('=====================================================');
    
    if (tiingoData.error) {
        console.log(`❌ Tiingo: ${tiingoData.error}`);
    } else {
        console.log(`✅ Tiingo: ${formatPrice(tiingoData.price, tiingoData.currency)}`);
        console.log(`   Volume: ${tiingoData.volume?.toLocaleString() || 'N/A'}`);
        console.log(`   Prev Close: ${formatPrice(tiingoData.prevClose, tiingoData.currency)}`);
        console.log(`   Timestamp: ${tiingoData.timestamp}`);
        console.log(`   Headers: ${JSON.stringify(tiingoData.headers, null, 2)}`);
    }
    
    console.log('');
    
    if (yahooData.error) {
        console.log(`❌ Yahoo Finance: ${yahooData.error}`);
    } else {
        console.log(`✅ Yahoo Finance: ${formatPrice(yahooData.price, yahooData.currency)}`);
        console.log(`   Company: ${yahooData.companyName}`);
        console.log(`   Exchange: ${yahooData.exchange}`);
        console.log(`   Volume: ${yahooData.volume?.toLocaleString() || 'N/A'}`);
        console.log(`   Prev Close: ${formatPrice(yahooData.prevClose, yahooData.currency)}`);
        console.log(`   Market State: ${yahooData.marketState}`);
        console.log(`   Timestamp: ${yahooData.timestamp}`);
    }
    
    console.log('\n🔍 ACCURACY ANALYSIS');
    console.log('=====================================================');
    
    if (!tiingoData.error && !yahooData.error) {
        const priceDiff = calculateDifference(tiingoData.price, yahooData.price);
        const volumeDiff = calculateDifference(tiingoData.volume, yahooData.volume);
        
        console.log(`Price Difference: ${priceDiff.absolute} (${priceDiff.percentage})`);
        console.log(`Volume Difference: ${volumeDiff.absolute} (${volumeDiff.percentage})`);
        
        const priceAccuracy = parseFloat(priceDiff.percentage) < 1.0 ? '✅ ACCURATE' : '⚠️  SIGNIFICANT DIFFERENCE';
        console.log(`Price Accuracy: ${priceAccuracy}`);
        
        if (parseFloat(priceDiff.percentage) > 5.0) {
            console.log('🚨 WARNING: Price difference exceeds 5%!');
        }
    } else {
        console.log('❌ Cannot compare due to API errors');
    }
    
    console.log('\n📋 DETAILED DATA DUMPS');
    console.log('=====================================================');
    
    if (!tiingoData.error) {
        console.log('Tiingo Raw Data:', JSON.stringify(tiingoData.rawData, null, 2));
    }
    
    if (!yahooData.error) {
        console.log('Yahoo Meta Data:', JSON.stringify(yahooData.rawMeta, null, 2));
    }
}

// Run the validation
validateAppleData().catch(console.error);