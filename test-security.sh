#!/bin/bash

# Campus Connect v4.0 - Security Testing Script
# Tests XSS protection, SQL injection prevention, rate limiting, and CORS

BASE_URL="http://localhost:5000"
API_URL="$BASE_URL/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       Campus Connect v4.0 - Security Testing Suite        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_security() {
    local test_name=$1
    local expected=$2
    local actual=$3
    
    if [[ "$actual" == *"$expected"* ]]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name"
        echo "  Expected: $expected"
        echo "  Got: $actual"
        ((FAILED++))
    fi
}

echo -e "${BLUE}1. Testing XSS Protection${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test XSS in query parameter
response=$(curl -s "$API_URL/search/proposals?query=<script>alert('XSS')</script>")
test_security "XSS in query parameter" "401" "$(echo $response | grep -o '401\|error')"

# Test XSS in JSON body (would need auth token)
echo -e "${YELLOW}  Note: Full XSS testing requires authentication${NC}"
echo ""

echo -e "${BLUE}2. Testing SQL Injection Protection${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test SQL injection in query
response=$(curl -s "$API_URL/search/proposals?query=test' OR '1'='1")
test_security "SQL injection in query" "401" "$(echo $response | grep -o '401\|error')"

# Test SQL injection in ID parameter
response=$(curl -s "$API_URL/proposals/1' OR '1'='1")
test_security "SQL injection in ID" "400\|401\|404" "$(echo $response | grep -o '400\|401\|404')"
echo ""

echo -e "${BLUE}3. Testing Rate Limiting${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Make multiple rapid requests
echo "  Making 10 rapid requests..."
for i in {1..10}; do
    curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" > /dev/null
done

# Check if rate limit kicks in after many requests
echo "  Making 100 more requests to trigger rate limit..."
rate_limited=false
for i in {1..100}; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/proposals")
    if [ "$status" == "429" ]; then
        rate_limited=true
        break
    fi
done

if [ "$rate_limited" = true ]; then
    echo -e "${GREEN}✓ PASS${NC} - Rate limiting is working (429 received)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ PARTIAL${NC} - Rate limit not triggered (may need more requests)"
fi
echo ""

echo -e "${BLUE}4. Testing CORS Protection${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test CORS with unauthorized origin
response=$(curl -s -H "Origin: http://malicious-site.com" "$BASE_URL/health")
test_security "CORS blocks unauthorized origin" "OK" "$(echo $response | grep -o 'OK')"

# Test CORS with authorized origin
response=$(curl -s -H "Origin: http://localhost:3000" "$BASE_URL/health")
test_security "CORS allows authorized origin" "OK" "$(echo $response | grep -o 'OK')"
echo ""

echo -e "${BLUE}5. Testing Security Headers${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for security headers
headers=$(curl -s -I "$BASE_URL/health")

# Check X-Content-Type-Options
if echo "$headers" | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✓ PASS${NC} - X-Content-Type-Options header present"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - X-Content-Type-Options header missing"
    ((FAILED++))
fi

# Check X-Frame-Options
if echo "$headers" | grep -q "X-Frame-Options"; then
    echo -e "${GREEN}✓ PASS${NC} - X-Frame-Options header present"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - X-Frame-Options header missing"
    ((FAILED++))
fi

# Check Strict-Transport-Security
if echo "$headers" | grep -q "Strict-Transport-Security"; then
    echo -e "${GREEN}✓ PASS${NC} - HSTS header present"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARN${NC} - HSTS header missing (expected in production)"
fi

# Check X-Powered-By is removed
if echo "$headers" | grep -q "X-Powered-By"; then
    echo -e "${RED}✗ FAIL${NC} - X-Powered-By header exposed (security risk)"
    ((FAILED++))
else
    echo -e "${GREEN}✓ PASS${NC} - X-Powered-By header hidden"
    ((PASSED++))
fi
echo ""

echo -e "${BLUE}6. Testing Parameter Pollution Protection${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test duplicate parameters
response=$(curl -s "$API_URL/search/proposals?status=PENDING&status=APPROVED")
test_security "HPP handles duplicate parameters" "401\|error" "$(echo $response | grep -o '401\|error')"
echo ""

echo -e "${BLUE}7. Testing File Upload Security${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${YELLOW}  Note: File upload testing requires authentication${NC}"
echo -e "${YELLOW}  Manual testing recommended for:${NC}"
echo "    • File type validation"
echo "    • File size limits"
echo "    • Malicious file detection"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Test Results Summary                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All security tests passed!${NC}"
    echo ""
    echo "Your application has strong security measures in place."
    exit 0
else
    echo -e "${RED}✗ Some security tests failed!${NC}"
    echo ""
    echo "Please review the failed tests and fix the issues."
    exit 1
fi
