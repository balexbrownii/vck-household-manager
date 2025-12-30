#!/bin/bash

# VCK Household Manager - Complete Deployment Script
# This script handles all steps to deploy to Supabase + Vercel

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     VCK Household Manager - Complete Deployment Script         ║"
echo "║     GitHub: balexbrownii/vck-household-manager                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Verify Git Setup
echo -e "\n${YELLOW}Step 1: Verifying Git Configuration${NC}"
if ! git remote -v | grep -q "github.com/balexbrownii"; then
    echo -e "${RED}✗ Git remote not set to balexbrownii${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git remote: github.com/balexbrownii/vck-household-manager${NC}"

# Step 2: Push to GitHub
echo -e "\n${YELLOW}Step 2: Pushing to GitHub${NC}"
echo -e "${BLUE}Executing: git push -u origin main${NC}"

if git push -u origin main; then
    echo -e "${GREEN}✓ Code pushed to GitHub${NC}"
else
    echo -e "${RED}✗ Failed to push to GitHub${NC}"
    echo -e "${YELLOW}Common issues:${NC}"
    echo -e "  • GitHub CLI not authenticated: run 'gh auth login'"
    echo -e "  • SSH key not configured: use 'git remote set-url origin git@github.com:balexbrownii/vck-household-manager.git'"
    exit 1
fi

# Step 3: Supabase Setup Instructions
echo -e "\n${YELLOW}Step 3: Supabase Project Setup${NC}"
cat << 'EOF'

MANUAL STEP REQUIRED - Set up Supabase:

1. Open https://supabase.com/dashboard
2. Create new project named "vck-household-manager"
   • Database password: Generate & save securely
   • Region: Choose your region (us-east-1, eu-west-1, etc.)
3. Wait for project to be created (1-2 minutes)
4. Go to Settings → API
5. Copy and save:
   • Project URL (e.g., https://abc123.supabase.co)
   • Anon Key
6. Run these commands in a new terminal:

   # Login to Supabase CLI
   supabase login

   # Link to your project
   supabase link --project-ref YOUR_PROJECT_REF

   # Apply all migrations
   supabase db push

7. Verify in Supabase Dashboard → Tables:
   ✓ You should see 12 tables
   ✓ Click 'kids' table and verify 3 kids are seeded

EOF

echo -e "${YELLOW}Once Supabase is ready, continue...${NC}"
read -p "Press ENTER when Supabase is set up and migrations are applied: "

# Step 4: Vercel Deployment
echo -e "\n${YELLOW}Step 4: Deploying to Vercel${NC}"
cat << 'EOF'

NEXT STEP - Deploy to Vercel:

Option A: Using Vercel CLI (Recommended)
  1. Install Vercel CLI: npm install -g vercel
  2. Login: vercel login
  3. Deploy: vercel --prod
  4. When asked about settings, use defaults
  5. CLI will prompt you to add environment variables
  6. Add these environment variables:
     • NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     • NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

Option B: Using Vercel Dashboard
  1. Go to https://vercel.com/dashboard
  2. Click "Add New Project"
  3. Import from GitHub: select vck-household-manager
  4. Vercel detects Next.js automatically
  5. Add Environment Variables:
     • NEXT_PUBLIC_SUPABASE_URL
     • NEXT_PUBLIC_SUPABASE_ANON_KEY
  6. Click "Deploy"

EOF

echo -e "${YELLOW}Once Vercel deployment is complete, continue...${NC}"
read -p "Press ENTER when Vercel deployment is finished: "

# Step 5: Get Vercel URL
echo -e "\n${YELLOW}Step 5: Production Verification${NC}"
read -p "Enter your Vercel production URL (e.g., https://vck-household-manager.vercel.app): " VERCEL_URL

if [[ -z "$VERCEL_URL" ]]; then
    echo -e "${RED}✗ No URL provided${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Testing production deployment...${NC}"
if curl -s "$VERCEL_URL" | grep -q "VCK Household Manager\|Dashboard\|Family" 2>/dev/null; then
    echo -e "${GREEN}✓ Production app is live and responding${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify app content (may still be deploying)${NC}"
fi

# Step 6: Summary
echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"

echo -e "\n${BLUE}Production URLs:${NC}"
echo -e "  GitHub:   https://github.com/balexbrownii/vck-household-manager"
echo -e "  Vercel:   $VERCEL_URL"
echo -e "  Supabase: https://supabase.com/dashboard"

echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "  1. Visit $VERCEL_URL and sign up with an account"
echo -e "  2. Verify you can see the 3 kids (Simone, Alexander, Elise)"
echo -e "  3. Test core features (toggle expectations, view timers, etc.)"
echo -e "  4. Share production URL with family members"
echo -e "  5. Set up parent accounts for Mom/Dad"
echo -e "  6. Monitor analytics and collect feedback"

echo -e "\n${BLUE}Documentation:${NC}"
echo -e "  • QUICKSTART.md - Quick reference guide"
echo -e "  • DEPLOYMENT.md - Full deployment details"
echo -e "  • README.md - Project overview"

echo -e "\n${GREEN}🎉 Your VCK Household Manager is live!${NC}\n"
