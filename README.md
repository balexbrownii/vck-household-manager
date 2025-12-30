# VCK Household Manager

A Value Creation Kid household management system for tracking daily expectations, rotating chores, paid gigs, screen time, and timeouts for 3 kids (Simone 8, Alexander 11, Elise 13).

## Technology Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript** (strict mode)
- **Tailwind CSS 4.x**
- **Supabase** (PostgreSQL + Auth)
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
3. Run migrations (see Database section below)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database

Database migrations are located in `supabase/migrations/`. Run them sequentially:

1. `001_initial_schema.sql` - Core tables
2. `002_chore_system.sql` - Chore assignments and rooms
3. `003_gigs_system.sql` - Gigs and stars
4. `004_screen_time.sql` - Screen time tracking
5. `005_timeout_tracking.sql` - Timeout violations
6. `006_seed_data.sql` - Initial data (3 kids, gigs, assignments)
7. `007_indexes_triggers.sql` - Indexes and triggers

## Project Structure

```
app/
├── layout.tsx          # Root layout
├── page.tsx            # Dashboard
├── globals.css         # Global styles
├── login/              # Authentication
├── api/                # API routes
│   ├── chores/
│   ├── gigs/
│   ├── screen-time/
│   └── timeout/
└── components/         # React components
```

## Features

- [x] Project scaffolding
- [ ] Authentication
- [ ] Daily expectations tracking
- [ ] Chore rotation system
- [ ] Gigs system with star accumulation
- [ ] Screen time management
- [ ] Timeout enforcement
- [ ] Printable PDF charts
- [ ] Analytics dashboard

## Development

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm run start
```

## License

Private - Family use only
