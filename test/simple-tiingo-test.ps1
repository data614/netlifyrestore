# Simple PowerShell test for Tiingo API
Write-Host "🔍 SIMPLE TIINGO API TEST" -ForegroundColor Cyan
Write-Host "============================================================"

$baseUrl = "http://localhost:8888"
$symbols = @("WOW", "AAPL", "BHP", "CBA")

foreach ($symbol in $symbols) {
    Write-Host "`n[Testing] $symbol..." -ForegroundColor Yellow
    
    try {
        $url = "$baseUrl/api/tiingo?symbol=$symbol" + "`&kind=intraday_latest"
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            
            if ($data -is [array] -and $data.Count -gt 0) {
                $quote = $data[0]
            } else {
                $quote = $data
            }
            
            $price = if ($quote.lastPrice) { $quote.lastPrice } elseif ($quote.last) { $quote.last } elseif ($quote.close) { $quote.close } else { "N/A" }
            $volume = if ($quote.volume) { $quote.volume } else { "N/A" }
            
            Write-Host "  ✅ Price: `$$price, Volume: $volume" -ForegroundColor Green
        } else {
            Write-Host "  ❌ HTTP Status: $($response.StatusCode)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n============================================================"