-- Seed chore rotation state
INSERT INTO chore_rotation_state (current_week, week_start_date, next_rotation_date)
VALUES ('A', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days');

-- Seed kids with their screen time limits
INSERT INTO kids (name, age, screen_time_weekday_minutes, screen_time_weekend_minutes,
                  screen_time_cutoff_weekday, screen_time_cutoff_weekend, max_gig_tier)
VALUES
  ('Simone', 8, 60, 120, '19:30:00', '20:00:00', 2),
  ('Alexander', 11, 90, 150, '20:00:00', '20:30:00', 3),
  ('Elise', 13, 120, 180, '20:30:00', '21:00:00', 5);

-- Seed chore assignments for Week A
INSERT INTO chore_assignments (kid_id, week, assignment)
SELECT id, 'A', assignment FROM (
  SELECT (SELECT id FROM kids WHERE name = 'Simone') AS kid_id, 'Bathrooms & Entry' AS assignment
  UNION ALL
  SELECT (SELECT id FROM kids WHERE name = 'Alexander'), 'Living Spaces'
  UNION ALL
  SELECT (SELECT id FROM kids WHERE name = 'Elise'), 'Kitchen'
) AS data;

-- Seed chore assignments for Week B
INSERT INTO chore_assignments (kid_id, week, assignment)
SELECT id, 'B', assignment FROM (
  SELECT (SELECT id FROM kids WHERE name = 'Simone') AS kid_id, 'Kitchen' AS assignment
  UNION ALL
  SELECT (SELECT id FROM kids WHERE name = 'Alexander'), 'Bathrooms & Entry'
  UNION ALL
  SELECT (SELECT id FROM kids WHERE name = 'Elise'), 'Living Spaces'
) AS data;

-- Seed chore assignments for Week C
INSERT INTO chore_assignments (kid_id, week, assignment)
SELECT id, 'C', assignment FROM (
  SELECT (SELECT id FROM kids WHERE name = 'Simone') AS kid_id, 'Living Spaces' AS assignment
  UNION ALL
  SELECT (SELECT id FROM kids WHERE name = 'Alexander'), 'Kitchen'
  UNION ALL
  SELECT (SELECT id FROM kids WHERE name = 'Elise'), 'Bathrooms & Entry'
) AS data;

-- Seed chore rooms for Kitchen (daily, same all week)
INSERT INTO chore_rooms (assignment, day_of_week, room_name, checklist)
VALUES
  ('Kitchen', 0, 'Kitchen Daily', '["Unload dishwasher", "Load dishes", "Wipe counters", "Wipe table", "Sweep floor", "Take trash out"]'),
  ('Kitchen', 1, 'Kitchen Daily', '["Unload dishwasher", "Load dishes", "Wipe counters", "Wipe table", "Sweep floor"]'),
  ('Kitchen', 2, 'Kitchen Daily', '["Unload dishwasher", "Load dishes", "Wipe counters", "Wipe table", "Sweep floor"]'),
  ('Kitchen', 3, 'Kitchen Daily', '["Unload dishwasher", "Load dishes", "Wipe counters", "Wipe table", "Sweep floor"]'),
  ('Kitchen', 4, 'Kitchen Daily', '["Unload dishwasher", "Load dishes", "Wipe counters", "Wipe table", "Sweep floor"]'),
  ('Kitchen', 5, 'Kitchen Daily', '["Unload dishwasher", "Load dishes", "Wipe counters", "Wipe table", "Sweep floor"]'),
  ('Kitchen', 6, 'Kitchen Daily', '["Unload dishwasher", "Load dishes", "Wipe counters", "Wipe table", "Sweep floor"]');

-- Seed chore rooms for Living Spaces (rotates by day)
INSERT INTO chore_rooms (assignment, day_of_week, room_name, checklist)
VALUES
  ('Living Spaces', 1, 'Living Room', '["Vacuum floor", "Straighten pillows", "Fold blankets", "Wipe tables"]'),
  ('Living Spaces', 2, 'Family Room', '["Vacuum floor", "Straighten pillows", "Fold blankets", "Wipe tables"]'),
  ('Living Spaces', 3, 'Dining Room', '["Vacuum/sweep floor", "Wipe table", "Wipe chairs"]'),
  ('Living Spaces', 4, 'Hallways & Stairs', '["Vacuum hallways", "Vacuum stairs", "Wipe handrails"]'),
  ('Living Spaces', 5, 'Touch-Up', '["Straighten pillows", "Fold blankets", "Wipe any missed surfaces"]'),
  ('Living Spaces', 6, 'Touch-Up', '["Straighten pillows", "Fold blankets", "Wipe any missed surfaces"]');

-- Seed chore rooms for Bathrooms & Entry (rotates by day)
INSERT INTO chore_rooms (assignment, day_of_week, room_name, checklist)
VALUES
  ('Bathrooms & Entry', 1, 'Bathroom #1', '["Wipe counter", "Wipe mirror", "Wipe sink", "Sweep floor", "Empty trash"]'),
  ('Bathrooms & Entry', 2, 'Bathroom #2', '["Wipe counter", "Wipe mirror", "Wipe sink", "Sweep floor", "Empty trash"]'),
  ('Bathrooms & Entry', 3, 'Bathroom #3', '["Wipe counter", "Wipe mirror", "Wipe sink", "Sweep floor", "Empty trash"]'),
  ('Bathrooms & Entry', 4, 'Bathroom #4', '["Wipe counter", "Wipe mirror", "Wipe sink", "Sweep floor", "Empty trash"]'),
  ('Bathrooms & Entry', 5, 'Entry & Mudroom', '["Organize shoes", "Sweep floor", "Wipe door handles", "Straighten coats"]'),
  ('Bathrooms & Entry', 6, 'Entry & Mudroom', '["Organize shoes", "Sweep floor", "Wipe door handles", "Straighten coats"]');

-- Seed Tier 1 Gigs (Easy - 10 stars = $5)
INSERT INTO gigs (title, description, tier, stars, estimated_minutes, checklist)
VALUES
  ('Swimming 20 Min', 'Swim for 20 minutes (counts as exercise too!)', 1, 10, 20, '["Swim continuously for 20 minutes", "Bonus: Counts as daily exercise"]'),
  ('Wipe Light Switches', 'Wipe all light switches in house with microfiber cloth', 1, 10, 15, '["All switches wiped clean", "No smudges or streaks"]'),
  ('Water Indoor Plants', 'Water all indoor plants', 1, 10, 15, '["Check soil moisture first", "Water only if dry", "No spills on floor"]'),
  ('Sweep Porch', 'Sweep the front and back porch', 1, 10, 12, '["Both porches swept clean", "No debris left behind"]'),
  ('Organize Junk Drawer', 'Organize and clean out one junk drawer', 1, 10, 20, '["All items sorted", "Drawer cleaned", "Organized neatly"]'),
  ('Wash One Vehicle', 'Wash exterior of one vehicle', 1, 10, 25, '["Vehicle washed clean", "No soap residue", "Dried completely"]');

-- Seed Tier 2 Gigs (Moderate - 20 stars = $10)
INSERT INTO gigs (title, description, tier, stars, estimated_minutes, checklist)
VALUES
  ('Deep Clean One Bathroom', 'Thorough cleaning of one bathroom', 2, 20, 35, '["Scrub toilet", "Wipe counter + sink", "Clean mirror", "Sweep + mop floor", "Empty trash"]'),
  ('Vacuum & Mop Hard Floors', 'Vacuum and mop all hard floors in house', 2, 20, 40, '["Vacuum all hard floor areas", "Mop floors cleanly", "No sticky spots"]'),
  ('Clean All House Mirrors', 'Clean all mirrors in the house', 2, 20, 20, '["All mirrors streak-free", "No fingerprints", "Clean edges"]'),
  ('Organize Closet', 'Organize and clean one closet', 2, 20, 30, '["Clothes organized by type", "Hangers aligned", "Floor swept"]'),
  ('Wash All Vehicles', 'Wash exterior of both vehicles', 2, 20, 40, '["Both vehicles washed clean", "Dried completely", "No soap residue"]'),
  ('Do Laundry Load', 'Complete one load (wash, dry, fold, deliver)', 2, 20, 45, '["Load washed", "Load dried", "Folded neatly", "Put away in rooms"]');

-- Seed Tier 3 Gigs (Difficult - 30 stars = $15)
INSERT INTO gigs (title, description, tier, stars, estimated_minutes, checklist)
VALUES
  ('Deep Clean Two Bathrooms', 'Thorough deep cleaning of two bathrooms', 3, 30, 50, '["Both bathrooms thoroughly cleaned", "Scrubbed toilets", "Shiny mirrors", "Mopped floors"]'),
  ('Vacuum Entire House', 'Vacuum entire house including all rooms', 3, 30, 45, '["All rooms vacuumed", "Under furniture done", "Edges and corners", "Vacuum emptied"]'),
  ('Dust Entire House', 'Dust all surfaces throughout house', 3, 30, 40, '["All surfaces dusted", "No dust streaks", "Furniture polished"]'),
  ('Full Kitchen Deep Clean', 'Deep clean kitchen top to bottom', 3, 30, 60, '["Appliances cleaned", "Cabinets wiped", "Floor mopped", "All surfaces shining"]'),
  ('Clean All Interior Windows', 'Clean all interior windows in house', 3, 30, 50, '["All windows streak-free", "No fingerprints", "Window sills cleaned"]'),
  ('Major Storage Organization', 'Organize and clean one major storage area', 3, 30, 60, '["Everything organized", "Cleaned thoroughly", "Neatly labeled"]');

-- Seed Tier 4 Gigs (Very Difficult - 40 stars = $20)
INSERT INTO gigs (title, description, tier, stars, estimated_minutes, checklist)
VALUES
  ('Three Loads Laundry', 'Complete three loads of laundry', 4, 40, 90, '["All three loads washed, dried, folded", "Put away in all rooms"]'),
  ('Deep Clean Entire Kitchen', 'Top-to-bottom kitchen deep clean', 4, 40, 75, '["Appliances inside & out", "All cabinets wiped", "Floor scrubbed", "Everything shining"]'),
  ('Strip & Wash All Beds', 'Strip all beds and wash all linens', 4, 40, 80, '["All sheets washed", "All blankets washed", "Beds remade"]'),
  ('Pressure Wash Driveway', 'Pressure wash the entire driveway', 4, 40, 90, '["Entire driveway clean", "No stains remaining", "Edges cleaned"]'),
  ('Cook Complete Meal', 'Plan and cook complete dinner for family', 4, 40, 100, '["Meal planned", "All ingredients prepped", "Cooked properly", "Table set", "Dishes cleaned"]');

-- Seed Tier 5 Gigs (Premium - 50+ stars = $25+)
INSERT INTO gigs (title, description, tier, stars, estimated_minutes, checklist)
VALUES
  ('Organize Entire Garage', 'Organize and clean out entire garage', 5, 50, 120, '["Everything organized", "Zones created", "Thoroughly cleaned", "All items categorized"]'),
  ('Full House Deep Clean Day', 'Complete top-to-bottom house cleaning', 5, 60, 180, '["All rooms cleaned", "All surfaces dusted", "All floors vacuumed/mopped", "Windows cleaned", "Bathrooms scrubbed"]'),
  ('Seasonal Yard Transformation', 'Major seasonal yard work (mulching, landscaping)', 5, 60, 150, '["Yard significantly improved", "All work completed", "Clean up done"]');
