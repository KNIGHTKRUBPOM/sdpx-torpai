# test_ws06.ps1 - Automated Verification for WS-06 (Integration Loop)
$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [WS-06] Integration Loop - Automated Verification Suite  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$passed = 0
$total = 4

# Step 1: Backend Unit Tests & Coverage
Write-Host "`n[1/4] Running Backend Pytest with Coverage..." -ForegroundColor Yellow
python -m pytest backend/tests -q --cov=src --cov-report=term-missing
if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] Backend tests and coverage passed" -ForegroundColor Green
    $passed++
} else {
    Write-Host "[FAIL] Backend tests failed" -ForegroundColor Red
}

# Step 2: Frontend Linting (Oxlint)
Write-Host "`n[2/4] Running Frontend Linting (Oxlint)..." -ForegroundColor Yellow
Push-Location frontend
cmd.exe /c "npm.cmd run lint"
if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] Frontend linting passed" -ForegroundColor Green
    $passed++
} else {
    Write-Host "[FAIL] Frontend linting failed" -ForegroundColor Red
}
Pop-Location

# Step 3: Frontend Typecheck and Build (tsc + vite)
Write-Host "`n[3/4] Running Frontend Typecheck & Build..." -ForegroundColor Yellow
Push-Location frontend
cmd.exe /c "npm.cmd run build"
if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] Frontend build and typecheck passed" -ForegroundColor Green
    $passed++
} else {
    Write-Host "[FAIL] Frontend build failed" -ForegroundColor Red
}
Pop-Location

# Step 4: Frontend Component Tests (Vitest)
Write-Host "`n[4/4] Running Frontend Vitest Component Tests..." -ForegroundColor Yellow
Push-Location frontend
cmd.exe /c "npm.cmd test -- --run"
if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] Frontend component tests passed" -ForegroundColor Green
    $passed++
} else {
    Write-Host "[FAIL] Frontend component tests failed" -ForegroundColor Red
}
Pop-Location

# Summary
Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($passed -eq $total) {
    Write-Host " WS-06 Verification Summary: $passed / $total Passed (ALL GREEN)" -ForegroundColor Green
} else {
    Write-Host " WS-06 Verification Summary: $passed / $total Passed" -ForegroundColor Red
}
Write-Host "==========================================================" -ForegroundColor Cyan

if ($passed -ne $total) {
    exit 1
}
