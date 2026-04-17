# Restart Frontend Server Script
# This script stops any running React dev server on port 3000 and starts it again

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restarting Frontend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Find and kill process on port 3000
Write-Host "Step 1: Checking for processes on port 3000..." -ForegroundColor Yellow
$processInfo = netstat -ano | findstr :3000 | findstr LISTENING

if ($processInfo) {
    Write-Host "Found process on port 3000" -ForegroundColor Green
    
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
    Write-Host "No process found on port 3000" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Start the frontend server
Write-Host "Step 2: Starting frontend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Frontend Server Starting..." -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to frontend directory and start
Set-Location frontend
npm start
