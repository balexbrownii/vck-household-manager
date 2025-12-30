-- Create gigs table
CREATE TABLE gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 5),
  stars INTEGER NOT NULL CHECK (stars > 0),
  estimated_minutes INTEGER,
  checklist JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create claimed gigs table
CREATE TABLE claimed_gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  inspection_status TEXT CHECK (inspection_status IN ('pending', 'approved', 'rejected')),
  inspected_by UUID REFERENCES auth.users(id),
  inspected_at TIMESTAMPTZ,
  inspection_notes TEXT,
  stars_awarded INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: One active gig per kid at a time
  CONSTRAINT one_active_gig_per_kid UNIQUE (kid_id)
    WHERE inspection_status IS NULL OR inspection_status = 'pending'
);

-- Create star history table
CREATE TABLE star_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  claimed_gig_id UUID REFERENCES claimed_gigs(id) ON DELETE SET NULL,
  stars_earned INTEGER NOT NULL,
  reason TEXT NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_gigs_tier ON gigs(tier) WHERE active = TRUE;
CREATE INDEX idx_gigs_stars ON gigs(stars) WHERE active = TRUE;
CREATE INDEX idx_claimed_gigs_kid ON claimed_gigs(kid_id, claimed_at DESC);
CREATE INDEX idx_claimed_gigs_pending ON claimed_gigs(kid_id)
  WHERE inspection_status IS NULL OR inspection_status = 'pending';
CREATE INDEX idx_star_history_kid ON star_history(kid_id, created_at DESC);

-- Enable RLS
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE star_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view gigs" ON gigs FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can insert gigs" ON gigs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can view claimed gigs" ON claimed_gigs FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can update claimed gigs" ON claimed_gigs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can insert claimed gigs" ON claimed_gigs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can view star history" ON star_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can insert star history" ON star_history FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

-- Function to update kid's total stars
CREATE OR REPLACE FUNCTION update_kid_total_stars()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE kids
  SET total_stars = NEW.balance_after,
      milestones_reached = NEW.balance_after / 200,
      updated_at = NOW()
  WHERE id = NEW.kid_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for star history
CREATE TRIGGER star_history_update_totals
  AFTER INSERT ON star_history
  FOR EACH ROW EXECUTE FUNCTION update_kid_total_stars();

-- Triggers for updated_at
CREATE TRIGGER gigs_updated_at BEFORE UPDATE ON gigs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER claimed_gigs_updated_at BEFORE UPDATE ON claimed_gigs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
