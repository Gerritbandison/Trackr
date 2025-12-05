#!/bin/bash

set -e

echo "=================================="
echo "  Trackr Deployment Smoke Test"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3

    echo -n "Testing $name... "

    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [[ $RESPONSE == "$expected" ]]; then
        echo -e "${GREEN}✅ PASSED${NC} (HTTP $RESPONSE)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC} (HTTP $RESPONSE, expected $expected)"
        ((FAILED++))
    fi
}

# Test JSON endpoint
test_json_endpoint() {
    local name=$1
    local url=$2
    local expected_key=$3

    echo -n "Testing $name... "

    RESPONSE=$(curl -s "$url" 2>/dev/null || echo '{"error":"connection_failed"}')

    if [[ $RESPONSE == *"$expected_key"* ]]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        echo "  Response: $RESPONSE"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "  Response: $RESPONSE"
        ((FAILED++))
    fi
}

# Check if services are running
echo "Checking Docker containers..."
if command -v docker &> /dev/null; then
    if docker-compose -f docker-compose.prod.yml ps 2>/dev/null | grep -q "Up"; then
        echo -e "${GREEN}✅ Docker containers are running${NC}"
        docker-compose -f docker-compose.prod.yml ps
    else
        echo -e "${YELLOW}⚠️  Docker containers not running. Start with:${NC}"
        echo "    docker-compose -f docker-compose.prod.yml up -d"
        echo ""
    fi
else
    echo -e "${YELLOW}⚠️  Docker not found. Skipping container check.${NC}"
fi

echo ""
echo "Testing Production Deployment (Port 80):"
echo "----------------------------------------"

# Test production endpoints
test_json_endpoint "Backend Health" "http://localhost:5000/health" "status"
test_endpoint "Frontend" "http://localhost" "200"
test_endpoint "API Documentation" "http://localhost:5000/api-docs" "200"

# Test authentication
echo ""
echo -n "Testing Login Endpoint... "
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' 2>/dev/null || echo '{"error":"failed"}')

if [[ $LOGIN_RESPONSE == *"token"* ]]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "  JWT Token received (${#TOKEN} chars)"
    ((PASSED++))

    # Test authenticated endpoint
    echo -n "Testing Authenticated Endpoint... "
    AUTH_RESPONSE=$(curl -s -X GET http://localhost:5000/api/v1/auth/me \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo '{}')

    if [[ $AUTH_RESPONSE == *"email"* ]]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        echo "  User authenticated successfully"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "  Response: $AUTH_RESPONSE"
        ((FAILED++))
    fi
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "  Response: $LOGIN_RESPONSE"
    ((FAILED++))
fi

# Test development mode if available
echo ""
echo "Testing Development Mode (Port 5173):"
echo "-------------------------------------"
DEV_FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "000")
if [[ $DEV_FRONTEND == "200" ]]; then
    echo -e "${GREEN}✅ Development frontend running${NC} (http://localhost:5173)"
else
    echo -e "${YELLOW}⚠️  Development frontend not running${NC}"
    echo "  Start with: npm run dev:all"
fi

# Get IP address for mobile access
echo ""
echo "Network Information:"
echo "-------------------"
echo "Local IP Addresses:"
if command -v hostname &> /dev/null; then
    hostname -I 2>/dev/null || ip addr show 2>/dev/null | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d/ -f1
fi

echo ""
echo "=================================="
echo "Test Results:"
echo "=================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "Access the application:"
    echo "  Production:  http://localhost"
    echo "  Development: http://localhost:5173"
    echo ""
    echo "Default login:"
    echo "  Email:    admin@example.com"
    echo "  Password: admin123"
    echo ""
    echo "For mobile access, use your local IP address shown above."
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check if containers are running:"
    echo "     docker-compose -f docker-compose.prod.yml ps"
    echo ""
    echo "  2. Check logs for errors:"
    echo "     docker-compose -f docker-compose.prod.yml logs backend"
    echo ""
    echo "  3. Restart the deployment:"
    echo "     docker-compose -f docker-compose.prod.yml down"
    echo "     docker-compose -f docker-compose.prod.yml up -d"
    exit 1
fi
