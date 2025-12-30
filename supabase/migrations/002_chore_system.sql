-- Create chore assignments table
CREATE TABLE chore_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  week CHAR(1) NOT NULL CHECK (week IN ('A', 'B', 'C')),
  assignment TEXT NOT NULL CHECK (assignment IN ('Kitchen', 'Living Spaces', 'Bathrooms & Entry', 'Garden')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kid_id, week)
);

-- Create chore rooms table
CREATE TABLE chore_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment TEXT NOT NULL CHECK (assignment IN ('Kitchen', 'Living Spaces', 'Bathrooms & Entry', 'Garden')),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  room_name TEXT NOT NULL,
  checklist JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment, day_of_week)
);

-- Create chore completions table
CREATE TABLE chore_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  assignment TEXT NOT NULL,
  room_name TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kid_id, date)
);

-- Create indexes
CREATE INDEX idx_assignments_week ON chore_assignments(week);
CREATE INDEX idx_completions_kid_date ON chore_completions(kid_id, date DESC);
CREATE INDEX idx_completions_unverified ON chore_completions(kid_id, date)
  WHERE verified_by IS NULL;

-- Enable RLS
ALTER TABLE chore_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view chore assignments" ON chore_assignments FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can view chore rooms" ON chore_rooms FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can view chore completions" ON chore_completions FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can update chore completions" ON chore_completions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can insert chore completions" ON chore_completions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

-- Triggers
CREATE TRIGGER chore_assignments_updated_at BEFORE UPDATE ON chore_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER chore_completions_updated_at BEFORE UPDATE ON chore_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
