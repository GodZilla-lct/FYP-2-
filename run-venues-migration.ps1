# Venue Management Migration Script
# This script creates the venues table and adds venue_id to proposals

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VENUE MANAGEMENT MIGRATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to FYP-2- directory
Set-Location -Path "FYP-2-"

Write-Host "Running venues migration..." -ForegroundColor Yellow
node backend/database/scripts/run_venues_migration.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  MIGRATION COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your backend server" -ForegroundColor White
    Write-Host "2. Login as SYSTEM_ADMIN" -ForegroundColor White
    Write-Host "3. Go to Super Admin Dashboard > Venue Management tab" -ForegroundColor White
    Write-Host "4. Manage venues (Add/Edit/Delete/Toggle availability)" -ForegroundColor White
    Write-Host "5. Presidents can now select venues when creating proposals" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  MIGRATION FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    Write-Host ""
}

# Return to original directory
Set-Location -Path ".."

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
