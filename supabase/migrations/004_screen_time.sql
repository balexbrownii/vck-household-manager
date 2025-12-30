-- Create screen time sessions table
CREATE TABLE screen_time_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  unlocked_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  base_minutes_allowed INTEGER NOT NULL,
  bonus_minutes_allowed INTEGER NOT NULL DEFAULT 0,
  total_minutes_allowed INTEGER GENERATED ALWAYS AS (base_minutes_allowed + bonus_minutes_allowed) STORED,
  minutes_used INTEGER NOT NULL DEFAULT 0,
  is_weekend BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kid_id, date)
);

-- Create indexes
CREATE INDEX idx_screen_time_kid_date ON screen_time_sessions(kid_id, date DESC);
CREATE INDEX idx_screen_time_active ON screen_time_sessions(kid_id, date)
  WHERE unlocked_at IS NOT NULL AND locked_at IS NULL;

-- Enable RLS
ALTER TABLE screen_time_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view screen time sessions" ON screen_time_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can insert screen time sessions" ON screen_time_sessions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can update screen time sessions" ON screen_time_sessions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

-- Trigger for updated_at
CREATE TRIGGER screen_time_sessions_updated_at BEFORE UPDATE ON screen_time_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
