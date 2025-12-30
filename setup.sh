#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      VCK Household Manager - Local Setup Script               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+ first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"

echo ""
echo -e "${YELLOW}1. Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""
echo -e "${YELLOW}2. Setting up environment variables...${NC}"
if [ ! -f ".env.local" ]; then
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        echo -e "${GREEN}✓ Created .env.local from template${NC}"
        echo -e "${YELLOW}   ⚠ Please edit .env.local with your Supabase credentials:${NC}"
        echo -e "${BLUE}   • NEXT_PUBLIC_SUPABASE_URL${NC}"
        echo -e "${BLUE}   • NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}"
    else
        echo -e "${RED}✗ .env.local.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env.local already exists${NC}"
fi

echo ""
echo -e "${YELLOW}3. Checking project structure...${NC}"
required_dirs=(
    "app"
    "app/components"
    "app/api"
    "app/lib"
    "public"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ $dir/${NC}"
    else
        echo -e "${RED}✗ $dir/ missing${NC}"
        exit 1
    fi
done

echo ""
echo -e "${YELLOW}4. Verifying build setup...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Production build successful${NC}"
else
    echo -e "${YELLOW}⚠ Build had issues (this is OK for now)${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Setup Complete! 🎉                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1. Update .env.local with your Supabase credentials${NC}"
echo -e "${BLUE}2. Run: npm run dev${NC}"
echo -e "${BLUE}3. Open: http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}For deployment help, see: DEPLOYMENT.md${NC}"
