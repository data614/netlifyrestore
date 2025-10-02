// Quick test to verify Woolworths data accuracy
async function testWoolworthsData() {
    console.log('🏪 WOOLWORTHS DATA VERIFICATION TEST');
    console.log('='.repeat(50));
    
    try {
        // Test our API
        const tiingoResponse = await fetch('http://localhost:8888/api/tiingo?symbol=WOW&kind=intraday_latest');
        const tiingoHeaders = {
            chosenKey: tiingoResponse.headers.get('x-tiingo-chosen-key'),
            fallback: tiingoResponse.headers.get('x-tiingo-fallback'),
            source: tiingoResponse.headers.get('X-Tiingo-Source')
        };
        
        if (tiingoResponse.ok) {
            const tiingoData = await tiingoResponse.json();
            console.log('✅ Tiingo API Response:');
            console.log(`   Symbol: ${tiingoData[0]?.ticker || tiingoData?.ticker || 'Unknown'}`);
            console.log(`   Price: $${tiingoData[0]?.lastPrice || tiingoData?.lastPrice || 'Unknown'}`);
            console.log(`   Volume: ${tiingoData[0]?.volume || tiingoData?.volume || 'Unknown'}`);
            console.log(`   Source: ${tiingoHeaders.source || 'Unknown'}`);
            console.log(`   Fallback: ${tiingoHeaders.fallback || 'none'}`);
            console.log(`   API Key: ${tiingoHeaders.chosenKey || 'Unknown'}`);
            
            // Compare with expected value
            const actualPrice = tiingoData[0]?.lastPrice || tiingoData?.lastPrice;
            const expectedPrice = 26.56; // From Google Finance
            
            if (actualPrice) {
                const difference = Math.abs(actualPrice - expectedPrice);
                const percentDiff = (difference / expectedPrice) * 100;
                
                console.log('\n📊 Accuracy Check:');
                console.log(`   Expected (Google): $${expectedPrice}`);
                console.log(`   Actual (Tiingo): $${actualPrice}`);
                console.log(`   Difference: $${difference.toFixed(2)} (${percentDiff.toFixed(2)}%)`);
                
                if (percentDiff < 5) {
                    console.log('   ✅ EXCELLENT - Within 5% tolerance');
                } else if (percentDiff < 10) {
                    console.log('   ⚠️  ACCEPTABLE - Within 10% tolerance');
                } else {
                    console.log('   ❌ POOR - Outside acceptable tolerance');
                }
            }
            
        } else {
            console.log(`❌ Tiingo API Error: ${tiingoResponse.status}`);
        }
        
    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
    }
    
    console.log('\n🏁 Test complete!');
}

testWoolworthsData();