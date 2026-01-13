-- Add timeout serving flow fields
-- Tracks when kid starts serving, when they complete, pending parent approval

ALTER TABLE timeout_violations
ADD COLUMN serving_started_at TIMESTAMPTZ,
ADD COLUMN served_at TIMESTAMPTZ;

-- Add comments for clarity
COMMENT ON COLUMN timeout_violations.started_at IS 'When parent logged the violation';
COMMENT ON COLUMN timeout_violations.serving_started_at IS 'When kid started serving the timeout';
COMMENT ON COLUMN timeout_violations.served_at IS 'When kid marked timeout as served (pending parent approval)';
COMMENT ON COLUMN timeout_violations.completed_at IS 'When parent approved the completed timeout';

-- Create index for pending approvals
CREATE INDEX idx_violations_pending_approval ON timeout_violations(kid_id)
  WHERE served_at IS NOT NULL AND completed_at IS NULL;
