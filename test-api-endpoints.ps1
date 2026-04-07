# Campus Connect v4.0 - API Endpoint Test Script (PowerShell)
# This script tests the newly fixed API endpoints

$BaseUrl = "http://localhost:5000/api"
$Token = ""

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Campus Connect v4.0 - API Endpoint Test Script        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Description
    )
    
    Write-Host "Testing: $Description... " -NoNewline
    
    try {
        $headers = @{}
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        $response = Invoke-WebRequest -Uri "$BaseUrl$Endpoint" -Method $Method -Headers $headers -UseBasicParsing -ErrorAction SilentlyContinue
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq 200 -or $statusCode -eq 201) {
            Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
            Write-Host " (HTTP $statusCode)"
        } else {
            Write-Host "? UNKNOWN" -ForegroundColor Yellow -NoNewline
            Write-Host " (HTTP $statusCode)"
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "⚠ AUTH REQUIRED" -ForegroundColor Yellow -NoNewline
            Write-Host " (HTTP $statusCode)"
        } else {
            Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
            Write-Host " (HTTP $statusCode)"
        }
    }
}

Write-Host "1. Testing Health Check" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Test-Endpoint -Method "GET" -Endpoint "/health" -Description "Health Check"
Write-Host ""

Write-Host "2. Testing Search Endpoints (Fixed)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Test-Endpoint -Method "GET" -Endpoint "/search/proposals?query=test" -Description "Search Proposals"
Test-Endpoint -Method "GET" -Endpoint "/search/users?query=test" -Description "Search Users (NEW)"
Test-Endpoint -Method "GET" -Endpoint "/search/filters" -Description "Get Saved Filters"
Write-Host ""

Write-Host "3. Testing Budget Endpoints (Fixed)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Test-Endpoint -Method "GET" -Endpoint "/budget/allocations" -Description "Get Budget Allocations"
Test-Endpoint -Method "GET" -Endpoint "/budget/summary" -Description "Get Budget Summary (FIXED)"
Test-Endpoint -Method "GET" -Endpoint "/budget/check/1?amount=5000" -Description "Check Budget Availability (NEW)"
Write-Host ""

Write-Host "4. Testing Calendar Endpoints (Fixed)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Test-Endpoint -Method "GET" -Endpoint "/calendar/events" -Description "Get Calendar Events"
Test-Endpoint -Method "GET" -Endpoint "/calendar/check-conflicts?eventDate=2026-05-01&startTime=10:00&endTime=12:00" -Description "Check Event Conflicts (NEW)"
Test-Endpoint -Method "GET" -Endpoint "/calendar/export" -Description "Export Calendar (NEW)"
Write-Host ""

Write-Host "5. Testing Authentication Endpoints" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Test-Endpoint -Method "GET" -Endpoint "/auth/me" -Description "Get Current User"
Write-Host ""

Write-Host "6. Testing Proposal Endpoints" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Test-Endpoint -Method "GET" -Endpoint "/proposals" -Description "Get All Proposals"
Test-Endpoint -Method "GET" -Endpoint "/proposals/my-proposals" -Description "Get My Proposals"
Test-Endpoint -Method "GET" -Endpoint "/proposals/drafts/my-drafts" -Description "Get My Drafts"
Write-Host ""

Write-Host "7. Testing Notification Endpoints" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Test-Endpoint -Method "GET" -Endpoint "/notifications" -Description "Get Notifications"
Test-Endpoint -Method "GET" -Endpoint "/notifications/preferences" -Description "Get Notification Preferences"
Write-Host ""

Write-Host "8. Testing Analytics Endpoints" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Test-Endpoint -Method "GET" -Endpoint "/analytics/overview" -Description "Get Analytics Overview"
Write-Host ""

Write-Host "9. Testing User Endpoints" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Test-Endpoint -Method "GET" -Endpoint "/users/profile" -Description "Get User Profile"
Test-Endpoint -Method "GET" -Endpoint "/users/activity" -Description "Get User Activity"
Write-Host ""

Write-Host "10. Testing Society Endpoints" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Test-Endpoint -Method "GET" -Endpoint "/societies" -Description "Get All Societies"
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    Test Complete                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Most endpoints require authentication (401 is expected)" -ForegroundColor Yellow
Write-Host "To test authenticated endpoints, login first and set `$Token variable" -ForegroundColor Yellow
Write-Host ""
Write-Host "Example:" -ForegroundColor Cyan
Write-Host '  $body = @{' -ForegroundColor Gray
Write-Host '    email = "director@uog.edu.pk"' -ForegroundColor Gray
Write-Host '    password = "password123"' -ForegroundColor Gray
Write-Host '  } | ConvertTo-Json' -ForegroundColor Gray
Write-Host '  $response = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -Body $body -ContentType "application/json"' -ForegroundColor Gray
Write-Host '  $Token = $response.token' -ForegroundColor Gray
Write-Host ""
