# Campus Connect System Health Check
# Tests all critical endpoints and integrations

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CAMPUS CONNECT SYSTEM HEALTH CHECK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api"
$testResults = @()

# Test credentials
$systemAdminCreds = @{
    email = "admin@uog.edu.pk"
    password = "admin123"
}

$presidentCreds = @{
    email = "president@uog.edu.pk"
    password = "president123"
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
            TimeoutSec = 10
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "[✓] $Name" -ForegroundColor Green
        return @{ Name = $Name; Status = "PASS"; Response = $response }
    }
    catch {
        Write-Host "[✗] $Name - $($_.Exception.Message)" -ForegroundColor Red
        return @{ Name = $Name; Status = "FAIL"; Error = $_.Exception.Message }
    }
}

# 1. Test Server Health
Write-Host "`n1. Testing Server Health..." -ForegroundColor Yellow
$testResults += Test-Endpoint -Name "Server Health Check" -Url "$baseUrl/../health"

# 2. Test Authentication
Write-Host "`n2. Testing Authentication..." -ForegroundColor Yellow
$loginResult = Test-Endpoint -Name "System Admin Login" -Url "$baseUrl/auth/login" -Method "POST" -Body $systemAdminCreds

if ($loginResult.Status -eq "PASS") {
    $adminToken = $loginResult.Response.token
    $adminHeaders = @{
        "Authorization" = "Bearer $adminToken"
    }
    
    # 3. Test Venue Management
    Write-Host "`n3. Testing Venue Management..." -ForegroundColor Yellow
    $testResults += Test-Endpoint -Name "Get All Venues" -Url "$baseUrl/venues" -Headers $adminHeaders
    $testResults += Test-Endpoint -Name "Get Available Venues Only" -Url "$baseUrl/venues?availableOnly=true" -Headers $adminHeaders
    
    # 4. Test Super Admin Dashboard
    Write-Host "`n4. Testing Super Admin Dashboard..." -ForegroundColor Yellow
    $testResults += Test-Endpoint -Name "Get All Users" -Url "$baseUrl/super/users" -Headers $adminHeaders
    $testResults += Test-Endpoint -Name "Get All Proposals" -Url "$baseUrl/super/proposals" -Headers $adminHeaders
    $testResults += Test-Endpoint -Name "Get All Tickets" -Url "$baseUrl/super/tickets" -Headers $adminHeaders
    
    # 5. Test Society Management
    Write-Host "`n5. Testing Society Management..." -ForegroundColor Yellow
    $testResults += Test-Endpoint -Name "Get All Societies" -Url "$baseUrl/societies" -Headers $adminHeaders
    $testResults += Test-Endpoint -Name "Get All Coordinators" -Url "$baseUrl/coordinators" -Headers $adminHeaders
    
    # 6. Test Calendar Integration
    Write-Host "`n6. Testing Calendar Integration..." -ForegroundColor Yellow
    $testResults += Test-Endpoint -Name "Get Calendar Events" -Url "$baseUrl/calendar/events" -Headers $adminHeaders
}

# 7. Test President Access
Write-Host "`n7. Testing President Access..." -ForegroundColor Yellow
$presidentLoginResult = Test-Endpoint -Name "President Login" -Url "$baseUrl/auth/login" -Method "POST" -Body $presidentCreds

if ($presidentLoginResult.Status -eq "PASS") {
    $presidentToken = $presidentLoginResult.Response.token
    $presidentHeaders = @{
        "Authorization" = "Bearer $presidentToken"
    }
    
    $testResults += Test-Endpoint -Name "Get Available Venues (President)" -Url "$baseUrl/venues?availableOnly=true" -Headers $presidentHeaders
    $testResults += Test-Endpoint -Name "Get My Proposals" -Url "$baseUrl/proposals/my-proposals" -Headers $presidentHeaders
}

# 8. Test Venue Conflict Detection
Write-Host "`n8. Testing Venue Conflict Detection..." -ForegroundColor Yellow
if ($adminToken) {
    $conflictCheckBody = @{
        venueId = 1
        eventDate = "2026-05-01"
    }
    $testResults += Test-Endpoint -Name "Check Venue Availability" -Url "$baseUrl/venues/check-availability" -Method "POST" -Headers $adminHeaders -Body $conflictCheckBody
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalCount = $testResults.Count

Write-Host "`nTotal Tests: $totalCount" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

if ($failCount -eq 0) {
    Write-Host "`n✓ ALL TESTS PASSED - SYSTEM IS HEALTHY!" -ForegroundColor Green
} else {
    Write-Host "`n✗ SOME TESTS FAILED - CHECK ERRORS ABOVE" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host ""

# Detailed Results
Write-Host "Detailed Results:" -ForegroundColor Yellow
$testResults | ForEach-Object {
    if ($_.Status -eq "PASS") {
        Write-Host "  [✓] $($_.Name)" -ForegroundColor Green
    } else {
        Write-Host "  [✗] $($_.Name): $($_.Error)" -ForegroundColor Red
    }
}

Write-Host ""
