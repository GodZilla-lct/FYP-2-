#!/bin/bash

# Campus Connect v4.0 - API Endpoint Test Script
# This script tests the newly fixed API endpoints

BASE_URL="http://localhost:5000/api"
TOKEN=""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Campus Connect v4.0 - API Endpoint Test Script        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    
    echo -n "Testing: $description... "
    
    if [ -z "$TOKEN" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint" -H "Authorization: Bearer $TOKEN")
    fi
    
    if [ $response -eq 200 ] || [ $response -eq 201 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
    elif [ $response -eq 401 ]; then
        echo -e "${YELLOW}⚠ AUTH REQUIRED${NC} (HTTP $response)"
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $response)"
    fi
}

echo "1. Testing Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/health" "Health Check"
echo ""

echo "2. Testing Search Endpoints (Fixed)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/search/proposals?query=test" "Search Proposals"
test_endpoint "GET" "/search/users?query=test" "Search Users (NEW)"
test_endpoint "GET" "/search/filters" "Get Saved Filters"
echo ""

echo "3. Testing Budget Endpoints (Fixed)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/budget/allocations" "Get Budget Allocations"
test_endpoint "GET" "/budget/summary" "Get Budget Summary (FIXED)"
test_endpoint "GET" "/budget/check/1?amount=5000" "Check Budget Availability (NEW)"
echo ""

echo "4. Testing Calendar Endpoints (Fixed)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/calendar/events" "Get Calendar Events"
test_endpoint "GET" "/calendar/check-conflicts?eventDate=2026-05-01&startTime=10:00&endTime=12:00" "Check Event Conflicts (NEW)"
test_endpoint "GET" "/calendar/export" "Export Calendar (NEW)"
echo ""

echo "5. Testing Authentication Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/auth/me" "Get Current User"
echo ""

echo "6. Testing Proposal Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/proposals" "Get All Proposals"
test_endpoint "GET" "/proposals/my-proposals" "Get My Proposals"
test_endpoint "GET" "/proposals/drafts/my-drafts" "Get My Drafts"
echo ""

echo "7. Testing Notification Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/notifications" "Get Notifications"
test_endpoint "GET" "/notifications/preferences" "Get Notification Preferences"
echo ""

echo "8. Testing Analytics Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/analytics/overview" "Get Analytics Overview"
echo ""

echo "9. Testing User Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/users/profile" "Get User Profile"
test_endpoint "GET" "/users/activity" "Get User Activity"
echo ""

echo "10. Testing Society Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/societies" "Get All Societies"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Test Complete                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Note: Most endpoints require authentication (401 is expected)"
echo "To test authenticated endpoints, login first and set TOKEN variable"
echo ""
echo "Example:"
echo "  TOKEN=\$(curl -s -X POST $BASE_URL/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"director@uog.edu.pk\",\"password\":\"password123\"}' \\"
echo "    | jq -r '.token')"
echo ""
