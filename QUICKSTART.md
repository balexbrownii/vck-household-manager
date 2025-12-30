# VCK Household Manager - Quick Start Guide

Complete 10-minute setup to deploy your household manager system to production.

## Prerequisites

- Node.js 18+ installed
- GitHub account (free)
- Supabase account (free tier available)
- Vercel account (free tier available)

---

## Step 1: Create GitHub Repository (5 minutes)

### 1.1 Go to GitHub

1. Open https://github.com
2. Sign in (or create free account)
3. Click **+** → **New repository**

### 1.2 Create Repository

Fill in:
- **Repository name**: `vck-household-manager`
- **Description**: `Family chore and responsibility system`
- **Visibility**: Public (free) or Private (requires verification)
- **Initialize**: Do NOT initialize with README (we already have one)

Click **Create repository**

### 1.3 Push Code to GitHub

In your terminal:

```bash
cd /home/alex/projects/balexbrownii/vck-household-manager

# Add GitHub as remote
git remote add origin https://github.com/YOUR-USERNAME/vck-household-manager.git

# Rename branch to main (if needed)
git branch -M main

# Push code
git push -u origin main
```

✅ Your code is now on GitHub!

---

## Step 2: Create Supabase Project (5 minutes)

### 2.1 Go to Supabase

1. Open https://supabase.com
2. Sign in (create free account if needed)
3. Click **New Project**

### 2.2 Configure Project

Fill in:
- **Project name**: `vck-household-manager`
- **Database password**: Generate strong password (save it!)
- **Region**: Choose closest to you (us-east-1, eu-west-1, etc.)
- **Pricing plan**: Free (we'll upgrade if needed)

Click **Create new project** and wait 1-2 minutes

### 2.3 Get Your Credentials

Once created:

1. Go to **Settings** → **API**
2. Copy these and save them:
   - **Project URL** (e.g., `https://abc123.supabase.co`)
   - **Anon Key** (under "Project API keys")

### 2.4 Apply Database Migrations

In Supabase Dashboard → **SQL Editor**:

1. Click **New Query**
2. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click **Run**
4. Repeat for `002_` through `007_` in order

Or use the Supabase CLI (see DEPLOYMENT.md)

**Verify**: Go to **Tables** and confirm you see 12 tables and 3 kids in the `kids` table

✅ Your database is ready!

---

## Step 3: Test Locally (5 minutes)

### 3.1 Setup Local Environment

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials
nano .env.local
# OR
code .env.local
```

Add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3.2 Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:3000 and verify:
- ✅ Dashboard loads
- ✅ Can sign up/login
- ✅ Can see 3 kids
- ✅ Can toggle expectations

### 3.3 Build for Production

```bash
npm run build
```

Should complete with no errors.

✅ Local setup works!

---

## Step 4: Deploy to Vercel (5 minutes)

### 4.1 Go to Vercel

1. Open https://vercel.com
2. Sign in with GitHub (creates account automatically)
3. Click **Add New Project**

### 4.2 Import GitHub Repository

1. Click **GitHub**
2. Search for `vck-household-manager`
3. Click **Import**

### 4.3 Configure Vercel Project

Vercel auto-detects Next.js settings. Just add environment variables:

**Environment Variables** section:
- Name: `NEXT_PUBLIC_SUPABASE_URL`
  Value: `https://your-project.supabase.co`
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  Value: `your-anon-key`

Click **Deploy** and wait 1-2 minutes

✅ Your app is live!

---

## Step 5: Verify Production (2 minutes)

### 5.1 Get Your Live URL

After deployment completes, Vercel shows your URL:
- Example: `https://vck-household-manager.vercel.app`

### 5.2 Test Production

Visit your production URL and verify:
- ✅ Dashboard loads
- ✅ Can create account
- ✅ Can see kids and expectations
- ✅ All features work

### 5.3 Custom Domain (Optional)

In Vercel Dashboard → **Settings** → **Domains**:
- Add your own domain if you have one
- Follow DNS instructions

---

## 🎉 You're Live!

Your VCK Household Manager is now deployed to production!

| Component | Status | URL |
|-----------|--------|-----|
| **Code** | ✅ On GitHub | https://github.com/your-username/vck-household-manager |
| **Database** | ✅ On Supabase | https://supabase.com/dashboard |
| **App** | ✅ Live on Vercel | https://vck-household-manager.vercel.app |

---

## What to Do Next

### 1. Train Your Family (30 min)

Show each person their role:
- **Mom**: Dashboard overview, gig inspection, timeout logging
- **Dad**: Analytics dashboard, performance tracking
- **Kids**: Can view own status, claim gigs, see timers

### 2. Set Up Accounts

Create parent accounts for both you and your spouse:
1. Visit your production URL
2. Click "Sign Up"
3. Create account with email/password
4. Bookmark the URL

### 3. Monitor & Iterate

Week 1:
- Watch for any issues
- Collect family feedback
- Note what works/what doesn't

Week 2+:
- Implement improvements
- Celebrate wins
- Plan Phase 2 features

---

## Troubleshooting

### Issue: "Can't push to GitHub"

```bash
# Generate GitHub personal access token:
# 1. Go to GitHub → Settings → Developer settings → Personal access tokens
# 2. Click "Generate new token"
# 3. Select "repo" scope
# 4. Copy token and use as password

# Then retry push with token as password
git push -u origin main
```

### Issue: "Supabase URL/Key rejected"

1. Double-check you copied the full URL and key
2. Ensure no extra spaces
3. Verify it's the **Anon Key**, not Service Role Key

### Issue: "Build fails on Vercel"

1. Check Vercel logs for specific error
2. Run `npm run build` locally to reproduce
3. Fix locally, commit, and push
4. Vercel will auto-redeploy

### Issue: "Tables don't exist"

1. Go to Supabase → SQL Editor
2. Run migrations one by one in order (001 through 007)
3. Verify each completes without error
4. Check Tables tab to confirm

### Issue: "Environment variables not found"

1. Go to Vercel → Project Settings → Environment Variables
2. Verify variables are added
3. Click "Redeploy" to use new variables
4. Wait for deployment to complete

---

## Reference Documentation

Full details available in:
- **DEPLOYMENT.md** - Comprehensive deployment guide
- **README.md** - Project overview
- **ARCHITECTURE.md** - Technical details (if exists)

---

## Summary

| Step | Time | Status |
|------|------|--------|
| GitHub | 5 min | ✅ |
| Supabase | 5 min | ✅ |
| Local Test | 5 min | ✅ |
| Vercel Deploy | 5 min | ✅ |
| Production Test | 2 min | ✅ |
| **Total** | **22 min** | **Live!** |

You now have a production-ready household management system! 🚀

For questions, see DEPLOYMENT.md or ARCHITECTURE.md
