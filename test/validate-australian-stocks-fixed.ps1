# Australian Stocks Validation - PowerShell Version
# Validates 10 ASX stocks between Tiingo API and Yahoo Finance

Write-Host "🇦🇺 AUSTRALIAN SHARES VALIDATION TEST" -ForegroundColor Cyan
Write-Host "=============================================="
Write-Host "Testing ASX stocks against Yahoo Finance" -ForegroundColor Yellow
Write-Host "Test time: $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')"
Write-Host "Base URL: http://localhost:8888"
Write-Host ""

# Top 10 Australian stocks for testing - using simple array
$stocks = @(
    "CBA,CBA.AX,Commonwealth Bank,Banking",
    "BHP,BHP.AX,BHP Group,Mining", 
    "CSL,CSL.AX,CSL Limited,Healthcare",
    "WBC,WBC.AX,Westpac Banking,Banking",
    "ANZ,ANZ.AX,ANZ Group Holdings,Banking",
    "WOW,WOW.AX,Woolworths Group,Retail",
    "NAB,NAB.AX,National Australia Bank,Banking",
    "WES,WES.AX,Wesfarmers,Retail",
    "MQG,MQG.AX,Macquarie Group,Financial Services",
    "TLS,TLS.AX,Telstra Group,Telecommunications"
)

$results = @()
$successCount = 0
$tiingoSuccessCount = 0
$yahooSuccessCount = 0
$totalStocks = $stocks.Count

Write-Host "📊 Processing $totalStocks stocks..." -ForegroundColor Green
Write-Host ""

for ($i = 0; $i -lt $stocks.Count; $i++) {
    $stockInfo = $stocks[$i].Split(',')
    $symbol = $stockInfo[0]
    $yahooSymbol = $stockInfo[1] 
    $name = $stockInfo[2]
    $sector = $stockInfo[3]
    
    $stockNum = $i + 1
    
    Write-Host "[$stockNum/$totalStocks] Testing $name ($symbol)..." -ForegroundColor Yellow
    
    $tiingoSuccess = $false
    $yahooSuccess = $false
    $tiingoPrice = 0
    $yahooPrice = 0
    $tiingoError = ""
    $yahooError = ""
    $accuracy = ""
    $status = "FAILED"
    
    # Test Tiingo API
    try {
        $tiingoUrl = "http://localhost:8888/api/tiingo?symbol=$symbol&kind=intraday_latest"
        $tiingoResponse = Invoke-WebRequest -Uri $tiingoUrl -UseBasicParsing -TimeoutSec 15
        
        if ($tiingoResponse.StatusCode -eq 200) {
            $tiingoData = $tiingoResponse.Content | ConvertFrom-Json
            
            if ($tiingoData -is [array] -and $tiingoData.Count -gt 0) {
                $quote = $tiingoData[0]
            } else {
                $quote = $tiingoData
            }
            
            $price = 0
            if ($quote.lastPrice) { $price = $quote.lastPrice }
            elseif ($quote.last) { $price = $quote.last }
            elseif ($quote.close) { $price = $quote.close }
            
            if ($price -gt 0) {
                $tiingoSuccess = $true
                $tiingoPrice = $price
                Write-Host "  ✅ Tiingo: `$$($price.ToString('F2')) AUD" -ForegroundColor Green
                $tiingoSuccessCount++
            } else {
                $tiingoError = "Invalid price data"
                Write-Host "  ❌ Tiingo: Invalid price data" -ForegroundColor Red
            }
        } else {
            $tiingoError = "HTTP $($tiingoResponse.StatusCode)"
            Write-Host "  ❌ Tiingo: HTTP $($tiingoResponse.StatusCode)" -ForegroundColor Red
        }
    }
    catch {
        $tiingoError = $_.Exception.Message
        Write-Host "  ❌ Tiingo: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test Yahoo Finance API
    try {
        $yahooUrl = "https://query1.finance.yahoo.com/v8/finance/chart/$yahooSymbol"
        $yahooResponse = Invoke-WebRequest -Uri $yahooUrl -UseBasicParsing -TimeoutSec 15
        
        if ($yahooResponse.StatusCode -eq 200) {
            $yahooData = $yahooResponse.Content | ConvertFrom-Json
            $resultData = $yahooData.chart.result[0]
            $meta = $resultData.meta
            $quote = $resultData.indicators.quote[0]
            $timestamps = $resultData.timestamp
            
            $latestIndex = $timestamps.Count - 1
            $price = 0
            if ($quote.close[$latestIndex]) { $price = $quote.close[$latestIndex] }
            elseif ($meta.regularMarketPrice) { $price = $meta.regularMarketPrice }
            
            if ($price -gt 0) {
                $yahooSuccess = $true
                $yahooPrice = $price
                Write-Host "  ✅ Yahoo: `$$($price.ToString('F2')) AUD" -ForegroundColor Green
                $yahooSuccessCount++
            } else {
                $yahooError = "Invalid price data"
                Write-Host "  ❌ Yahoo: Invalid price data" -ForegroundColor Red
            }
        } else {
            $yahooError = "HTTP $($yahooResponse.StatusCode)"
            Write-Host "  ❌ Yahoo: HTTP $($yahooResponse.StatusCode)" -ForegroundColor Red
        }
    }
    catch {
        $yahooError = $_.Exception.Message
        Write-Host "  ❌ Yahoo: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Calculate accuracy if both succeeded
    if ($tiingoSuccess -and $yahooSuccess) {
        $difference = [Math]::Abs($tiingoPrice - $yahooPrice)
        $percentage = ($difference / $yahooPrice) * 100
        
        if ($percentage -lt 0.5) {
            $status = "✅ EXCELLENT"
        } elseif ($percentage -lt 2.0) {
            $status = "✅ GOOD"
        } elseif ($percentage -lt 5.0) {
            $status = "⚠️ ACCEPTABLE"
        } else {
            $status = "❌ POOR"
        }
        
        $accuracy = "$($percentage.ToString('F2'))%"
        Write-Host "  📊 Accuracy: $status ($accuracy difference)" -ForegroundColor Cyan
        $successCount++
    } else {
        Write-Host "  ⚠️ Cannot compare - API error" -ForegroundColor Yellow
    }
    
    # Store result
    $result = @{
        Symbol = $symbol
        Name = $name
        Sector = $sector
        TiingoSuccess = $tiingoSuccess
        YahooSuccess = $yahooSuccess
        TiingoPrice = $tiingoPrice
        YahooPrice = $yahooPrice
        TiingoError = $tiingoError
        YahooError = $yahooError
        Accuracy = $accuracy
        Status = $status
    }
    $results += $result
    
    Write-Host ""
    
    # Small delay to avoid overwhelming APIs
    if ($i -lt $stocks.Count - 1) {
        Start-Sleep -Milliseconds 500
    }
}

# Generate summary report
Write-Host "📈 SUMMARY REPORT" -ForegroundColor Cyan
Write-Host "=============================================="
Write-Host "Total stocks tested: $totalStocks"

$tiingoPercent = [Math]::Round($tiingoSuccessCount/$totalStocks*100, 1)
$yahooPercent = [Math]::Round($yahooSuccessCount/$totalStocks*100, 1) 
$successPercent = [Math]::Round($successCount/$totalStocks*100, 1)

Write-Host "Tiingo API success: $tiingoSuccessCount/$totalStocks ($tiingoPercent%)"
Write-Host "Yahoo Finance success: $yahooSuccessCount/$totalStocks ($yahooPercent%)"
Write-Host "Successful comparisons: $successCount/$totalStocks ($successPercent%)"
Write-Host ""

# Detailed comparison table
Write-Host "📋 DETAILED COMPARISON TABLE" -ForegroundColor Cyan
Write-Host "=============================================="
Write-Host "Symbol | Company           | Tiingo    | Yahoo     | Accuracy | Status"
Write-Host "-------|-------------------|-----------|-----------|----------|--------"

foreach ($result in $results) {
    $symbol = $result.Symbol.PadRight(6)
    $name = $result.Name.Substring(0, [Math]::Min(17, $result.Name.Length)).PadRight(17)
    
    if ($result.TiingoSuccess) {
        $tiingoDisplay = "`$$($result.TiingoPrice.ToString('F2'))".PadRight(9)
    } else {
        $tiingoDisplay = "ERROR".PadRight(9)
    }
    
    if ($result.YahooSuccess) {
        $yahooDisplay = "`$$($result.YahooPrice.ToString('F2'))".PadRight(9)
    } else {
        $yahooDisplay = "ERROR".PadRight(9)
    }
    
    $accuracyDisplay = if ($result.Accuracy) { $result.Accuracy.PadRight(8) } else { "N/A".PadRight(8) }
    $statusDisplay = $result.Status
    
    Write-Host "$symbol | $name | $tiingoDisplay | $yahooDisplay | $accuracyDisplay | $statusDisplay"
}

Write-Host ""

# Quality assessment
$excellentCount = ($results | Where-Object { $_.Status -eq "✅ EXCELLENT" }).Count
$goodCount = ($results | Where-Object { $_.Status -eq "✅ GOOD" }).Count
$acceptableCount = ($results | Where-Object { $_.Status -eq "⚠️ ACCEPTABLE" }).Count
$poorCount = ($results | Where-Object { $_.Status -eq "❌ POOR" }).Count

Write-Host "🎯 DATA QUALITY ASSESSMENT" -ForegroundColor Cyan
Write-Host "=============================================="
Write-Host "✅ Excellent accuracy (<0.5%): $excellentCount stocks" -ForegroundColor Green
Write-Host "✅ Good accuracy (0.5-2%): $goodCount stocks" -ForegroundColor Green
Write-Host "⚠️ Acceptable accuracy (2-5%): $acceptableCount stocks" -ForegroundColor Yellow
Write-Host "❌ Poor accuracy (>5%): $poorCount stocks" -ForegroundColor Red
Write-Host ""

# Stakeholder readiness assessment
$goodAccuracyCount = $excellentCount + $goodCount
$stakeholderThreshold = [Math]::Round($totalStocks * 0.7)
$stakeholderReady = $goodAccuracyCount -ge $stakeholderThreshold

Write-Host "🎪 STAKEHOLDER PRESENTATION READINESS" -ForegroundColor Cyan
Write-Host "=============================================="
if ($stakeholderReady) {
    Write-Host "✅ READY FOR STAKEHOLDER PRESENTATION" -ForegroundColor Green
    Write-Host "   $goodAccuracyCount/$totalStocks stocks show excellent/good accuracy"
    Write-Host "   Data quality meets professional standards"
} else {
    Write-Host "⚠️ NEEDS IMPROVEMENT BEFORE STAKEHOLDER PRESENTATION" -ForegroundColor Yellow
    Write-Host "   Only $goodAccuracyCount/$totalStocks stocks show good accuracy"
    Write-Host "   Recommend investigating data quality issues"
}

Write-Host ""
Write-Host "✅ Validation completed successfully" -ForegroundColor Green
Write-Host "Final success rate: $successPercent%" -ForegroundColor Cyan