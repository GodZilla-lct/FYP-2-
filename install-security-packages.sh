#!/bin/bash

# Campus Connect v4.0 - Security Package Installation Script
# This script installs all required security packages

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Campus Connect v4.0 - Security Package Installation     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Installing security packages...${NC}"
echo ""

# Install security packages
npm install xss-clean express-mongo-sanitize hpp --save

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Security packages installed successfully!${NC}"
    echo ""
    echo "Installed packages:"
    echo "  • xss-clean - XSS attack prevention"
    echo "  • express-mongo-sanitize - NoSQL injection prevention"
    echo "  • hpp - HTTP Parameter Pollution protection"
    echo ""
    echo "Already installed:"
    echo "  • helmet - HTTP header security"
    echo "  • cors - Cross-Origin Resource Sharing"
    echo "  • express-rate-limit - Rate limiting"
    echo ""
    echo -e "${GREEN}All security packages are now installed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Copy .env.example to .env"
    echo "  2. Update environment variables"
    echo "  3. Run: npm start"
    echo ""
else
    echo ""
    echo -e "${RED}✗ Installation failed!${NC}"
    echo "Please check your internet connection and try again."
    exit 1
fi
