-- Create timeout violations table
CREATE TABLE timeout_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL,
  timeout_minutes INTEGER NOT NULL CHECK (timeout_minutes BETWEEN 5 AND 60),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  reset_count INTEGER NOT NULL DEFAULT 0,
  doubled BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  logged_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_violations_kid ON timeout_violations(kid_id, started_at DESC);
CREATE INDEX idx_violations_active ON timeout_violations(kid_id)
  WHERE completed_at IS NULL;
CREATE INDEX idx_violations_patterns ON timeout_violations(kid_id, violation_type, started_at DESC);

-- Enable RLS
ALTER TABLE timeout_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view timeout violations" ON timeout_violations FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can insert timeout violations" ON timeout_violations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can update timeout violations" ON timeout_violations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));
