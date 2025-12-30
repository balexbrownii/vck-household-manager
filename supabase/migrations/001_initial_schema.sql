-- Create kids table
CREATE TABLE kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 0 AND age <= 18),
  screen_time_weekday_minutes INTEGER NOT NULL DEFAULT 60,
  screen_time_weekend_minutes INTEGER NOT NULL DEFAULT 120,
  screen_time_cutoff_weekday TIME NOT NULL DEFAULT '19:30:00',
  screen_time_cutoff_weekend TIME NOT NULL DEFAULT '20:00:00',
  max_gig_tier INTEGER NOT NULL DEFAULT 1 CHECK (max_gig_tier BETWEEN 1 AND 5),
  total_stars INTEGER NOT NULL DEFAULT 0,
  milestones_reached INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for kids
CREATE INDEX idx_kids_total_stars ON kids(total_stars);

-- Create user profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('parent', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chore rotation state (singleton)
CREATE TABLE chore_rotation_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_week CHAR(1) NOT NULL CHECK (current_week IN ('A', 'B', 'C')),
  week_start_date DATE NOT NULL,
  next_rotation_date DATE NOT NULL,
  last_rotated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Singleton constraint
CREATE UNIQUE INDEX idx_rotation_singleton ON chore_rotation_state((TRUE));

-- Enable RLS on all tables
ALTER TABLE kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_rotation_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parents to view all data
CREATE POLICY "Parents can view all kids" ON kids FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can update kids" ON kids FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can view user profiles" ON user_profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Rotation state is visible to parents" ON chore_rotation_state FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

-- Auto-update function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER kids_updated_at BEFORE UPDATE ON kids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER chore_rotation_state_updated_at BEFORE UPDATE ON chore_rotation_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
