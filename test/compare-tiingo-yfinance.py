import yfinance as yf
import requests
import json
from datetime import datetime, timedelta
import time

# Test configuration
BASE_URL = 'http://localhost:8888'
TEST_STOCKS = [
    'WOW.AX',    # Woolworths Group (ASX)
    'AAPL',      # Apple Inc (NASDAQ)
    'MSFT',      # Microsoft (NASDAQ)
    'GOOGL',     # Alphabet (NASDAQ)
    'TSLA',      # Tesla (NASDAQ)
    'BHP.AX',    # BHP Group (ASX)
    'CBA.AX',    # Commonwealth Bank (ASX)
    'CSL.AX',    # CSL Limited (ASX)
    'WES.AX',    # Wesfarmers (ASX)
    'TLS.AX'     # Telstra (ASX)
]

def format_symbol_for_tiingo(symbol):
    """Convert Yahoo Finance symbol format to Tiingo format"""
    if '.AX' in symbol:
        return symbol.replace('.AX', '')  # Remove .AX for ASX stocks
    return symbol

def get_tiingo_data(symbol):
    """Fetch latest quote from our Tiingo API"""
    try:
        tiingo_symbol = format_symbol_for_tiingo(symbol)
        url = f"{BASE_URL}/api/tiingo?symbol={tiingo_symbol}&kind=intraday_latest"
        
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            
            # Check for debugging headers
            headers = response.headers
            chosen_key = headers.get('x-tiingo-chosen-key', 'unknown')
            fallback = headers.get('x-tiingo-fallback', 'none')
            
            # Extract price data
            if isinstance(data, list) and len(data) > 0:
                quote = data[0]
            elif isinstance(data, dict):
                quote = data
            else:
                return None, f"Unexpected data format", chosen_key, fallback
                
            return {
                'symbol': quote.get('ticker', tiingo_symbol),
                'price': quote.get('lastPrice', quote.get('last', 0)),
                'prev_close': quote.get('prevClose', 0),
                'volume': quote.get('volume', 0),
                'timestamp': quote.get('timestamp', ''),
                'source': 'tiingo'
            }, None, chosen_key, fallback
            
    except Exception as e:
        return None, f"Tiingo error: {str(e)}", 'error', 'error'

def get_yfinance_data(symbol):
    """Fetch latest quote from Yahoo Finance"""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1d", interval="1m")
        info = ticker.info
        
        if hist.empty:
            return None, "No historical data available"
            
        latest = hist.iloc[-1]
        
        return {
            'symbol': symbol,
            'price': float(latest['Close']),
            'prev_close': float(info.get('previousClose', latest['Open'])),
            'volume': float(latest['Volume']),
            'timestamp': latest.name.strftime('%Y-%m-%d %H:%M:%S'),
            'source': 'yfinance'
        }, None
        
    except Exception as e:
        return None, f"Yahoo Finance error: {str(e)}"

def calculate_percentage_difference(tiingo_price, yf_price):
    """Calculate percentage difference between two prices"""
    if yf_price == 0:
        return float('inf')
    return abs(tiingo_price - yf_price) / yf_price * 100

def main():
    print("🔍 TIINGO vs YAHOO FINANCE COMPARISON TEST")
    print("=" * 60)
    print(f"Testing {len(TEST_STOCKS)} stocks...")
    print(f"Base URL: {BASE_URL}")
    print(f"Test time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    results = []
    
    for i, symbol in enumerate(TEST_STOCKS, 1):
        print(f"[{i}/{len(TEST_STOCKS)}] Testing {symbol}...")
        
        # Test Tiingo API
        tiingo_data, tiingo_error, chosen_key, fallback = get_tiingo_data(symbol)
        time.sleep(0.5)  # Rate limiting
        
        # Test Yahoo Finance
        yf_data, yf_error = get_yfinance_data(symbol)
        time.sleep(0.5)  # Rate limiting
        
        # Compare results
        if tiingo_data and yf_data:
            price_diff = calculate_percentage_difference(
                tiingo_data['price'], 
                yf_data['price']
            )
            
            print(f"  ✅ Tiingo: ${tiingo_data['price']:.2f}")
            print(f"  ✅ YFinance: ${yf_data['price']:.2f}")
            print(f"  📊 Difference: {price_diff:.2f}%")
            
            if fallback != 'none':
                print(f"  ⚠️  Using fallback data: {fallback}")
            
            results.append({
                'symbol': symbol,
                'tiingo_price': tiingo_data['price'],
                'yf_price': yf_data['price'],
                'difference_pct': price_diff,
                'tiingo_error': None,
                'yf_error': None,
                'chosen_key': chosen_key,
                'fallback': fallback,
                'status': 'success'
            })
            
        else:
            print(f"  ❌ Tiingo: {tiingo_error or 'Success'}")
            print(f"  ❌ YFinance: {yf_error or 'Success'}")
            
            results.append({
                'symbol': symbol,
                'tiingo_price': tiingo_data['price'] if tiingo_data else None,
                'yf_price': yf_data['price'] if yf_data else None,
                'difference_pct': None,
                'tiingo_error': tiingo_error,
                'yf_error': yf_error,
                'chosen_key': chosen_key if 'chosen_key' in locals() else 'unknown',
                'fallback': fallback if 'fallback' in locals() else 'unknown',
                'status': 'error'
            })
        
        print()
    
    # Summary Report
    print("📊 SUMMARY REPORT")
    print("=" * 60)
    
    successful_tests = [r for r in results if r['status'] == 'success']
    
    print(f"Total tests: {len(results)}")
    print(f"Successful comparisons: {len(successful_tests)}")
    print(f"Failed tests: {len(results) - len(successful_tests)}")
    
    if successful_tests:
        price_differences = [r['difference_pct'] for r in successful_tests]
        avg_diff = sum(price_differences) / len(price_differences)
        max_diff = max(price_differences)
        min_diff = min(price_differences)
        
        print(f"\nPrice Accuracy Analysis:")
        print(f"  Average difference: {avg_diff:.2f}%")
        print(f"  Maximum difference: {max_diff:.2f}%")
        print(f"  Minimum difference: {min_diff:.2f}%")
        
        # Check if differences are within acceptable range (5% for delayed data)
        acceptable_diff = 5.0
        accurate_count = len([d for d in price_differences if d <= acceptable_diff])
        accuracy_rate = (accurate_count / len(successful_tests)) * 100
        
        print(f"  Tests within {acceptable_diff}% difference: {accurate_count}/{len(successful_tests)} ({accuracy_rate:.1f}%)")
    
    # Detailed Results Table
    print(f"\n📋 DETAILED RESULTS")
    print("=" * 80)
    print(f"{'Symbol':<10} {'Tiingo':<10} {'YFinance':<10} {'Diff%':<8} {'Status':<10} {'Fallback':<10}")
    print("-" * 80)
    
    for result in results:
        symbol = result['symbol']
        tiingo_price = f"${result['tiingo_price']:.2f}" if result['tiingo_price'] else "ERROR"
        yf_price = f"${result['yf_price']:.2f}" if result['yf_price'] else "ERROR"
        diff_pct = f"{result['difference_pct']:.2f}%" if result['difference_pct'] is not None else "N/A"
        status = result['status']
        fallback = result['fallback']
        
        print(f"{symbol:<10} {tiingo_price:<10} {yf_price:<10} {diff_pct:<8} {status:<10} {fallback:<10}")
    
    # Environment Check
    print(f"\n🔧 ENVIRONMENT INFO")
    print("=" * 40)
    print(f"Tiingo API Key: {successful_tests[0]['chosen_key'] if successful_tests else 'Not detected'}")
    fallback_count = len([r for r in results if r['fallback'] != 'none'])
    print(f"Tests using fallback data: {fallback_count}/{len(results)}")
    
    if fallback_count > 0:
        print("⚠️  Some tests used mock/fallback data - check environment variables")
    else:
        print("✅ All tests used live data from Tiingo API")

if __name__ == "__main__":
    print("Installing required packages...")
    import subprocess
    import sys
    
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "yfinance", "requests"], 
                      check=True, capture_output=True)
        print("✅ Packages installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install packages: {e}")
        sys.exit(1)
    
    main()