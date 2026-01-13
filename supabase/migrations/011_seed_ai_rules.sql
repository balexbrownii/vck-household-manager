-- Migration 011: Seed AI Rules for Existing Gigs and Chores
-- Populates scope_description and completion_criteria for existing data

-- =============================================================================
-- 1. UPDATE EXISTING GIGS WITH DEFAULT RULES
-- =============================================================================

-- Set scope_description from existing description field
-- Set completion_criteria from existing checklist items
UPDATE gigs SET
  scope_description = description,
  completion_criteria = 'Photo should show: ' || (
    SELECT string_agg(item, '; ')
    FROM jsonb_array_elements_text(checklist) AS item
  )
WHERE scope_description IS NULL;

-- =============================================================================
-- 2. UPDATE EXISTING CHORE_ROOMS WITH DEFAULT RULES
-- =============================================================================

-- Set scope_description based on room_name and assignment
-- Set completion_criteria from checklist items
UPDATE chore_rooms SET
  scope_description = 'Clean and maintain the ' || room_name || ' as part of ' || assignment || ' duties',
  completion_criteria = 'Photo should show completed tasks: ' || (
    SELECT string_agg(item, '; ')
    FROM jsonb_array_elements_text(checklist) AS item
  )
WHERE scope_description IS NULL;

-- =============================================================================
-- 3. ADD MORE DETAILED CRITERIA FOR SPECIFIC GIGS (BY TITLE MATCHING)
-- =============================================================================

-- Pool/swimming related gigs
UPDATE gigs SET
  completion_criteria = 'Photo showing: pool area clean and organized, pool robot in water running OR child actively swimming. If claiming exercise credit, show evidence of 20+ minutes of swimming activity.'
WHERE LOWER(title) LIKE '%pool%' OR LOWER(title) LIKE '%swim%';

-- Garden/outdoor gigs
UPDATE gigs SET
  completion_criteria = 'Photo showing: area clear of debris, plants watered (wet soil visible), any weeds pulled, tools stored properly.'
WHERE LOWER(title) LIKE '%garden%' OR LOWER(title) LIKE '%weed%' OR LOWER(title) LIKE '%yard%';

-- Cleaning gigs
UPDATE gigs SET
  completion_criteria = 'Photo showing: surfaces wiped clean, floor swept/vacuumed, items organized and put away. No visible dirt, dust, or clutter.'
WHERE LOWER(title) LIKE '%clean%' OR LOWER(title) LIKE '%tidy%' OR LOWER(title) LIKE '%organize%';

-- Laundry gigs
UPDATE gigs SET
  completion_criteria = 'Photo showing: laundry folded neatly, clothes sorted by owner, items ready to be put away OR actively being folded.'
WHERE LOWER(title) LIKE '%laundry%' OR LOWER(title) LIKE '%fold%' OR LOWER(title) LIKE '%clothes%';

-- Dish/kitchen gigs
UPDATE gigs SET
  completion_criteria = 'Photo showing: dishes clean and put away OR drying rack organized, counters wiped, sink empty and clean.'
WHERE LOWER(title) LIKE '%dish%' OR LOWER(title) LIKE '%kitchen%';

-- =============================================================================
-- 4. ENHANCE CHORE ROOM CRITERIA BY ASSIGNMENT TYPE
-- =============================================================================

-- Kitchen assignment
UPDATE chore_rooms SET
  completion_criteria = 'Photo showing: counters wiped and clear, dishes done or in dishwasher, sink clean, floor swept, trash taken out if needed. All surfaces should be clean and dry.'
WHERE assignment = 'Kitchen';

-- Living Spaces assignment
UPDATE chore_rooms SET
  completion_criteria = 'Photo showing: surfaces dusted, floor vacuumed/swept, pillows arranged, no clutter on furniture, windows clean if applicable. Room should look guest-ready.'
WHERE assignment = 'Living Spaces';

-- Bathrooms & Entry assignment
UPDATE chore_rooms SET
  completion_criteria = 'Photo showing: toilet clean inside and out, sink and counter wiped, mirror streak-free, floor mopped/swept, towels hung neatly, trash emptied.'
WHERE assignment = 'Bathrooms & Entry';

-- Garden assignment
UPDATE chore_rooms SET
  completion_criteria = 'Photo showing: plants watered (wet soil), debris cleared, weeds pulled, tools stored, pathways clear. Garden should look maintained and tidy.'
WHERE assignment = 'Garden';
