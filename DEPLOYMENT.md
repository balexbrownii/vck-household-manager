# VCK Household Manager - Deployment Guide

## Phase 10: Production Deployment

Complete guide for setting up Supabase and deploying to Vercel.

---

## Part 1: Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in with your account
3. Click "New Project"
4. Fill in:
   - **Project Name**: `vck-household-manager`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your location (us-east-1 for US East)
5. Click "Create new project" and wait 1-2 minutes for initialization

### Step 2: Get API Keys

Once project is created:

1. Click on your project name
2. Go to **Settings** → **API**
3. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon Key** (under "Project API keys")
   - **Service Role Key** (save for reference, don't share publicly)

### Step 3: Configure Local Environment

1. Copy the environment template:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and fill in your Supabase details:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file (it's in .gitignore, never commit secrets!)

### Step 4: Apply Database Migrations

All migrations are located in `supabase/migrations/`. You'll need to run them in order.

#### Option A: Using Supabase Dashboard (Easiest)

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy & paste the contents of each migration file in order:
   - `001_initial_schema.sql`
   - `002_chore_system.sql`
   - `003_gigs_system.sql`
   - `004_screen_time.sql`
   - `005_timeout_tracking.sql`
   - `006_daily_expectations.sql`
   - `007_seed_data.sql`
4. Click "Run" for each migration
5. Verify no errors appear

#### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI if you don't have it
npm install -g supabase

# Login to your account
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

### Step 5: Verify Database Setup

After running migrations:

1. Go to **Supabase Dashboard** → **Tables**
2. Verify these 12 tables exist:
   - `kids`
   - `user_profiles`
   - `chore_rotation_state`
   - `chore_assignments`
   - `chore_rooms`
   - `chore_completions`
   - `daily_expectations`
   - `gigs`
   - `claimed_gigs`
   - `star_history`
   - `screen_time_sessions`
   - `timeout_violations`

3. Go to **Supabase Dashboard** → **Data** and click on `kids` table
4. Verify you see 3 kids:
   - Simone (8 years old)
   - Alexander (11 years old)
   - Elise (13 years old)

---

## Part 2: Local Testing

Before deploying, test the application locally:

### Step 1: Install Dependencies

```bash
cd /home/alex/projects/balexbrownii/vck-household-manager
npm install
```

### Step 2: Run Development Server

```bash
npm run dev
```

The app should start at `http://localhost:3000`

### Step 3: Test Authentication

1. Open `http://localhost:3000/login`
2. Create a new account with any email/password
3. You should be redirected to the dashboard

### Step 4: Test Core Features

- [ ] Dashboard loads with 3 kids
- [ ] Can toggle daily expectations
- [ ] Can browse gigs catalog
- [ ] Can view screen time timers
- [ ] Can log a timeout
- [ ] Can view analytics
- [ ] Can download a PDF chart

### Step 5: Build for Production

```bash
npm run build
```

Should complete with no errors. Output should say:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
```

---

## Part 3: Vercel Deployment

### Step 1: Prepare Git Repository

```bash
cd /home/alex/projects/balexbrownii/vck-household-manager

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: VCK Household Manager - all phases complete"

# Create remote repository on GitHub
# Then add remote:
git remote add origin https://github.com/YOUR-USERNAME/vck-household-manager.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New..." → "Project"
4. Import the GitHub repository
5. Vercel will auto-detect Next.js
6. Click "Deploy"

### Step 3: Configure Environment Variables in Vercel

After deployment starts (or in Vercel Dashboard):

1. Go to your Vercel project
2. Click **Settings** → **Environment Variables**
3. Add these variables:

| Key | Value | Type |
|-----|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Anon Key | Public |

4. Click "Save"
5. Trigger a redeploy (Settings → Deployments → Redeploy)

### Step 4: Verify Production Deployment

1. Vercel will provide a URL like `https://vck-household-manager.vercel.app`
2. Visit the URL in your browser
3. Test the same features as local testing
4. Create a parent account to verify auth works in production

---

## Part 4: Domain Setup (Optional)

If you want a custom domain:

### Option A: Connect Existing Domain

1. In Vercel Dashboard, go to **Settings** → **Domains**
2. Add your domain
3. Follow DNS configuration instructions
4. Wait 24-48 hours for DNS propagation

### Option B: Use Vercel Subdomain

Default Vercel domain is fine for testing:
- `https://vck-household-manager.vercel.app`

---

## Part 5: Post-Deployment

### Enable Additional Security (Recommended)

In Supabase Dashboard → **Authentication** → **Providers**:

1. **Email/Password**: Already enabled ✓
2. (Optional) Enable Google OAuth for easier login
3. (Optional) Enable GitHub OAuth for easier login

### Set Up Automated Backups

In Supabase Dashboard → **Backups**:

1. Enable "Automated backups"
2. Choose retention period (default 7 days is fine)
3. Backups run daily automatically

### Monitor Performance

In Vercel Dashboard → **Analytics**:

- Monitor page load times
- Track API response times
- Monitor database query performance

---

## Troubleshooting

### Issue: "Invalid login credentials"
- **Cause**: Wrong Supabase URL or Anon Key
- **Fix**: Double-check `.env.local` values match exactly

### Issue: Migrations fail to run
- **Cause**: Migrations may have dependencies
- **Fix**: Ensure all migrations run in order (001 → 007)

### Issue: "NEXT_PUBLIC variables not defined"
- **Cause**: Environment variables not set in Vercel
- **Fix**: Go to Vercel Settings → Environment Variables and add them

### Issue: Database connection timeout
- **Cause**: Firewall or network issue
- **Fix**: Check Supabase "Network" settings, may need to add Vercel IP whitelist

### Issue: Build fails with TypeScript errors
- **Cause**: Type mismatches in code
- **Fix**: Run `npm run build` locally to see exact errors, fix, and redeploy

---

## Monitoring & Maintenance

### Daily Checks

- Vercel deployments are successful (no failed builds)
- No TypeScript errors in Vercel logs
- Database is responsive (query times < 100ms)

### Weekly Checks

- Review analytics dashboard for usage patterns
- Check for any failed API requests
- Verify automated backups completed

### Monthly Checks

- Review Supabase storage usage
- Check if any data migrations needed
- Plan feature updates based on user feedback

---

## Next Steps

Once deployed:

1. **Train Mom**: Show her the dashboard workflow (~5 min walkthrough)
2. **Create Parent Accounts**: Set up email/password for both parents
3. **Test Real Workflows**: Have the family test for 1 week
4. **Collect Feedback**: Note any UX improvements needed
5. **Plan Phase 2**: Post-MVP features (Skylight, notifications, etc.)

---

## Support & Documentation

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Issues**: Create issues for bugs/features

---

## Summary

| Step | Time | Status |
|------|------|--------|
| 1. Supabase Setup | 5 min | ⏳ Next |
| 2. Apply Migrations | 5 min | ⏳ Next |
| 3. Local Testing | 10 min | ⏳ Next |
| 4. Vercel Deployment | 5 min | ⏳ Next |
| 5. Configure Env Vars | 2 min | ⏳ Next |
| 6. Production Testing | 10 min | ⏳ Next |
| **Total** | **37 min** | **Ready** |

Good luck with your deployment! 🚀
