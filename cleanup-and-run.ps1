# Campus Connect v4.0 - Cleanup and Run Script
# This script removes unnecessary documentation and starts the project

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Campus Connect v4.0 - Cleanup and Run Script          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Move important docs to docs folder
Write-Host "Step 1: Organizing documentation..." -ForegroundColor Yellow

$docsToKeep = @(
    "README.md",
    "QUICK_START.md",
    "INSTALLATION_GUIDE.md",
    "API_TESTING_GUIDE.md",
    "DEPLOYMENT_CHECKLIST.md",
    "SECURITY_SUMMARY.md"
)

$docsToArchive = @(
    "ACTIVE_FUNCTIONS_LIST.md",
    "BEFORE_AFTER_COMPARISON.md",
    "DEPLOYMENT.md",
    "FIXES_APPLIED.md",
    "GIT_SETUP.md",
    "GITHUB_READY.md",
    "IMPLEMENTATION_COMPLETE.md",
    "INDEX.md",
    "PROJECT_STRUCTURE_V4.md",
    "PROJECT_STRUCTURE.md",
    "RESTRUCTURING_SUMMARY.md",
    "SECURITY_HARDENING.md",
    "SECURITY_IMPLEMENTATION_GUIDE.md",
    "START_HERE_V4.md",
    "STARTUP_VERIFICATION.md",
    "SYSTEM_ARCHITECTURE_V4.md",
    "SYSTEM_OVERVIEW.md",
    "V3_VS_V4_COMPARISON.md",
    "V4_IMPLEMENTATION_SUMMARY.md"
)

# Create archive folder if it doesn't exist
if (-not (Test-Path "docs/archive")) {
    New-Item -ItemType Directory -Path "docs/archive" -Force | Out-Null
}

# Move files to archive
foreach ($file in $docsToArchive) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "docs/archive/$file" -Force
        Write-Host "  ✓ Archived: $file" -ForegroundColor Green
    }
}

Write-Host ""

# Step 2: Install security packages
Write-Host "Step 2: Installing security packages..." -ForegroundColor Yellow
npm install xss-clean express-mongo-sanitize hpp --save

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install security packages!" -ForegroundColor Red
    exit 1
}

Write-Host "  ✓ Security packages installed" -ForegroundColor Green
Write-Host ""

# Step 3: Check if .env exists
Write-Host "Step 3: Checking environment configuration..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Write-Host "  ⚠ .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "  ✓ Created .env file" -ForegroundColor Green
    Write-Host "  ⚠ Please update .env with your database credentials!" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ .env file exists" -ForegroundColor Green
}

Write-Host ""

# Step 4: Check database connection
Write-Host "Step 4: Verifying database setup..." -ForegroundColor Yellow
Write-Host "  ℹ Make sure MySQL is running and database is created" -ForegroundColor Cyan
Write-Host ""

# Step 5: Start the server
Write-Host "Step 5: Starting Campus Connect server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Starting Campus Connect v4.0                  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

npm start
