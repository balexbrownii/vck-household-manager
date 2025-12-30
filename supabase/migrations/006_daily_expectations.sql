-- Create daily expectations table
CREATE TABLE daily_expectations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  exercise_complete BOOLEAN NOT NULL DEFAULT FALSE,
  reading_complete BOOLEAN NOT NULL DEFAULT FALSE,
  tidy_up_complete BOOLEAN NOT NULL DEFAULT FALSE,
  daily_chore_complete BOOLEAN NOT NULL DEFAULT FALSE,
  all_complete BOOLEAN GENERATED ALWAYS AS (
    exercise_complete AND reading_complete AND tidy_up_complete AND daily_chore_complete
  ) STORED,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kid_id, date)
);

-- Create indexes
CREATE INDEX idx_expectations_kid_date ON daily_expectations(kid_id, date DESC);
CREATE INDEX idx_expectations_incomplete ON daily_expectations(kid_id, date)
  WHERE all_complete = FALSE;
CREATE INDEX idx_expectations_all_complete ON daily_expectations(all_complete, date DESC);

-- Enable RLS
ALTER TABLE daily_expectations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view daily expectations" ON daily_expectations FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can insert daily expectations" ON daily_expectations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can update daily expectations" ON daily_expectations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

-- Trigger for updated_at
CREATE TRIGGER daily_expectations_updated_at BEFORE UPDATE ON daily_expectations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
