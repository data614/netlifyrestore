# Australian Stocks Validation Test
Write-Host "🇦🇺 AUSTRALIAN SHARES VALIDATION TEST" -ForegroundColor Cyan
Write-Host "=============================================="

$symbols = @("CBA", "BHP", "CSL", "WBC", "ANZ", "WOW", "NAB", "WES", "MQG", "TLS")
$yahooSymbols = @("CBA.AX", "BHP.AX", "CSL.AX", "WBC.AX", "ANZ.AX", "WOW.AX", "NAB.AX", "WES.AX", "MQG.AX", "TLS.AX")
$names = @("Commonwealth Bank", "BHP Group", "CSL Limited", "Westpac Banking", "ANZ Group", "Woolworths Group", "National Australia Bank", "Wesfarmers", "Macquarie Group", "Telstra Group")

$results = @()
$successCount = 0
$tiingoSuccess = 0 
$yahooSuccess = 0

Write-Host "Testing $($symbols.Count) Australian stocks..."
Write-Host ""

for ($i = 0; $i -lt $symbols.Count; $i++) {
    $symbol = $symbols[$i]
    $yahooSymbol = $yahooSymbols[$i]
    $name = $names[$i]
    
    Write-Host "[$($i+1)/$($symbols.Count)] Testing $name ($symbol)..." -ForegroundColor Yellow
    
    $tiingoPrice = $null
    $yahooPrice = $null
    $tiingoError = ""
    $yahooError = ""
    
    # Test Tiingo API
    try {
        $tiingoUrl = "http://localhost:8888/api/tiingo?symbol=" + $symbol + "&" + "kind=intraday_latest"
        $response = Invoke-WebRequest -Uri $tiingoUrl -UseBasicParsing -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            if ($data -is [array]) { $quote = $data[0] } else { $quote = $data }
            
            if ($quote.lastPrice) { $tiingoPrice = $quote.lastPrice }
            elseif ($quote.last) { $tiingoPrice = $quote.last }
            elseif ($quote.close) { $tiingoPrice = $quote.close }
            
            if ($tiingoPrice -gt 0) {
                Write-Host "  ✅ Tiingo: `$$($tiingoPrice.ToString('F2')) AUD" -ForegroundColor Green
                $tiingoSuccess++
            } else {
                $tiingoError = "No valid price"
                Write-Host "  ❌ Tiingo: No valid price" -ForegroundColor Red
            }
        } else {
            $tiingoError = "HTTP $($response.StatusCode)"
            Write-Host "  ❌ Tiingo: HTTP $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        $tiingoError = $_.Exception.Message
        Write-Host "  ❌ Tiingo: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test Yahoo Finance
    try {
        $yahooUrl = "https://query1.finance.yahoo.com/v8/finance/chart/$yahooSymbol"
        $response = Invoke-WebRequest -Uri $yahooUrl -UseBasicParsing -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            $result = $data.chart.result[0]
            $meta = $result.meta
            $quote = $result.indicators.quote[0]
            
            if ($quote.close -and $quote.close.Count -gt 0) {
                $yahooPrice = $quote.close[-1]
            } elseif ($meta.regularMarketPrice) {
                $yahooPrice = $meta.regularMarketPrice
            }
            
            if ($yahooPrice -gt 0) {
                Write-Host "  ✅ Yahoo: `$$($yahooPrice.ToString('F2')) AUD" -ForegroundColor Green
                $yahooSuccess++
            } else {
                $yahooError = "No valid price"
                Write-Host "  ❌ Yahoo: No valid price" -ForegroundColor Red
            }
        } else {
            $yahooError = "HTTP $($response.StatusCode)"
            Write-Host "  ❌ Yahoo: HTTP $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        $yahooError = $_.Exception.Message
        Write-Host "  ❌ Yahoo: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Calculate accuracy
    $accuracy = "N/A"
    $status = "FAILED"
    
    if ($tiingoPrice -and $yahooPrice -and $tiingoPrice -gt 0 -and $yahooPrice -gt 0) {
        $diff = [Math]::Abs($tiingoPrice - $yahooPrice)
        $percent = ($diff / $yahooPrice) * 100
        $accuracy = "$($percent.ToString('F2'))%"
        
        if ($percent -lt 0.5) { $status = "✅ EXCELLENT" }
        elseif ($percent -lt 2.0) { $status = "✅ GOOD" }
        elseif ($percent -lt 5.0) { $status = "⚠️ ACCEPTABLE" }
        else { $status = "❌ POOR" }
        
        Write-Host "  📊 Accuracy: $status ($accuracy difference)" -ForegroundColor Cyan
        $successCount++
    } else {
        Write-Host "  ⚠️ Cannot compare - missing data" -ForegroundColor Yellow
    }
    
    $results += @{
        Symbol = $symbol
        Name = $name
        TiingoPrice = $tiingoPrice
        YahooPrice = $yahooPrice
        Accuracy = $accuracy
        Status = $status
        TiingoError = $tiingoError
        YahooError = $yahooError
    }
    
    Write-Host ""
    Start-Sleep -Milliseconds 500
}

# Summary Report
Write-Host "📈 SUMMARY REPORT" -ForegroundColor Cyan
Write-Host "=============================================="
Write-Host "Total stocks tested: $($symbols.Count)"

$tiingoPercent = [Math]::Round(($tiingoSuccess / $symbols.Count) * 100, 1)
$yahooPercent = [Math]::Round(($yahooSuccess / $symbols.Count) * 100, 1)
$successPercent = [Math]::Round(($successCount / $symbols.Count) * 100, 1)

Write-Host "Tiingo API success: $tiingoSuccess/$($symbols.Count) ($tiingoPercent%)"
Write-Host "Yahoo Finance success: $yahooSuccess/$($symbols.Count) ($yahooPercent%)"
Write-Host "Successful comparisons: $successCount/$($symbols.Count) ($successPercent%)"
Write-Host ""

# Detailed Table
Write-Host "📋 DETAILED RESULTS" -ForegroundColor Cyan
Write-Host "=============================================="
Write-Host "Symbol | Company           | Tiingo    | Yahoo     | Accuracy | Status"
Write-Host "-------|-------------------|-----------|-----------|----------|--------"

foreach ($result in $results) {
    $sym = $result.Symbol.PadRight(6)
    $name = $result.Name.Substring(0, [Math]::Min(17, $result.Name.Length)).PadRight(17)
    
    $tiingoDisplay = if ($result.TiingoPrice) { "`$$($result.TiingoPrice.ToString('F2'))".PadRight(9) } else { "ERROR".PadRight(9) }
    $yahooDisplay = if ($result.YahooPrice) { "`$$($result.YahooPrice.ToString('F2'))".PadRight(9) } else { "ERROR".PadRight(9) }
    $accDisplay = $result.Accuracy.PadRight(8)
    
    Write-Host "$sym | $name | $tiingoDisplay | $yahooDisplay | $accDisplay | $($result.Status)"
}

# Quality Assessment
$excellent = ($results | Where-Object { $_.Status -eq "✅ EXCELLENT" }).Count
$good = ($results | Where-Object { $_.Status -eq "✅ GOOD" }).Count
$acceptable = ($results | Where-Object { $_.Status -eq "⚠️ ACCEPTABLE" }).Count
$poor = ($results | Where-Object { $_.Status -eq "❌ POOR" }).Count

Write-Host ""
Write-Host "🎯 DATA QUALITY ASSESSMENT" -ForegroundColor Cyan
Write-Host "=============================================="
Write-Host "✅ Excellent accuracy (<0.5%): $excellent stocks" -ForegroundColor Green
Write-Host "✅ Good accuracy (0.5-2%): $good stocks" -ForegroundColor Green
Write-Host "⚠️ Acceptable accuracy (2-5%): $acceptable stocks" -ForegroundColor Yellow
Write-Host "❌ Poor accuracy (>5%): $poor stocks" -ForegroundColor Red

# Stakeholder Readiness
$goodTotal = $excellent + $good
$threshold = [Math]::Ceiling($symbols.Count * 0.7)
$ready = $goodTotal -ge $threshold

Write-Host ""
Write-Host "🎪 STAKEHOLDER PRESENTATION READINESS" -ForegroundColor Cyan
Write-Host "=============================================="
if ($ready) {
    Write-Host "✅ READY FOR STAKEHOLDER PRESENTATION" -ForegroundColor Green
    Write-Host "   $goodTotal/$($symbols.Count) stocks show excellent/good accuracy"
} else {
    Write-Host "⚠️ NEEDS IMPROVEMENT" -ForegroundColor Yellow
    Write-Host "   Only $goodTotal/$($symbols.Count) stocks show good accuracy"
}

Write-Host ""
Write-Host "✅ Validation completed - Final success rate: $successPercent%" -ForegroundColor Green