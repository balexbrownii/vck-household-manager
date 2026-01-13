# StarKids

A family household management app that helps kids earn stars through chores, gigs, and daily responsibilities. Built on the Value Creation Kid methodology.

## Features

- **Kid Dashboard** - Each child has their own mobile-friendly dashboard
- **PIN-based Login** - Kids log in with their own 4-digit PIN
- **Star System** - Kids earn stars for completing tasks (200 stars = $100)
- **Daily Expectations** - Track exercise, reading, tidying, and daily chores
- **Rotating Chores** - Weekly chore assignments (Kitchen, Laundry, Common Areas)
- **Gigs** - Extra tasks kids can claim for bonus stars
- **Photo Verification** - Kids submit photos of completed work
- **Parental Approval** - Parents review and approve submissions
- **Timeout Tracking** - Log and track behavioral timeouts
- **Meal Planning** - Brown Family Diet integration with recipes

## Technology Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript** (strict mode)
- **Tailwind CSS**
- **Supabase** (PostgreSQL + Auth + Storage)
- **Zustand** (state management)
- **React Hook Form + Zod** (forms)
- **jsPDF** (PDF generation)

## Getting Started

### 1. Setup Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Copy your project URL and anon key to `.env.local`
3. Create a storage bucket named `completion-photos`
4. Run migrations (see Database section below)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## User Access

### Parent Login
- Visit `/login` to access the parent dashboard
- Use email/password authentication
- Review submissions, manage kids, track progress

### Kid Login
- Visit `/kid-login` to access the kid dashboard
- Select your name and enter your 4-digit PIN
- View tasks, claim gigs, submit completed work

## Database

Database migrations are located in `supabase/migrations/`:

1. `001_initial_schema.sql` - Core tables
2. `002_chore_system.sql` - Chore assignments and rooms
3. `003_gigs_system.sql` - Gigs and stars
4. `004_screen_time.sql` - Screen time tracking
5. `005_timeout_tracking.sql` - Timeout violations
6. `006_seed_data.sql` - Initial data
7. `007_indexes_triggers.sql` - Indexes and triggers
8. `008_meal_planning.sql` - Meal planning system
9. `009_seed_recipes.sql` - Brown Family Diet recipes
10. `010_child_auth_and_photos.sql` - Kid auth and photo submissions

## Project Structure

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # Parent dashboard
├── login/                  # Parent authentication
├── kid-login/              # Kid PIN login
├── kid-dashboard/          # Kid pages
│   ├── page.tsx            # Kid main dashboard
│   ├── chores/             # Chore tracking
│   ├── gigs/               # Available gigs
│   ├── submit/             # Photo submission
│   └── my-stars/           # Star history
├── dashboard/              # Parent pages
│   └── review/             # Review submissions
└── api/                    # API routes
    ├── kid-auth/           # Kid authentication
    ├── photos/             # Photo uploads & review
    ├── chores/
    ├── gigs/
    ├── stars/
    └── expectations/
```

## Development

Build for production:

```bash
npm run build
npm run start
```

## License

Private - Family use only
