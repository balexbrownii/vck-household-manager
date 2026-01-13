-- Create recipe categories table
CREATE TABLE recipe_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES recipe_categories(id),
  description TEXT,
  recipe_number INTEGER, -- Original BFD recipe number (1-37)

  -- Nutrient targets per serving
  calories INTEGER,
  protein_g DECIMAL(6,1),
  potassium_mg INTEGER,
  folate_mcg INTEGER,
  b12_mcg DECIMAL(4,1),
  vitamin_c_mg INTEGER,
  magnesium_mg INTEGER,
  fiber_g DECIMAL(4,1),

  -- Prep info
  estimated_minutes INTEGER,
  servings INTEGER NOT NULL DEFAULT 4,

  -- Recipe content (JSONB for flexibility)
  ingredients JSONB NOT NULL DEFAULT '[]',
  instructions JSONB NOT NULL DEFAULT '[]',

  -- Family-specific notes
  alex_modifications TEXT, -- CBS/sulfur restrictions
  alexander_notes TEXT,    -- Histamine considerations
  victoria_notes TEXT,     -- Liver support notes

  -- Status
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal plan entries (which meals are planned for which days)
CREATE TABLE meal_plan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink')),
  servings_planned INTEGER NOT NULL DEFAULT 4,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate meal assignments (one recipe per meal slot)
  CONSTRAINT unique_meal_slot UNIQUE (planned_date, meal_type)
);

-- Meal completions (tracking what was actually eaten)
CREATE TABLE meal_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_entry_id UUID NOT NULL REFERENCES meal_plan_entries(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  served_by UUID REFERENCES auth.users(id),
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kid meal prep participation (links to gigs system)
CREATE TABLE meal_prep_gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_entry_id UUID NOT NULL REFERENCES meal_plan_entries(id) ON DELETE CASCADE,
  kid_id UUID REFERENCES kids(id) ON DELETE CASCADE, -- NULL = available to any kid
  prep_type TEXT NOT NULL CHECK (prep_type IN ('full_cook', 'sous_chef', 'setup', 'cleanup')),
  stars_offered INTEGER NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopping list items (generated from meal plans)
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date DATE NOT NULL,
  ingredient_name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  category TEXT, -- produce, protein, dairy, pantry, frozen, etc.
  source_recipe_ids UUID[] DEFAULT '{}',
  purchased BOOLEAN NOT NULL DEFAULT FALSE,
  purchased_at TIMESTAMPTZ,
  purchased_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One entry per ingredient per week
  CONSTRAINT unique_ingredient_per_week UNIQUE (week_start_date, ingredient_name)
);

-- Indexes
CREATE INDEX idx_recipes_category ON recipes(category_id) WHERE active = TRUE;
CREATE INDEX idx_recipes_active ON recipes(active) WHERE active = TRUE;
CREATE INDEX idx_meal_plan_date ON meal_plan_entries(planned_date);
CREATE INDEX idx_meal_plan_week ON meal_plan_entries(planned_date)
  WHERE planned_date >= CURRENT_DATE - INTERVAL '7 days';
CREATE INDEX idx_meal_plan_type ON meal_plan_entries(meal_type);
CREATE INDEX idx_meal_completions_entry ON meal_completions(meal_plan_entry_id);
CREATE INDEX idx_shopping_list_week ON shopping_list_items(week_start_date) WHERE purchased = FALSE;
CREATE INDEX idx_meal_prep_gigs_status ON meal_prep_gigs(status) WHERE status = 'available';
CREATE INDEX idx_meal_prep_gigs_kid ON meal_prep_gigs(kid_id) WHERE kid_id IS NOT NULL;

-- Enable RLS
ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_prep_gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipe_categories
CREATE POLICY "Parents can view recipe categories" ON recipe_categories FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

-- RLS Policies for recipes
CREATE POLICY "Parents can view recipes" ON recipes FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can insert recipes" ON recipes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can update recipes" ON recipes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

-- RLS Policies for meal_plan_entries
CREATE POLICY "Parents can view meal plans" ON meal_plan_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can insert meal plans" ON meal_plan_entries FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can update meal plans" ON meal_plan_entries FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can delete meal plans" ON meal_plan_entries FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

-- RLS Policies for meal_completions
CREATE POLICY "Parents can view meal completions" ON meal_completions FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can insert meal completions" ON meal_completions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

-- RLS Policies for meal_prep_gigs
CREATE POLICY "Parents can view meal prep gigs" ON meal_prep_gigs FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can insert meal prep gigs" ON meal_prep_gigs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can update meal prep gigs" ON meal_prep_gigs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

-- RLS Policies for shopping_list_items
CREATE POLICY "Parents can view shopping list" ON shopping_list_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can insert shopping list" ON shopping_list_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can update shopping list" ON shopping_list_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

CREATE POLICY "Parents can delete shopping list" ON shopping_list_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('parent', 'admin')));

-- Triggers for updated_at
CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER meal_plan_entries_updated_at BEFORE UPDATE ON meal_plan_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER meal_prep_gigs_updated_at BEFORE UPDATE ON meal_prep_gigs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER shopping_list_items_updated_at BEFORE UPDATE ON shopping_list_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
