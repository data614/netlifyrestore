# Australian Stocks Validation - PowerShell Version
# Validates 10 ASX stocks between Tiingo API and Yahoo Finance

Write-Host "🇦🇺 AUSTRALIAN SHARES VALIDATION TEST" -ForegroundColor Cyan
Write-Host "=============================================="
Write-Host "Testing ASX stocks against Yahoo Finance" -ForegroundColor Yellow
Write-Host "Test time: $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')"
Write-Host "Base URL: http://localhost:8888"
Write-Host ""

# Top 10 Australian stocks for testing
$australianStocks = @(
    @{ Symbol = "CBA"; YahooSymbol = "CBA.AX"; Name = "Commonwealth Bank"; Sector = "Banking" },
    @{ Symbol = "BHP"; YahooSymbol = "BHP.AX"; Name = "BHP Group"; Sector = "Mining" },
    @{ Symbol = "CSL"; YahooSymbol = "CSL.AX"; Name = "CSL Limited"; Sector = "Healthcare" },
    @{ Symbol = "WBC"; YahooSymbol = "WBC.AX"; Name = "Westpac Banking"; Sector = "Banking" },
    @{ Symbol = "ANZ"; YahooSymbol = "ANZ.AX"; Name = "ANZ Group Holdings"; Sector = "Banking" },
    @{ Symbol = "WOW"; YahooSymbol = "WOW.AX"; Name = "Woolworths Group"; Sector = "Retail" },
    @{ Symbol = "NAB"; YahooSymbol = "NAB.AX"; Name = "National Australia Bank"; Sector = "Banking" },
    @{ Symbol = "WES"; YahooSymbol = "WES.AX"; Name = "Wesfarmers"; Sector = "Retail" },
    @{ Symbol = "MQG"; YahooSymbol = "MQG.AX"; Name = "Macquarie Group"; Sector = "Financial Services" },
    @{ Symbol = "TLS"; YahooSymbol = "TLS.AX"; Name = "Telstra Group"; Sector = "Telecommunications" }
)

$results = @()
$successCount = 0
$tiingoSuccessCount = 0
$yahooSuccessCount = 0

Write-Host "📊 Processing stocks..." -ForegroundColor Green
Write-Host ""

for ($i = 0; $i -lt $australianStocks.Count; $i++) {
    $stock = $australianStocks[$i]
    $stockNum = $i + 1
    
    Write-Host "[$stockNum/$($australianStocks.Count)] Testing $($stock.Name) ($($stock.Symbol))..." -ForegroundColor Yellow
    
    $result = @{
        Symbol = $stock.Symbol
        Name = $stock.Name
        Sector = $stock.Sector
        TiingoSuccess = $false
        YahooSuccess = $false
        TiingoPrice = $null
        YahooPrice = $null
        TiingoError = $null
        YahooError = $null
        Accuracy = $null
        Status = "FAILED"
    }
    
    # Test Tiingo API
    try {
        $tiingoUrl = "http://localhost:8888/api/tiingo?symbol=$($stock.Symbol)" + "`&kind=intraday_latest"
        $tiingoResponse = Invoke-WebRequest -Uri $tiingoUrl -UseBasicParsing -TimeoutSec 15
        
        if ($tiingoResponse.StatusCode -eq 200) {
            $tiingoData = $tiingoResponse.Content | ConvertFrom-Json
            
            if ($tiingoData -is [array] -and $tiingoData.Count -gt 0) {
                $quote = $tiingoData[0]
            } else {
                $quote = $tiingoData
            }
            
            $price = if ($quote.lastPrice) { $quote.lastPrice } elseif ($quote.last) { $quote.last } elseif ($quote.close) { $quote.close } else { $null }
            
            if ($price -and $price -gt 0) {
                $result.TiingoSuccess = $true
                $result.TiingoPrice = $price
                Write-Host "  ✅ Tiingo: `$$($price.ToString('F2')) AUD" -ForegroundColor Green
                $tiingoSuccessCount++
            } else {
                $result.TiingoError = "Invalid price data"
                Write-Host "  ❌ Tiingo: Invalid price data" -ForegroundColor Red
            }
        } else {
            $result.TiingoError = "HTTP $($tiingoResponse.StatusCode)"
            Write-Host "  ❌ Tiingo: HTTP $($tiingoResponse.StatusCode)" -ForegroundColor Red
        }
    }
    catch {
        $result.TiingoError = $_.Exception.Message
        Write-Host "  ❌ Tiingo: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test Yahoo Finance API
    try {
        $yahooUrl = "https://query1.finance.yahoo.com/v8/finance/chart/$($stock.YahooSymbol)"
        $yahooResponse = Invoke-WebRequest -Uri $yahooUrl -UseBasicParsing -TimeoutSec 15
        
        if ($yahooResponse.StatusCode -eq 200) {
            $yahooData = $yahooResponse.Content | ConvertFrom-Json
            $resultData = $yahooData.chart.result[0]
            $meta = $resultData.meta
            $quote = $resultData.indicators.quote[0]
            $timestamps = $resultData.timestamp
            
            $latestIndex = $timestamps.Count - 1
            $price = if ($quote.close[$latestIndex]) { $quote.close[$latestIndex] } else { $meta.regularMarketPrice }
            
            if ($price -and $price -gt 0) {
                $result.YahooSuccess = $true
                $result.YahooPrice = $price
                Write-Host "  ✅ Yahoo: `$$($price.ToString('F2')) AUD" -ForegroundColor Green
                $yahooSuccessCount++
            } else {
                $result.YahooError = "Invalid price data"
                Write-Host "  ❌ Yahoo: Invalid price data" -ForegroundColor Red
            }
        } else {
            $result.YahooError = "HTTP $($yahooResponse.StatusCode)"
            Write-Host "  ❌ Yahoo: HTTP $($yahooResponse.StatusCode)" -ForegroundColor Red
        }
    }
    catch {
        $result.YahooError = $_.Exception.Message
        Write-Host "  ❌ Yahoo: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Calculate accuracy if both succeeded
    if ($result.TiingoSuccess -and $result.YahooSuccess) {
        $difference = [Math]::Abs($result.TiingoPrice - $result.YahooPrice)
        $percentage = ($difference / $result.YahooPrice) * 100
        
        if ($percentage -lt 0.5) {
            $result.Status = "✅ EXCELLENT"
        } elseif ($percentage -lt 2.0) {
            $result.Status = "✅ GOOD"
        } elseif ($percentage -lt 5.0) {
            $result.Status = "⚠️ ACCEPTABLE"
        } else {
            $result.Status = "❌ POOR"
        }
        
        $result.Accuracy = "$($percentage.ToString('F2'))%"
        Write-Host "  📊 Accuracy: $($result.Status) ($($result.Accuracy) difference)" -ForegroundColor Cyan
        $successCount++
    } else {
        Write-Host "  ⚠️ Cannot compare - API error" -ForegroundColor Yellow
    }
    
    $results += $result
    Write-Host ""
    
    # Small delay to avoid overwhelming APIs
    if ($i -lt $australianStocks.Count - 1) {
        Start-Sleep -Milliseconds 500
    }
}

# Generate summary report
Write-Host "📈 SUMMARY REPORT" -ForegroundColor Cyan
Write-Host "=============================================="
Write-Host "Total stocks tested: $($australianStocks.Count)"
Write-Host "Tiingo API success: $tiingoSuccessCount/$($australianStocks.Count) ($([Math]::Round($tiingoSuccessCount/$australianStocks.Count*100, 1))%)"
Write-Host "Yahoo Finance success: $yahooSuccessCount/$($australianStocks.Count) ($([Math]::Round($yahooSuccessCount/$australianStocks.Count*100, 1))%)"
Write-Host "Successful comparisons: $successCount/$($australianStocks.Count) ($([Math]::Round($successCount/$australianStocks.Count*100, 1))%)"
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
        $tiingoPrice = "`$$($result.TiingoPrice.ToString('F2'))".PadRight(9)
    } else {
        $tiingoPrice = "ERROR".PadRight(9)
    }
    
    if ($result.YahooSuccess) {
        $yahooPrice = "`$$($result.YahooPrice.ToString('F2'))".PadRight(9)
    } else {
        $yahooPrice = "ERROR".PadRight(9)
    }
    
    $accuracy = if ($result.Accuracy) { $result.Accuracy.PadRight(8) } else { "N/A".PadRight(8) }
    $status = $result.Status
    
    Write-Host "$symbol | $name | $tiingoPrice | $yahooPrice | $accuracy | $status"
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
$stakeholderReady = $goodAccuracyCount -ge ($australianStocks.Count * 0.7)

Write-Host "🎪 STAKEHOLDER PRESENTATION READINESS" -ForegroundColor Cyan
Write-Host "=============================================="
if ($stakeholderReady) {
    Write-Host "✅ READY FOR STAKEHOLDER PRESENTATION" -ForegroundColor Green
    Write-Host "   $goodAccuracyCount/$($australianStocks.Count) stocks show excellent/good accuracy"
    Write-Host "   Data quality meets professional standards"
} else {
    Write-Host "⚠️ NEEDS IMPROVEMENT BEFORE STAKEHOLDER PRESENTATION" -ForegroundColor Yellow
    Write-Host "   Only $goodAccuracyCount/$($australianStocks.Count) stocks show good accuracy"
    Write-Host "   Recommend investigating data quality issues"
}

Write-Host ""
Write-Host "🔧 DETAILED ERROR ANALYSIS" -ForegroundColor Cyan
Write-Host "=============================================="

$tiingoErrors = $results | Where-Object { -not $_.TiingoSuccess }
$yahooErrors = $results | Where-Object { -not $_.YahooSuccess }

if ($tiingoErrors.Count -gt 0) {
    Write-Host "Tiingo API Errors:" -ForegroundColor Red
    foreach ($error in $tiingoErrors) {
        Write-Host "  $($error.Symbol): $($error.TiingoError)"
    }
    Write-Host ""
}

if ($yahooErrors.Count -gt 0) {
    Write-Host "Yahoo Finance Errors:" -ForegroundColor Red
    foreach ($error in $yahooErrors) {
        Write-Host "  $($error.Symbol): $($error.YahooError)"
    }
    Write-Host ""
}

if ($tiingoErrors.Count -eq 0 -and $yahooErrors.Count -eq 0) {
    Write-Host "No API errors detected - all endpoints responding correctly" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Validation completed successfully" -ForegroundColor Green
Write-Host "Final success rate: $([Math]::Round($successCount/$australianStocks.Count*100, 1))%" -ForegroundColor Cyan