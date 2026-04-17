# Restart Both Backend and Frontend Servers
# This script stops and restarts both servers in separate windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restarting Both Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill backend process (port 5000)
Write-Host "Stopping backend server (port 5000)..." -ForegroundColor Yellow
$backendProcess = netstat -ano | findstr :5000 | findstr LISTENING
if ($backendProcess) {
    $backendPid = ($backendProcess -split '\s+')[-1]
    taskkill /PID $backendPid /F | Out-Null
    Write-Host "[OK] Backend stopped" -ForegroundColor Green
} else {
    Write-Host "No backend process found" -ForegroundColor Yellow
}

# Kill frontend process (port 3000)
Write-Host "Stopping frontend server (port 3000)..." -ForegroundColor Yellow
$frontendProcess = netstat -ano | findstr :3000 | findstr LISTENING
if ($frontendProcess) {
    $frontendPid = ($frontendProcess -split '\s+')[-1]
    taskkill /PID $frontendPid /F | Out-Null
    Write-Host "[OK] Frontend stopped" -ForegroundColor Green
} else {
    Write-Host "No frontend process found" -ForegroundColor Yellow
}

Write-Host ""
Start-Sleep -Seconds 2

# Start backend in new window
Write-Host "Starting backend server in new window..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Backend Server' -ForegroundColor Cyan; node server.js"
Write-Host "[OK] Backend starting..." -ForegroundColor Green

Start-Sleep -Seconds 3

# Start frontend in new window
Write-Host "Starting frontend server in new window..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'Frontend Server' -ForegroundColor Cyan; npm start"
Write-Host "[OK] Frontend starting..." -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Both servers are starting!" -ForegroundColor Green
Write-Host "  Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check the new windows for server output" -ForegroundColor Yellow
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
