# VCK Household Manager - Production Deployment Steps

## Complete Deployment Checklist

Project is ready to deploy to:
- **GitHub**: `github.com/balexbrownii/vck-household-manager`
- **Supabase**: `vck-household-manager` project
- **Vercel**: Automatic deployment from GitHub

---

## 📋 Phase 1: Push to GitHub (5 min)

### Option A: Using Git (Recommended)

```bash
cd /home/alex/projects/balexbrownii/vck-household-manager

# Verify remote is set
git remote -v
# Output should show: origin	https://github.com/balexbrownii/vck-household-manager.git

# Push to GitHub
git push -u origin main
```

### What happens:
- Code is pushed to GitHub
- Vercel automatically detects new push
- Vercel begins automatic deployment

**Status Check:**
- ✅ Visit https://github.com/balexbrownii/vck-household-manager
- ✅ Verify all 72 files are there
- ✅ Check commit message is visible

---

## 🗄️ Phase 2: Supabase Setup (10 min)

### Step 1: Create Project in Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Project name**: `vck-household-manager`
   - **Database Password**: Generate strong password (⚠️ Save this!)
   - **Region**: Choose closest to you (e.g., `us-east-1`, `eu-west-1`)
   - **Pricing Plan**: Free tier is fine
4. Click **"Create new project"**
5. Wait 1-2 minutes for database to initialize

### Step 2: Get Your API Credentials

Once project is created:

1. Go to **Settings** → **API**
2. Copy and save these values (you'll need them):
   - **Project URL**: Something like `https://xxxxx.supabase.co`
   - **Anon Key**: Long string starting with `eyJ...`
   - **Service Role Key**: For reference only (don't share)

### Step 3: Apply Database Migrations

Using **Supabase CLI** (Recommended):

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login to Supabase
supabase login
# This opens browser to authenticate

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
# Replace YOUR_PROJECT_REF with your actual project ref (visible in Supabase URL)

# Apply all migrations
supabase db push
# This runs all migrations in order (001-007)
```

**OR** Using **Supabase Dashboard** (Manual):

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Open: `supabase/migrations/001_initial_schema.sql`
4. Copy all contents and paste into SQL Editor
5. Click **"Run"** and wait for success
6. Repeat for `002_chore_system.sql` through `007_seed_data.sql` **in order**

⚠️ **Important**: Migrations must run in order (001 → 007)

### Step 4: Verify Database Setup

In Supabase Dashboard:

1. Click **"Tables"** in left sidebar
2. Verify you see **12 tables**:
   - ✓ kids
   - ✓ user_profiles
   - ✓ chore_rotation_state
   - ✓ chore_assignments
   - ✓ chore_rooms
   - ✓ chore_completions
   - ✓ daily_expectations
   - ✓ gigs
   - ✓ claimed_gigs
   - ✓ star_history
   - ✓ screen_time_sessions
   - ✓ timeout_violations

3. Click on **"kids"** table
4. Verify you see **3 kids**:
   - Simone (8)
   - Alexander (11)
   - Elise (13)

✅ **Database is ready!**

---

## 🚀 Phase 3: Vercel Deployment (10 min)

### Option A: Automatic (Recommended)

Once you push to GitHub, Vercel automatically detects it:

1. Go to https://vercel.com/dashboard
2. You should see **"vck-household-manager"** in your projects
3. Click on it to watch deployment progress

### Option B: Manual Push via Vercel CLI

```bash
cd /home/alex/projects/balexbrownii/vck-household-manager

# Install Vercel CLI if needed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# CLI will ask you questions:
# • "Are you in the right directory?" → Y
# • Settings → use defaults (press Enter)
# • Environment variables → will prompt after
```

### Step 1: Add Environment Variables to Vercel

**In Vercel Dashboard:**

1. Go to your project
2. Click **"Settings"** → **"Environment Variables"**
3. Add **two variables**:

| Name | Value | Scope |
|------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` (your URL) | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (your anon key) | Production |

4. Click **"Save"**
5. Go to **"Deployments"** tab
6. Click **"Redeploy"** button to rebuild with new env vars

### Step 2: Wait for Deployment

Vercel will show:
- ✅ **Building** (2-3 min)
- ✅ **Verifying**
- ✅ **Ready** - Your app is live!

You'll get a URL like: `https://vck-household-manager.vercel.app`

---

## ✅ Phase 4: Production Testing (5 min)

### Test Your Live App

1. Visit your Vercel URL (e.g., `https://vck-household-manager.vercel.app`)
2. Sign up with a test account
3. Verify these features work:

**Dashboard**
- ✅ Can see 3 kids (Simone, Alexander, Elise)
- ✅ Can see daily expectations
- ✅ Can toggle expectations
- ✅ Screen time shows lock/unlock status

**Navigation**
- ✅ Top nav bar works
- ✅ Can click "Browse All Gigs"
- ✅ Can click "Inspect Gigs"
- ✅ Can click "Timeout Management"
- ✅ Can click "Analytics"
- ✅ Can click "Charts"

**Features**
- ✅ Can view gig catalog
- ✅ Can download PDF chart
- ✅ Can view screen time timers
- ✅ Can log a timeout

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Cannot connect to Supabase" | Wrong credentials | Check env vars in Vercel Settings |
| "Tables don't exist" | Migrations didn't run | Go back to Phase 2 Step 3 |
| "404 Not Found" on features | Build cached old version | Click "Redeploy" in Vercel |
| "Environment variables not found" | Need rebuild | Go to Deployments → Redeploy |

---

## 🎉 Deployment Complete!

### Summary

| Component | Status | Location |
|-----------|--------|----------|
| **Code** | ✅ Pushed | https://github.com/balexbrownii/vck-household-manager |
| **Database** | ✅ Created | https://supabase.com/dashboard |
| **App** | ✅ Live | https://vck-household-manager.vercel.app |
| **Auto-Deploy** | ✅ Enabled | Pushes to GitHub → Auto-deploy to Vercel |

---

## 🚀 Next Steps

### 1. Set Up Accounts (10 min)

Create parent accounts:
1. Visit your production URL
2. Click "Sign Up"
3. Create account for Mom with email/password
4. Create account for Dad with email/password
5. Both can now log in and manage the system

### 2. Brief Training (15 min)

Show each family member:
- **Mom**: Dashboard, gig inspection, timeout logging
- **Dad**: Analytics dashboard, performance trends
- **Kids**: Can view own status, see timers, claim gigs

### 3. Week 1: Monitor & Iterate

- Watch for any bugs or issues
- Collect family feedback
- Note what works well, what needs improvement
- Check Vercel Analytics for performance

### 4. Week 2+: Optimize & Enhance

- Implement improvements based on feedback
- Celebrate wins and milestones
- Plan Phase 2 features (notifications, Skylight integration, etc.)

---

## 📚 Documentation

- **QUICKSTART.md** - Quick reference (5 min read)
- **DEPLOYMENT.md** - Full deployment details
- **README.md** - Project overview

---

## 🆘 Troubleshooting

### GitHub Push Fails

```bash
# Error: "remote repository not found"
# Solution: Ensure repository exists on GitHub
git remote -v  # verify URL is correct

# Error: "Permission denied"
# Solution: Authenticate with GitHub
gh auth login
# OR for HTTPS:
git config --global credential.helper store
# Then git push will prompt for token
```

### Supabase Migrations Fail

```bash
# Check migration status
supabase status

# Rerun migrations (from project root)
supabase db push

# View logs in Supabase Dashboard → SQL Editor
# Look for error messages
```

### Vercel Deployment Fails

1. Check deployment logs in Vercel Dashboard
2. Common issues:
   - TypeScript errors: Run `npm run build` locally
   - Missing env vars: Add to Settings → Environment Variables
   - node_modules issue: Delete `.next` folder locally and redeploy

### App Shows Blank Page

1. Check browser console for errors (F12)
2. Check Vercel deployment logs
3. Verify environment variables are set
4. Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

---

## ✨ You're Ready!

All 10 phases complete. Your VCK Household Manager is live and ready for your family to use! 🎊

For detailed questions, check DEPLOYMENT.md or the official docs:
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs
