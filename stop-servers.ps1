# Stop All Servers Script
# This script terminates both backend and frontend servers

Write-Host "========================================" -ForegroundColor Red
Write-Host "  Stopping All Servers" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

$serversFound = $false

# Stop backend server (port 5001)
Write-Host "Checking for backend server (port 5001)..." -ForegroundColor Yellow
$backendProcess = netstat -ano | findstr :5001 | findstr LISTENING

if ($backendProcess) {
    $backendPid = ($backendProcess -split '\s+')[-1]
    Write-Host "Found backend process (PID: $backendPid)" -ForegroundColor Green
    Write-Host "Stopping backend server..." -ForegroundColor Yellow

    taskkill /PID $backendPid /F

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Backend server stopped" -ForegroundColor Green
        $serversFound = $true
    } else {
        Write-Host "[ERROR] Failed to stop backend server" -ForegroundColor Red
    }
} else {
    Write-Host "No backend server found on port 5001" -ForegroundColor Gray
}

Write-Host ""

# Stop frontend server (port 3000)
Write-Host "Checking for frontend server (port 3000)..." -ForegroundColor Yellow
$frontendProcess = netstat -ano | findstr :3000 | findstr LISTENING

if ($frontendProcess) {
    $frontendPid = ($frontendProcess -split '\s+')[-1]
    Write-Host "Found frontend process (PID: $frontendPid)" -ForegroundColor Green
    Write-Host "Stopping frontend server..." -ForegroundColor Yellow

    taskkill /PID $frontendPid /F

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Frontend server stopped" -ForegroundColor Green
        $serversFound = $true
    } else {
        Write-Host "[ERROR] Failed to stop frontend server" -ForegroundColor Red
    }
} else {
    Write-Host "No frontend server found on port 3000" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
if ($serversFound) {
    Write-Host "  Servers Stopped Successfully" -ForegroundColor Green
} else {
    Write-Host "  No Running Servers Found" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Verify ports are free
Write-Host "Verifying ports are free..." -ForegroundColor Yellow
$port5001 = netstat -ano | findstr :5001 | findstr LISTENING
$port3000 = netstat -ano | findstr :3000 | findstr LISTENING

if ((-not $port5001) -and (-not $port3000)) {
    Write-Host "Both ports (3000 and 5001) are now free" -ForegroundColor Green
} else {
    if ($port5001) { Write-Host "Port 5001 is still in use" -ForegroundColor Yellow }
    if ($port3000) { Write-Host "Port 3000 is still in use" -ForegroundColor Yellow }
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
