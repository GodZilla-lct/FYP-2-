# Campus Connect v4.0 - Security Package Installation Script (PowerShell)
# This script installs all required security packages

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Campus Connect v4.0 - Security Package Installation     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Installing security packages..." -ForegroundColor Yellow
Write-Host ""

# Install security packages
npm install xss-clean express-mongo-sanitize hpp --save

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Security packages installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installed packages:"
    Write-Host "  • xss-clean - XSS attack prevention"
    Write-Host "  • express-mongo-sanitize - NoSQL injection prevention"
    Write-Host "  • hpp - HTTP Parameter Pollution protection"
    Write-Host ""
    Write-Host "Already installed:"
    Write-Host "  • helmet - HTTP header security"
    Write-Host "  • cors - Cross-Origin Resource Sharing"
    Write-Host "  • express-rate-limit - Rate limiting"
    Write-Host ""
    Write-Host "All security packages are now installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Copy .env.example to .env"
    Write-Host "  2. Update environment variables"
    Write-Host "  3. Run: npm start"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "✗ Installation failed!" -ForegroundColor Red
    Write-Host "Please check your internet connection and try again."
    exit 1
}
