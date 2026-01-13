-- Migration 010: AI Review Rules Schema
-- Adds AI-powered photo evaluation for gigs, chores, and expectations

-- =============================================================================
-- 1. ADD AI REVIEW COLUMNS TO GIGS TABLE
-- =============================================================================

ALTER TABLE gigs
ADD COLUMN scope_description TEXT,
ADD COLUMN completion_criteria TEXT,
ADD COLUMN ai_review_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN gigs.scope_description IS 'Description of what needs to be done for this gig';
COMMENT ON COLUMN gigs.completion_criteria IS 'What "done" looks like - criteria for AI evaluation';
COMMENT ON COLUMN gigs.ai_review_enabled IS 'Whether AI should pre-screen submissions for this gig';

-- =============================================================================
-- 2. ADD AI REVIEW COLUMNS TO CHORE_ROOMS TABLE
-- =============================================================================

ALTER TABLE chore_rooms
ADD COLUMN scope_description TEXT,
ADD COLUMN completion_criteria TEXT,
ADD COLUMN ai_review_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN chore_rooms.scope_description IS 'Description of what needs to be done for this chore';
COMMENT ON COLUMN chore_rooms.completion_criteria IS 'What "done" looks like - criteria for AI evaluation';
COMMENT ON COLUMN chore_rooms.ai_review_enabled IS 'Whether AI should pre-screen submissions for this chore';

-- =============================================================================
-- 3. CREATE EXPECTATION RULES TABLE
-- =============================================================================

CREATE TABLE expectation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expectation_type TEXT NOT NULL CHECK (expectation_type IN ('exercise', 'reading', 'tidy_up', 'daily_chore')),
  scope_description TEXT NOT NULL,
  completion_criteria TEXT NOT NULL,
  ai_review_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expectation_type)
);

COMMENT ON TABLE expectation_rules IS 'AI evaluation rules for daily expectations (exercise, reading, etc.)';

-- =============================================================================
-- 4. ADD AI REVIEW COLUMNS TO COMPLETION_PHOTOS TABLE
-- =============================================================================

-- First, drop the existing status check constraint if it exists
DO $$
BEGIN
  ALTER TABLE completion_photos DROP CONSTRAINT IF EXISTS completion_photos_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new status constraint with AI states
ALTER TABLE completion_photos
ADD CONSTRAINT completion_photos_status_check
CHECK (status IN ('ai_reviewing', 'needs_revision', 'pending_review', 'approved', 'rejected'));

-- Add AI review tracking columns
ALTER TABLE completion_photos
ADD COLUMN ai_reviewed_at TIMESTAMPTZ,
ADD COLUMN ai_passed BOOLEAN,
ADD COLUMN ai_feedback TEXT,
ADD COLUMN ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
ADD COLUMN submission_attempt INTEGER NOT NULL DEFAULT 1,
ADD COLUMN escalated_to_parent BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN completion_photos.ai_reviewed_at IS 'When AI completed its review';
COMMENT ON COLUMN completion_photos.ai_passed IS 'Whether AI approved the submission';
COMMENT ON COLUMN completion_photos.ai_feedback IS 'AI-generated feedback for the kid';
COMMENT ON COLUMN completion_photos.ai_confidence IS 'AI confidence score (0-1)';
COMMENT ON COLUMN completion_photos.submission_attempt IS 'Number of times kid has submitted for this task';
COMMENT ON COLUMN completion_photos.escalated_to_parent IS 'Kid bypassed AI and sent directly to parent';

-- =============================================================================
-- 5. CREATE AI REVIEW LOGS TABLE (AUDIT TRAIL)
-- =============================================================================

CREATE TABLE ai_review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_photo_id UUID NOT NULL REFERENCES completion_photos(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  rules_used JSONB NOT NULL,
  ai_response JSONB NOT NULL,
  passed BOOLEAN NOT NULL,
  confidence DECIMAL(3,2),
  processing_time_ms INTEGER,
  model_used TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ai_review_logs IS 'Audit log of all AI evaluation decisions';

-- Indexes for efficient querying
CREATE INDEX idx_ai_review_logs_photo ON ai_review_logs(completion_photo_id);
CREATE INDEX idx_ai_review_logs_created ON ai_review_logs(created_at DESC);
CREATE INDEX idx_completion_photos_status ON completion_photos(status);
CREATE INDEX idx_completion_photos_needs_revision ON completion_photos(kid_id, status)
  WHERE status = 'needs_revision';
CREATE INDEX idx_completion_photos_ai_reviewing ON completion_photos(status)
  WHERE status = 'ai_reviewing';

-- =============================================================================
-- 6. ENABLE RLS AND CREATE POLICIES
-- =============================================================================

ALTER TABLE expectation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_review_logs ENABLE ROW LEVEL SECURITY;

-- Expectation rules policies
CREATE POLICY "Parents can view expectation rules" ON expectation_rules FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can modify expectation rules" ON expectation_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

-- AI review logs policies (read-only for parents)
CREATE POLICY "Parents can view AI review logs" ON ai_review_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

-- Service role can insert AI review logs (for API operations)
CREATE POLICY "Service can insert AI review logs" ON ai_review_logs FOR INSERT
  WITH CHECK (TRUE);

-- =============================================================================
-- 7. SEED DEFAULT EXPECTATION RULES
-- =============================================================================

INSERT INTO expectation_rules (expectation_type, scope_description, completion_criteria) VALUES
(
  'exercise',
  '20+ minutes of physical activity',
  'Photo showing active exercise (running, swimming, sports, playground, workout equipment) or evidence of completed workout (timer screenshot, fitness app summary, sweaty clothes after activity)'
),
(
  'reading',
  '20+ minutes of reading time',
  'Photo showing child actively reading a physical book or e-reader. Book title should be visible. Alternatively, a photo of the book opened to where they stopped reading with a note about what they read.'
),
(
  'tidy_up',
  'Personal space clean and organized',
  'Photo showing clean bedroom with: bed made with covers pulled up neatly, floor clear of clothes and toys, desk/surfaces organized. Should look ready for inspection.'
),
(
  'daily_chore',
  'Daily assigned chore completed',
  'Photo showing the completed chore area. Should demonstrate all items on the daily checklist have been addressed. Area should look clean and organized.'
);

-- =============================================================================
-- 8. TRIGGER FOR UPDATED_AT ON EXPECTATION_RULES
-- =============================================================================

CREATE TRIGGER expectation_rules_updated_at BEFORE UPDATE ON expectation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
