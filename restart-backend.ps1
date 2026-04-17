# Restart Backend Server Script
# This script stops any running Node.js process on port 5000 and starts the backend server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restarting Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Find and kill process on port 5000
Write-Host "Step 1: Checking for processes on port 5000..." -ForegroundColor Yellow
$processInfo = netstat -ano | findstr :5000 | findstr LISTENING

if ($processInfo) {
    Write-Host "Found process on port 5000" -ForegroundColor Green
    
    # Extract PID (last column)
    $pid = ($processInfo -split '\s+')[-1]
    Write-Host "Process ID: $pid" -ForegroundColor Green
    
    # Kill the process
    Write-Host "Stopping process..." -ForegroundColor Yellow
    taskkill /PID $pid /F
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Process stopped successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to stop process" -ForegroundColor Red
    }
    
    # Wait a moment for port to be released
    Start-Sleep -Seconds 2
} else {
    Write-Host "No process found on port 5000" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Start the backend server
Write-Host "Step 2: Starting backend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backend Server Starting..." -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
node server.js
