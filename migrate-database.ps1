# ============================================================================
# Campus Connect Database Migration Script
# Upgrades database from V3 to V4
# ============================================================================

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  Campus Connect Database Migration: V3 to V4" -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "  Node.js version: $nodeVersion" -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with database credentials" -ForegroundColor Yellow
    exit 1
}
Write-Host "  .env file found" -ForegroundColor Green

# Check if migration script exists
if (-not (Test-Path "backend/database/run_migration_smart.js")) {
    Write-Host "ERROR: Migration script not found!" -ForegroundColor Red
    Write-Host "Expected: backend/database/run_migration_smart.js" -ForegroundColor Yellow
    exit 1
}
Write-Host "  Migration script found" -ForegroundColor Green

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  IMPORTANT: Backup Recommendation" -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Before proceeding, it is HIGHLY RECOMMENDED to backup your database!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backup command:" -ForegroundColor Cyan
Write-Host "  mysqldump -u root -p campus_connect > backup_v3.sql" -ForegroundColor White
Write-Host ""

$backup = Read-Host "Have you backed up your database? (yes/no)"
if ($backup -ne "yes") {
    Write-Host ""
    Write-Host "Migration cancelled. Please backup your database first." -ForegroundColor Red
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  Running Migration" -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Run migration
node backend/database/run_migration_smart.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host "  Migration Successful!" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Restart your server" -ForegroundColor White
    Write-Host "  2. Test forgot password feature" -ForegroundColor White
    Write-Host "  3. Test email notifications" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host "  Migration Failed!" -ForegroundColor Red
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please check the error messages above and try again." -ForegroundColor Yellow
    Write-Host "If you need to restore from backup:" -ForegroundColor Yellow
    Write-Host "  mysql -u root -p campus_connect < backup_v3.sql" -ForegroundColor White
    Write-Host ""
    exit 1
}
