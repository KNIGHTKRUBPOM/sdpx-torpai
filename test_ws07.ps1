# test_ws07.ps1 - Automated Verification for WS-07 (Production Loop / Performance & Observability)
param (
    [switch]$Quick
)

$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [WS-07] Performance & Observability - Automated Suite     " -ForegroundColor Cyan
if ($Quick) {
    Write-Host " Mode: Quick Test (~15 seconds)                           " -ForegroundColor Magenta
} else {
    Write-Host " Mode: Full Standard Baseline (2 minutes)                 " -ForegroundColor Magenta
}
Write-Host "==========================================================" -ForegroundColor Cyan

$passed = 0
$total = 3
$serverProcess = $null
$baseUrl = $env:BASE_URL
if (-not $baseUrl) {
    $baseUrl = "http://127.0.0.1:8000"
}

# Step 1: Verify Structured Logging & Redaction
Write-Host "`n[1/3] Testing Structured Logging & Correlation ID..." -ForegroundColor Yellow
python -m pytest backend/tests/unit/test_logging.py -v
if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] Structured logging and data redaction tests passed" -ForegroundColor Green
    $passed++
} else {
    Write-Host "[FAIL] Structured logging tests failed" -ForegroundColor Red
}

# Ensure API is accessible
Write-Host "`nChecking Target API at $baseUrl..." -ForegroundColor Yellow
$apiReady = $false
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
    if ($response.status -eq "ok") {
        $apiReady = $true
        Write-Host "[OK] API is accessible at $baseUrl" -ForegroundColor Green
    }
} catch {
    $apiReady = $false
}

if (-not $apiReady -and ($baseUrl.Contains("127.0.0.1") -or $baseUrl.Contains("localhost"))) {
    Write-Host "Starting local backend server on port 8000..." -ForegroundColor Cyan
    $serverProcess = Start-Process python -ArgumentList "-m uvicorn src.app:create_app --factory --port 8000 --host 127.0.0.1" -WorkingDirectory "$PSScriptRoot/backend" -PassThru
    Start-Sleep -Seconds 4
}

# Step 2: Run k6 Smoke Test
Write-Host "`n[2/3] Running k6 Smoke Test..." -ForegroundColor Yellow
if ($Quick) {
    k6 run --vus 2 --duration 5s performance/smoke.js --env BASE_URL=$baseUrl
} else {
    k6 run performance/smoke.js --env BASE_URL=$baseUrl
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] k6 Smoke Test passed" -ForegroundColor Green
    $passed++
} else {
    Write-Host "[FAIL] k6 Smoke Test failed" -ForegroundColor Red
}

# Step 3: Run k6 Load Test
Write-Host "`n[3/3] Running k6 Load Test..." -ForegroundColor Yellow
if ($Quick) {
    k6 run --vus 2 --duration 10s performance/load-test.js --env BASE_URL=$baseUrl
} else {
    k6 run --summary-export=performance/baseline.json performance/load-test.js --env BASE_URL=$baseUrl
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] k6 Load Test passed" -ForegroundColor Green
    $passed++
} else {
    Write-Host "[FAIL] k6 Load Test failed" -ForegroundColor Red
}

# Cleanup server if spawned
if ($serverProcess) {
    Write-Host "`nStopping temporary local backend server..." -ForegroundColor Cyan
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}

# Summary
Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($passed -eq $total) {
    Write-Host " WS-07 Verification Summary: $passed / $total Passed (ALL GREEN)" -ForegroundColor Green
} else {
    Write-Host " WS-07 Verification Summary: $passed / $total Passed" -ForegroundColor Red
}
Write-Host "==========================================================" -ForegroundColor Cyan

if ($passed -ne $total) {
    exit 1
}
