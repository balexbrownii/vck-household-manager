-- Seed recipe categories
INSERT INTO recipe_categories (name, sort_order) VALUES
  ('breakfast', 1),
  ('lunch', 2),
  ('dinner', 3),
  ('snack', 4),
  ('dessert', 5),
  ('drink', 6);

-- Seed all 37 BFD recipes

-- ============================================
-- BREAKFAST RECIPES (1-7)
-- ============================================

INSERT INTO recipes (
  title, category_id, recipe_number, description,
  calories, protein_g, potassium_mg, folate_mcg, b12_mcg, vitamin_c_mg, magnesium_mg,
  estimated_minutes, servings, ingredients, instructions,
  alex_modifications, alexander_notes
) VALUES
(
  'Power Green Smoothie',
  (SELECT id FROM recipe_categories WHERE name = 'breakfast'),
  1,
  'Nutrient-dense morning smoothie with spinach hidden by fruit',
  750, 28, 1450, 263, NULL, 95, NULL,
  5, 1,
  '[
    {"item": "banana", "amount": "1", "unit": "medium", "potassium_mg": 422},
    {"item": "spinach", "amount": "1.5", "unit": "cups", "potassium_mg": 839, "folate_mcg": 263},
    {"item": "strawberries", "amount": "1", "unit": "cup", "vitamin_c_mg": 89},
    {"item": "coconut milk (full fat)", "amount": "1", "unit": "cup"},
    {"item": "almond butter", "amount": "2", "unit": "tbsp"},
    {"item": "collagen peptides", "amount": "1", "unit": "scoop", "protein_g": 18},
    {"item": "chia seeds", "amount": "1", "unit": "tbsp"}
  ]'::jsonb,
  '["Blend all ingredients until smooth", "Serve immediately"]'::jsonb,
  'Use collagen peptides for protein/glycine',
  'Serve immediately - no storage (histamine)'
),
(
  'Chocolate Power Smoothie',
  (SELECT id FROM recipe_categories WHERE name = 'breakfast'),
  2,
  'Chocolate-flavored smoothie that hides spinach with cacao',
  780, 32, 1380, 270, NULL, 75, NULL,
  5, 1,
  '[
    {"item": "banana", "amount": "1", "unit": "medium", "potassium_mg": 422},
    {"item": "spinach", "amount": "1.5", "unit": "cups", "potassium_mg": 839, "folate_mcg": 263},
    {"item": "frozen cherries", "amount": "0.5", "unit": "cup"},
    {"item": "coconut milk", "amount": "1", "unit": "cup"},
    {"item": "cacao powder", "amount": "2", "unit": "tbsp"},
    {"item": "peanut butter", "amount": "2", "unit": "tbsp"},
    {"item": "collagen peptides", "amount": "1", "unit": "scoop", "protein_g": 18},
    {"item": "honey", "amount": "1", "unit": "tbsp"}
  ]'::jsonb,
  '["Blend banana, spinach, and cherries first", "Add remaining ingredients and blend until smooth"]'::jsonb,
  NULL,
  'Fresh prep only - no storage'
),
(
  'Tropical Power Smoothie',
  (SELECT id FROM recipe_categories WHERE name = 'breakfast'),
  3,
  'Tropical fruit smoothie with hidden spinach',
  720, 26, 1520, 275, NULL, 130, NULL,
  5, 1,
  '[
    {"item": "banana", "amount": "1", "unit": "medium", "potassium_mg": 422},
    {"item": "spinach", "amount": "1.5", "unit": "cups", "potassium_mg": 839, "folate_mcg": 263},
    {"item": "mango", "amount": "0.5", "unit": "cup"},
    {"item": "pineapple", "amount": "0.5", "unit": "cup"},
    {"item": "coconut milk", "amount": "1", "unit": "cup"},
    {"item": "almond butter", "amount": "2", "unit": "tbsp"},
    {"item": "collagen peptides", "amount": "1", "unit": "scoop"},
    {"item": "coconut water", "amount": "0.25", "unit": "cup", "potassium_mg": 150}
  ]'::jsonb,
  '["Blend all ingredients until smooth", "Serve immediately"]'::jsonb,
  NULL,
  'Fresh prep only'
),
(
  'Pumpkin Pie Power Smoothie',
  (SELECT id FROM recipe_categories WHERE name = 'breakfast'),
  4,
  'Fall-flavored smoothie with pumpkin puree',
  710, 27, 1480, 260, NULL, 85, NULL,
  5, 1,
  '[
    {"item": "banana", "amount": "1", "unit": "medium", "potassium_mg": 422},
    {"item": "spinach", "amount": "1.5", "unit": "cups", "potassium_mg": 839},
    {"item": "pumpkin puree", "amount": "0.5", "unit": "cup"},
    {"item": "almond milk", "amount": "1", "unit": "cup"},
    {"item": "almond butter", "amount": "2", "unit": "tbsp"},
    {"item": "collagen peptides", "amount": "1", "unit": "scoop"},
    {"item": "pumpkin pie spice", "amount": "1", "unit": "tsp"},
    {"item": "maple syrup", "amount": "1", "unit": "tbsp"},
    {"item": "orange juice", "amount": "0.5", "unit": "orange"}
  ]'::jsonb,
  '["Blend all ingredients until smooth", "Serve immediately"]'::jsonb,
  NULL,
  'Fresh prep only'
),
(
  'Eggs, Potatoes & Peppers',
  (SELECT id FROM recipe_categories WHERE name = 'breakfast'),
  5,
  'Sit-down breakfast with eggs, potatoes and vegetables',
  680, 35, 1420, 180, 1.5, 165, NULL,
  20, 1,
  '[
    {"item": "eggs", "amount": "3", "unit": "large"},
    {"item": "baked potato", "amount": "1", "unit": "medium", "potassium_mg": 926},
    {"item": "bell pepper", "amount": "1", "unit": "large", "vitamin_c_mg": 150},
    {"item": "avocado", "amount": "0.5", "unit": "whole", "potassium_mg": 485},
    {"item": "bacon", "amount": "2", "unit": "strips"},
    {"item": "orange juice", "amount": "0.5", "unit": "cup", "vitamin_c_mg": 60, "potassium_mg": 220}
  ]'::jsonb,
  '["Dice and pan-fry the potato until crispy", "Scramble eggs", "Sauté bell pepper", "Slice avocado", "Serve with bacon and OJ"]'::jsonb,
  'Substitute eggs with 4 oz turkey sausage',
  NULL
),
(
  'Sweet Potato Hash & Eggs',
  (SELECT id FROM recipe_categories WHERE name = 'breakfast'),
  6,
  'Hash with sweet potato, spinach, and eggs',
  650, 32, 1380, 195, 1.5, 175, NULL,
  25, 1,
  '[
    {"item": "eggs", "amount": "3", "unit": "large"},
    {"item": "sweet potato", "amount": "1", "unit": "large", "potassium_mg": 542},
    {"item": "bell pepper", "amount": "1", "unit": "large", "vitamin_c_mg": 150},
    {"item": "spinach", "amount": "1", "unit": "cup"},
    {"item": "avocado", "amount": "0.5", "unit": "whole", "potassium_mg": 485},
    {"item": "olive oil", "amount": "1", "unit": "tbsp"}
  ]'::jsonb,
  '["Cube sweet potato and cook in olive oil until tender", "Add bell pepper and cook 3 min", "Wilt spinach into hash", "Cook eggs as desired", "Top with sliced avocado"]'::jsonb,
  'Substitute eggs with 4 oz ground turkey',
  NULL
),
(
  'Weekend Pancakes',
  (SELECT id FROM recipe_categories WHERE name = 'breakfast'),
  7,
  'Nutrient-dense almond flour pancakes',
  720, 24, 1100, 150, NULL, 90, NULL,
  20, 2,
  '[
    {"item": "almond flour", "amount": "1", "unit": "cup"},
    {"item": "eggs", "amount": "2", "unit": "large"},
    {"item": "banana", "amount": "1", "unit": "medium", "potassium_mg": 422},
    {"item": "coconut milk", "amount": "0.25", "unit": "cup"},
    {"item": "baking powder", "amount": "1", "unit": "tsp"},
    {"item": "vanilla", "amount": "1", "unit": "tsp"},
    {"item": "strawberries", "amount": "1", "unit": "cup", "vitamin_c_mg": 89, "potassium_mg": 220},
    {"item": "almond butter", "amount": "2", "unit": "tbsp"},
    {"item": "maple syrup", "amount": "2", "unit": "tbsp"}
  ]'::jsonb,
  '["Mash banana and mix with eggs", "Add almond flour, coconut milk, baking powder, and vanilla", "Cook pancakes on medium heat", "Serve with strawberries, almond butter, and maple syrup"]'::jsonb,
  'Use flax eggs (1 tbsp ground flax + 3 tbsp water per egg)',
  NULL
);

-- ============================================
-- LUNCH RECIPES (8-12)
-- ============================================

INSERT INTO recipes (
  title, category_id, recipe_number, description,
  calories, protein_g, potassium_mg, folate_mcg, b12_mcg, vitamin_c_mg, magnesium_mg,
  estimated_minutes, servings, ingredients, instructions,
  alex_modifications, alexander_notes
) VALUES
(
  'Power Chicken Tender Box',
  (SELECT id FROM recipe_categories WHERE name = 'lunch'),
  8,
  'Kid-friendly chicken tenders with veggie sides',
  620, 38, 1150, 120, NULL, 95, NULL,
  20, 1,
  '[
    {"item": "chicken breast", "amount": "5", "unit": "oz"},
    {"item": "almond flour", "amount": "0.5", "unit": "cup"},
    {"item": "tapioca flour", "amount": "0.25", "unit": "cup"},
    {"item": "egg", "amount": "1", "unit": "large"},
    {"item": "edamame", "amount": "0.5", "unit": "cup", "potassium_mg": 338, "folate_mcg": 240},
    {"item": "bell pepper", "amount": "1", "unit": "cup", "vitamin_c_mg": 150},
    {"item": "banana", "amount": "1", "unit": "medium", "potassium_mg": 422},
    {"item": "ranch or honey mustard", "amount": "2", "unit": "tbsp"}
  ]'::jsonb,
  '["Cut chicken into strips", "Dredge in egg, then flour mixture with salt, paprika, pepper", "Air fry at 400°F for 12 min", "Pack with edamame, bell pepper strips, and banana"]'::jsonb,
  NULL,
  'Make chicken fresh same-day'
),
(
  'Black Bean Power Wrap',
  (SELECT id FROM recipe_categories WHERE name = 'lunch'),
  9,
  'Protein-packed wrap with black beans and chicken',
  580, 28, 1420, 310, NULL, 85, NULL,
  15, 1,
  '[
    {"item": "Siete tortilla (cassava)", "amount": "1", "unit": "large"},
    {"item": "black beans", "amount": "0.5", "unit": "cup", "potassium_mg": 370, "folate_mcg": 128},
    {"item": "grilled chicken", "amount": "4", "unit": "oz"},
    {"item": "avocado", "amount": "0.5", "unit": "whole", "potassium_mg": 485},
    {"item": "romaine lettuce", "amount": "1", "unit": "cup", "folate_mcg": 64},
    {"item": "bell pepper", "amount": "0.5", "unit": "large", "vitamin_c_mg": 75},
    {"item": "salsa", "amount": "2", "unit": "tbsp"},
    {"item": "lime", "amount": "1", "unit": "wedge"}
  ]'::jsonb,
  '["Warm tortilla", "Layer black beans, chicken, avocado, lettuce, and bell pepper", "Add salsa and squeeze of lime", "Roll up and serve"]'::jsonb,
  NULL,
  NULL
),
(
  'Salmon Salad Power Bowl',
  (SELECT id FROM recipe_categories WHERE name = 'lunch'),
  10,
  'Salmon over greens with avocado and edamame',
  640, 42, 1380, 290, 2.5, 110, NULL,
  10, 1,
  '[
    {"item": "salmon", "amount": "5", "unit": "oz"},
    {"item": "romaine lettuce", "amount": "2", "unit": "cups", "folate_mcg": 128},
    {"item": "edamame", "amount": "0.5", "unit": "cup", "potassium_mg": 338, "folate_mcg": 240},
    {"item": "avocado", "amount": "0.5", "unit": "whole", "potassium_mg": 485},
    {"item": "cherry tomatoes", "amount": "0.5", "unit": "cup"},
    {"item": "cucumber", "amount": "0.25", "unit": "cup"},
    {"item": "olive oil", "amount": "2", "unit": "tbsp"},
    {"item": "lemon juice", "amount": "1", "unit": "tbsp"},
    {"item": "pumpkin seeds", "amount": "1", "unit": "tbsp", "magnesium_mg": 48}
  ]'::jsonb,
  '["Use leftover or canned salmon (fresh-cooked for Alexander)", "Arrange romaine in bowl", "Top with salmon, edamame, avocado, tomatoes, cucumber", "Drizzle with olive oil and lemon", "Sprinkle pumpkin seeds"]'::jsonb,
  NULL,
  'Fresh-cooked salmon only - no leftovers or canned'
),
(
  'Turkey & Sweet Potato Box',
  (SELECT id FROM recipe_categories WHERE name = 'lunch'),
  11,
  'Simple lunch box with turkey and roasted sweet potato',
  590, 35, 1280, 145, 0.5, 160, NULL,
  15, 1,
  '[
    {"item": "deli turkey or turkey breast", "amount": "5", "unit": "oz"},
    {"item": "sweet potato", "amount": "1", "unit": "medium", "potassium_mg": 542},
    {"item": "bell pepper", "amount": "1", "unit": "large", "vitamin_c_mg": 150},
    {"item": "avocado", "amount": "0.5", "unit": "whole", "potassium_mg": 485},
    {"item": "hummus", "amount": "2", "unit": "tbsp"},
    {"item": "Simple Mills crackers", "amount": "1", "unit": "serving"}
  ]'::jsonb,
  '["Roast sweet potato cubes at 400°F for 25 min", "Slice bell pepper", "Pack turkey, sweet potato, pepper, avocado, hummus, and crackers"]'::jsonb,
  NULL,
  'Use fresh-sliced turkey, not pre-packaged deli'
),
(
  'Lentil Soup + Sandwich',
  (SELECT id FROM recipe_categories WHERE name = 'lunch'),
  12,
  'Hearty lentil soup with turkey sandwich',
  650, 32, 1450, 380, NULL, 70, NULL,
  30, 2,
  '[
    {"item": "lentils (cooked)", "amount": "1", "unit": "cup", "potassium_mg": 731, "folate_mcg": 358},
    {"item": "spinach", "amount": "1", "unit": "cup"},
    {"item": "bone broth", "amount": "2", "unit": "cups"},
    {"item": "carrots", "amount": "0.5", "unit": "cup"},
    {"item": "celery", "amount": "0.5", "unit": "cup"},
    {"item": "Dave''s Killer Bread", "amount": "2", "unit": "slices"},
    {"item": "turkey", "amount": "3", "unit": "oz"},
    {"item": "avocado", "amount": "0.25", "unit": "whole"},
    {"item": "spinach (for sandwich)", "amount": "0.5", "unit": "cup"},
    {"item": "mustard", "amount": "1", "unit": "tbsp"}
  ]'::jsonb,
  '["Make soup: sauté carrots and celery, add broth and lentils, simmer 20 min", "Stir in spinach at end", "Make sandwich with turkey, avocado, spinach, mustard"]'::jsonb,
  'Use asafoetida instead of onion/garlic in soup',
  NULL
);

-- ============================================
-- DINNER RECIPES (13-22)
-- ============================================

INSERT INTO recipes (
  title, category_id, recipe_number, description,
  calories, protein_g, potassium_mg, folate_mcg, b12_mcg, vitamin_c_mg, magnesium_mg,
  estimated_minutes, servings, ingredients, instructions,
  alex_modifications, alexander_notes
) VALUES
(
  'Salmon Power Plate',
  (SELECT id FROM recipe_categories WHERE name = 'dinner'),
  13,
  'Wild salmon with potato, spinach, and avocado',
  820, 48, 2150, 385, 4.8, 195, NULL,
  45, 4,
  '[
    {"item": "wild salmon", "amount": "6", "unit": "oz", "potassium_mg": 534, "b12_mcg": 4.8},
    {"item": "baked potato", "amount": "1", "unit": "medium", "potassium_mg": 926},
    {"item": "spinach (steamed)", "amount": "1", "unit": "cup", "potassium_mg": 839, "folate_mcg": 263},
    {"item": "avocado", "amount": "0.5", "unit": "whole", "potassium_mg": 485},
    {"item": "bell pepper (roasted)", "amount": "1", "unit": "large", "vitamin_c_mg": 150},
    {"item": "olive oil", "amount": "1", "unit": "tbsp"},
    {"item": "lemon", "amount": "1", "unit": "wedge"}
  ]'::jsonb,
  '["Air fry salmon at 380°F for 10 min", "Bake potato at 400°F for 45 min", "Steam spinach for 3 min", "Roast bell pepper while potato bakes", "Assemble plate with all components"]'::jsonb,
  'Safe - salmon is low sulfur, skip garlic seasoning',
  'Fresh salmon only, not leftover'
),
(
  'Mexican Power Bowl',
  (SELECT id FROM recipe_categories WHERE name = 'dinner'),
  14,
  'Ground beef bowl with beans, rice, and avocado',
  780, 52, 2280, 420, 14.0, 185, NULL,
  30, 4,
  '[
    {"item": "grass-fed ground beef", "amount": "6", "unit": "oz", "b12_mcg": 2.5},
    {"item": "pureed liver", "amount": "2", "unit": "tbsp", "folate_mcg": 200, "b12_mcg": 12},
    {"item": "black beans", "amount": "0.5", "unit": "cup", "potassium_mg": 370, "folate_mcg": 128},
    {"item": "brown rice", "amount": "0.5", "unit": "cup"},
    {"item": "bell pepper", "amount": "1", "unit": "large", "vitamin_c_mg": 150},
    {"item": "avocado", "amount": "1", "unit": "whole", "potassium_mg": 970},
    {"item": "salsa", "amount": "0.25", "unit": "cup"},
    {"item": "romaine lettuce", "amount": "1", "unit": "cup", "folate_mcg": 64},
    {"item": "lime", "amount": "1", "unit": "wedge"}
  ]'::jsonb,
  '["Brown beef with liver mixed in", "Season with taco spices", "Cook rice", "Slice bell pepper", "Layer all in bowl on romaine bed", "Top with salsa and lime"]'::jsonb,
  'Skip liver (sulfur), use homemade taco seasoning (no garlic/onion)',
  NULL
),
(
  'Steak & Loaded Potato',
  (SELECT id FROM recipe_categories WHERE name = 'dinner'),
  15,
  'Ribeye steak with baked potato and asparagus',
  850, 55, 2100, 320, 2.8, 170, NULL,
  50, 4,
  '[
    {"item": "ribeye or NY strip", "amount": "6", "unit": "oz", "b12_mcg": 2.8},
    {"item": "baked potato", "amount": "1", "unit": "large", "potassium_mg": 926},
    {"item": "asparagus", "amount": "1", "unit": "cup", "folate_mcg": 268},
    {"item": "avocado", "amount": "0.5", "unit": "whole", "potassium_mg": 485},
    {"item": "grass-fed butter", "amount": "2", "unit": "tbsp"},
    {"item": "bell pepper (roasted)", "amount": "1", "unit": "large", "vitamin_c_mg": 150}
  ]'::jsonb,
  '["Cast iron sear steak 4 min per side", "Bake potato at 400°F for 45 min", "Roast asparagus and peppers at 400°F for 15 min", "Top potato with butter and chives"]'::jsonb,
  'Use green onion tops only for garnish (white part is high sulfur)',
  NULL
),
(
  'Chicken Fajita Power Plate',
  (SELECT id FROM recipe_categories WHERE name = 'dinner'),
  16,
  'Sheet pan chicken fajitas with potato and black beans',
  760, 48, 2050, 390, NULL, 210, NULL,
  35, 4,
  '[
    {"item": "chicken thighs", "amount": "6", "unit": "oz"},
    {"item": "baked potato", "amount": "1", "unit": "medium", "potassium_mg": 926},
    {"item": "bell peppers", "amount": "1.5", "unit": "large", "vitamin_c_mg": 225},
    {"item": "black beans", "amount": "0.5", "unit": "cup", "potassium_mg": 370, "folate_mcg": 128},
    {"item": "avocado", "amount": "1", "unit": "whole", "potassium_mg": 970},
    {"item": "spinach", "amount": "1", "unit": "cup", "folate_mcg": 263},
    {"item": "corn tortillas", "amount": "2", "unit": "small"},
    {"item": "lime", "amount": "1", "unit": "wedge"},
    {"item": "cilantro", "amount": "2", "unit": "tbsp"}
  ]'::jsonb,
  '["Sheet pan chicken and peppers at 425°F for 25 min", "Cube and roast potato separately", "Warm black beans", "Wilt spinach", "Serve over potatoes with beans, avocado, tortillas"]'::jsonb,
  'Skip onion, use only fajita spices',
  NULL
),
(
  'Korean Beef Power Bowl',
  (SELECT id FROM recipe_categories WHERE name = 'dinner'),
  17,
  'Korean-style ground beef with rice and vegetables',
  790, 50, 1980, 340, 2.5, 165, NULL,
  25, 4,
  '[
    {"item": "ground beef", "amount": "6", "unit": "oz", "b12_mcg": 2.5},
    {"item": "jasmine rice", "amount": "1", "unit": "cup"},
    {"item": "edamame", "amount": "0.5", "unit": "cup", "potassium_mg": 338, "folate_mcg": 240},
    {"item": "avocado", "amount": "1", "unit": "whole", "potassium_mg": 970},
    {"item": "spinach", "amount": "1", "unit": "cup"},
    {"item": "bell pepper", "amount": "1", "unit": "large", "vitamin_c_mg": 150},
    {"item": "cucumber", "amount": "0.5", "unit": "cup"},
    {"item": "sesame seeds", "amount": "1", "unit": "tbsp"},
    {"item": "green onion tops", "amount": "2", "unit": "tbsp"}
  ]'::jsonb,
  '["Cook rice", "Brown beef with sauce (coconut aminos, honey, sesame oil, ginger)", "Slice vegetables", "Assemble bowl with all components", "Top with sesame seeds and green onion"]'::jsonb,
  'No garlic in sauce - use extra ginger',
  NULL
),
(
  'Butter Chicken Power Plate',
  (SELECT id FROM recipe_categories WHERE name = 'dinner'),
  18,
  'Creamy butter chicken with sweet potato',
  810, 52, 1920, 295, NULL, 175, NULL,
  30, 4,
  '[
    {"item": "chicken thighs", "amount": "6", "unit": "oz"},
    {"item": "sweet potato", "amount": "1", "unit": "medium", "potassium_mg": 542},
    {"item": "spinach", "amount": "1", "unit": "cup", "folate_mcg": 263},
    {"item": "coconut cream", "amount": "0.5", "unit": "cup"},
    {"item": "avocado", "amount": "0.5", "unit": "whole", "potassium_mg": 485},
    {"item": "bell pepper", "amount": "1", "unit": "large", "vitamin_c_mg": 150},
    {"item": "basmati rice", "amount": "0.5", "unit": "cup"},
    {"item": "garam masala", "amount": "1", "unit": "tbsp"},
    {"item": "cumin", "amount": "1", "unit": "tsp"},
    {"item": "turmeric", "amount": "0.5", "unit": "tsp"},
    {"item": "tomato paste", "amount": "2", "unit": "tbsp"}
  ]'::jsonb,
  '["Instant Pot: sauté chicken", "Add spices, tomato paste, coconut cream", "Pressure cook 10 min", "Stir in spinach", "Serve over rice with sweet potato and avocado"]'::jsonb,
  'No garlic/onion - use extra ginger and spices',
  NULL
),
(
  'Lentil Bolognese Power Plate',
  (SELECT id FROM recipe_categories WHERE name = 'dinner'),
  19,
  'Beef and lentil bolognese over chickpea pasta',
  770, 45, 2180, 485, 2.5, 180, NULL,
  35, 4,
  '[
    {"item": "ground beef", "amount": "4", "unit": "oz"},
    {"item": "lentils (cooked)", "amount": "1", "unit": "cup", "potassium_mg": 731, "folate_mcg": 358},
    {"item": "marinara sauce", "amount": "1", "unit": "cup"},
    {"item": "spinach", "amount": "1.5", "unit": "cups", "folate_mcg": 263},
    {"item": "Banza chickpea pasta", "amount": "2", "unit": "oz"},
    {"item": "avocado", "amount": "0.5", "unit": "whole", "potassium_mg": 485},
    {"item": "bell pepper (roasted)", "amount": "1", "unit": "large", "vitamin_c_mg": 150}
  ]'::jsonb,
  '["Brown beef", "Add lentils and marinara", "Stir in spinach", "Cook pasta according to package", "Serve sauce over pasta with roasted pepper and avocado"]'::jsonb,
  'Use Rao''s Sensitive marinara (no garlic/onion)',
  'Skip parmesan'
),
(
  'Hawaiian Chicken Power Plate',
  (SELECT id FROM recipe_categories WHERE name = 'dinner'),
  20,
  'Teriyaki chicken with pineapple and rice',
  740, 46, 1890, 310, NULL, 195, NULL,
  30, 4,
  '[
    {"item": "chicken thighs", "amount": "6", "unit": "oz"},
    {"item": "pineapple chunks", "amount": "1", "unit": "cup"},
    {"item": "sweet potato", "amount": "1", "unit": "medium", "potassium_mg": 542},
    {"item": "edamame", "amount": "0.5", "unit": "cup", "potassium_mg": 338, "folate_mcg": 240},
    {"item": "avocado", "amount": "1", "unit": "whole", "potassium_mg": 970},
    {"item": "bell pepper", "amount": "1", "unit": "large", "vitamin_c_mg": 150},
    {"item": "teriyaki sauce (Primal Kitchen)", "amount": "3", "unit": "tbsp"},
    {"item": "jasmine rice", "amount": "0.5", "unit": "cup"}
  ]'::jsonb,
  '["Air fry chicken at 380°F for 15 min", "Add pineapple last 5 min", "Cube and roast sweet potato", "Serve with all components"]'::jsonb,
  NULL,
  NULL
),
(
  'Burger Power Plate',
  (SELECT id FROM recipe_categories WHERE name = 'dinner'),
  21,
  'Grass-fed burger with potato fries',
  830, 54, 2050, 380, 14.0, 165, NULL,
  35, 4,
  '[
    {"item": "grass-fed ground beef", "amount": "6", "unit": "oz"},
    {"item": "pureed liver", "amount": "2", "unit": "tbsp", "folate_mcg": 200, "b12_mcg": 12},
    {"item": "baked potato (as fries)", "amount": "1", "unit": "large", "potassium_mg": 926},
    {"item": "spinach salad", "amount": "1", "unit": "cup", "folate_mcg": 263},
    {"item": "avocado", "amount": "1", "unit": "whole", "potassium_mg": 970},
    {"item": "bell pepper", "amount": "1", "unit": "large", "vitamin_c_mg": 150},
    {"item": "lettuce (for wrap)", "amount": "2", "unit": "leaves"},
    {"item": "pickles", "amount": "4", "unit": "slices"},
    {"item": "mustard", "amount": "1", "unit": "tbsp"},
    {"item": "tomato", "amount": "2", "unit": "slices"}
  ]'::jsonb,
  '["Mix liver into beef before forming patty", "Air fry patty at 375°F for 12 min", "Cut potato into wedges", "Air fry fries at 400°F for 20 min", "Serve in lettuce wrap with all toppings"]'::jsonb,
  'Skip liver (sulfur) - just use plain beef patty',
  NULL
),
(
  'Thai Chicken Stir Fry Power Plate',
  (SELECT id FROM recipe_categories WHERE name = 'dinner'),
  22,
  'Thai-style stir fry with rice noodles',
  750, 47, 1950, 355, NULL, 185, NULL,
  25, 4,
  '[
    {"item": "chicken breast", "amount": "6", "unit": "oz"},
    {"item": "edamame", "amount": "0.5", "unit": "cup", "potassium_mg": 338, "folate_mcg": 240},
    {"item": "bell peppers", "amount": "1.5", "unit": "large", "vitamin_c_mg": 225},
    {"item": "spinach", "amount": "1", "unit": "cup", "folate_mcg": 263},
    {"item": "avocado", "amount": "0.5", "unit": "whole", "potassium_mg": 485},
    {"item": "rice noodles", "amount": "1", "unit": "cup"},
    {"item": "sweet potato", "amount": "1", "unit": "medium", "potassium_mg": 542},
    {"item": "coconut aminos", "amount": "2", "unit": "tbsp"},
    {"item": "lime juice", "amount": "1", "unit": "tbsp"},
    {"item": "fish sauce", "amount": "1", "unit": "tbsp"},
    {"item": "peanut butter", "amount": "1", "unit": "tbsp"},
    {"item": "ginger", "amount": "1", "unit": "tsp"}
  ]'::jsonb,
  '["Slice chicken and stir fry in wok", "Add vegetables", "Make sauce with coconut aminos, lime, fish sauce, peanut butter, ginger", "Toss with noodles", "Serve with cubed sweet potato and avocado"]'::jsonb,
  'No garlic - extra ginger in sauce',
  NULL
);

-- ============================================
-- SNACK RECIPES (23-28)
-- ============================================

INSERT INTO recipes (
  title, category_id, recipe_number, description,
  calories, protein_g, potassium_mg, folate_mcg, b12_mcg, vitamin_c_mg, magnesium_mg,
  estimated_minutes, servings, ingredients, instructions,
  alex_modifications, alexander_notes
) VALUES
(
  'Edamame Power Snack',
  (SELECT id FROM recipe_categories WHERE name = 'snack'),
  23,
  'The most nutrient-dense snack',
  280, 18, 676, 482, NULL, NULL, NULL,
  5, 1,
  '[
    {"item": "edamame", "amount": "1", "unit": "cup", "potassium_mg": 676, "folate_mcg": 482},
    {"item": "sea salt", "amount": "1", "unit": "pinch"}
  ]'::jsonb,
  '["Steam edamame", "Sprinkle with sea salt", "Serve warm or cold"]'::jsonb,
  NULL,
  NULL
),
(
  'Banana Almond Butter Boat',
  (SELECT id FROM recipe_categories WHERE name = 'snack'),
  24,
  'Banana split with nut butter and seeds',
  320, 10, 620, NULL, NULL, NULL, 95,
  5, 1,
  '[
    {"item": "banana", "amount": "1", "unit": "medium", "potassium_mg": 422},
    {"item": "almond butter", "amount": "2", "unit": "tbsp", "magnesium_mg": 97},
    {"item": "pumpkin seeds", "amount": "1", "unit": "tbsp", "magnesium_mg": 48},
    {"item": "honey", "amount": "1", "unit": "tsp"}
  ]'::jsonb,
  '["Split banana lengthwise", "Top with almond butter", "Sprinkle pumpkin seeds", "Drizzle with honey"]'::jsonb,
  NULL,
  NULL
),
(
  'Power Energy Balls',
  (SELECT id FROM recipe_categories WHERE name = 'snack'),
  25,
  'Make-ahead energy balls with chocolate chips',
  280, 12, 380, NULL, NULL, NULL, 85,
  15, 12,
  '[
    {"item": "almond butter", "amount": "1", "unit": "cup"},
    {"item": "oats", "amount": "0.5", "unit": "cup"},
    {"item": "cacao powder", "amount": "2", "unit": "tbsp"},
    {"item": "collagen peptides", "amount": "2", "unit": "tbsp"},
    {"item": "pumpkin seeds", "amount": "2", "unit": "tbsp"},
    {"item": "honey", "amount": "2", "unit": "tbsp"},
    {"item": "chia seeds", "amount": "1", "unit": "tbsp"},
    {"item": "mini dark chocolate chips", "amount": "2", "unit": "tbsp"}
  ]'::jsonb,
  '["Mix all ingredients in a bowl", "Roll into 12 balls", "Refrigerate at least 30 min", "Store in fridge up to 1 week"]'::jsonb,
  NULL,
  'Make fresh weekly'
),
(
  'Avocado Toast Power Snack',
  (SELECT id FROM recipe_categories WHERE name = 'snack'),
  26,
  'Classic avocado toast with bell pepper',
  340, 10, 680, NULL, NULL, 75, NULL,
  5, 1,
  '[
    {"item": "Dave''s Killer Bread", "amount": "1", "unit": "slice"},
    {"item": "avocado", "amount": "0.5", "unit": "whole", "potassium_mg": 485},
    {"item": "bell pepper", "amount": "0.25", "unit": "large", "vitamin_c_mg": 38},
    {"item": "pumpkin seeds", "amount": "1", "unit": "tbsp"},
    {"item": "lime juice", "amount": "1", "unit": "squeeze"}
  ]'::jsonb,
  '["Toast bread", "Mash avocado on toast", "Top with diced bell pepper and pumpkin seeds", "Add salt, pepper, lime squeeze"]'::jsonb,
  NULL,
  NULL
),
(
  'Greek Yogurt Power Parfait',
  (SELECT id FROM recipe_categories WHERE name = 'snack'),
  27,
  'Yogurt parfait with fruit and seeds',
  310, 15, 580, NULL, NULL, NULL, 65,
  5, 1,
  '[
    {"item": "coconut yogurt (or Greek)", "amount": "1", "unit": "cup"},
    {"item": "banana", "amount": "0.5", "unit": "medium", "potassium_mg": 211},
    {"item": "berries", "amount": "0.25", "unit": "cup"},
    {"item": "pumpkin seeds", "amount": "2", "unit": "tbsp", "magnesium_mg": 95},
    {"item": "honey", "amount": "1", "unit": "tbsp"},
    {"item": "chia seeds", "amount": "1", "unit": "tsp"}
  ]'::jsonb,
  '["Layer yogurt in bowl or jar", "Add sliced banana and berries", "Top with pumpkin seeds and chia", "Drizzle with honey"]'::jsonb,
  NULL,
  NULL
),
(
  'Apple + Nut Butter + Seeds',
  (SELECT id FROM recipe_categories WHERE name = 'snack'),
  28,
  'Simple apple snack with protein',
  290, 9, 480, NULL, NULL, NULL, 110,
  5, 1,
  '[
    {"item": "apple", "amount": "1", "unit": "medium", "potassium_mg": 195},
    {"item": "almond butter", "amount": "2", "unit": "tbsp", "magnesium_mg": 97},
    {"item": "pumpkin seeds", "amount": "1", "unit": "tbsp", "magnesium_mg": 48}
  ]'::jsonb,
  '["Slice apple", "Serve with almond butter for dipping", "Sprinkle pumpkin seeds on top"]'::jsonb,
  NULL,
  NULL
);

-- ============================================
-- DRINK RECIPES (29-31)
-- ============================================

INSERT INTO recipes (
  title, category_id, recipe_number, description,
  calories, protein_g, potassium_mg, folate_mcg, b12_mcg, vitamin_c_mg, magnesium_mg,
  estimated_minutes, servings, ingredients, instructions,
  alex_modifications, alexander_notes
) VALUES
(
  'Daily Coconut Water',
  (SELECT id FROM recipe_categories WHERE name = 'drink'),
  29,
  'Pure coconut water for potassium',
  45, 0, 600, NULL, NULL, NULL, NULL,
  1, 1,
  '[
    {"item": "coconut water", "amount": "8", "unit": "oz", "potassium_mg": 600}
  ]'::jsonb,
  '["Serve cold", "Drink 1-2 glasses daily", "Replaces water at one meal"]'::jsonb,
  NULL,
  NULL
),
(
  'Citrus Power Drink',
  (SELECT id FROM recipe_categories WHERE name = 'drink'),
  30,
  'Orange juice spritzer for vitamin C',
  80, 0, 280, NULL, NULL, 95, NULL,
  2, 1,
  '[
    {"item": "fresh orange juice", "amount": "4", "unit": "oz"},
    {"item": "sparkling water", "amount": "4", "unit": "oz"},
    {"item": "lime juice", "amount": "1", "unit": "squeeze"},
    {"item": "ice", "amount": "1", "unit": "cup"}
  ]'::jsonb,
  '["Pour orange juice over ice", "Top with sparkling water", "Add squeeze of lime"]'::jsonb,
  NULL,
  NULL
),
(
  'Berry Vitamin C Lemonade',
  (SELECT id FROM recipe_categories WHERE name = 'drink'),
  31,
  'Homemade lemonade with strawberries',
  90, 0, 320, NULL, NULL, 120, NULL,
  5, 2,
  '[
    {"item": "water", "amount": "2", "unit": "cups"},
    {"item": "lemon juice", "amount": "2", "unit": "lemons"},
    {"item": "strawberries", "amount": "0.5", "unit": "cup"},
    {"item": "honey", "amount": "2", "unit": "tbsp"}
  ]'::jsonb,
  '["Blend strawberries with a little water", "Mix lemon juice, remaining water, and honey", "Combine with strawberry puree", "Serve over ice"]'::jsonb,
  NULL,
  NULL
);

-- ============================================
-- DESSERT RECIPES (32-37)
-- ============================================

INSERT INTO recipes (
  title, category_id, recipe_number, description,
  calories, protein_g, potassium_mg, folate_mcg, b12_mcg, vitamin_c_mg, magnesium_mg,
  estimated_minutes, servings, ingredients, instructions,
  alex_modifications, alexander_notes
) VALUES
(
  'Chocolate Avocado Mousse',
  (SELECT id FROM recipe_categories WHERE name = 'dessert'),
  32,
  'Creamy chocolate mousse with hidden avocado',
  180, 4, 250, NULL, NULL, NULL, 45,
  10, 4,
  '[
    {"item": "avocado", "amount": "1", "unit": "whole", "potassium_mg": 970},
    {"item": "cacao powder", "amount": "3", "unit": "tbsp"},
    {"item": "honey or maple syrup", "amount": "3", "unit": "tbsp"},
    {"item": "coconut cream", "amount": "0.25", "unit": "cup"},
    {"item": "vanilla extract", "amount": "0.5", "unit": "tsp"},
    {"item": "sea salt", "amount": "1", "unit": "pinch"}
  ]'::jsonb,
  '["Blend all ingredients until silky smooth", "Chill for 30 min", "Top with berries or coconut whip"]'::jsonb,
  NULL,
  NULL
),
(
  'Banana Nice Cream',
  (SELECT id FROM recipe_categories WHERE name = 'dessert'),
  33,
  'Healthy ice cream made from frozen bananas',
  280, 7, 520, NULL, NULL, NULL, 65,
  5, 2,
  '[
    {"item": "frozen bananas", "amount": "2", "unit": "medium", "potassium_mg": 844},
    {"item": "almond butter", "amount": "2", "unit": "tbsp"},
    {"item": "cacao powder", "amount": "1", "unit": "tbsp"},
    {"item": "coconut milk", "amount": "1", "unit": "splash"}
  ]'::jsonb,
  '["Blend frozen bananas until creamy (2-3 min)", "Add almond butter and cacao", "Blend again", "Serve immediately or freeze 10 min for firmer texture"]'::jsonb,
  NULL,
  NULL
),
(
  'Strawberry Vitamin C Popsicles',
  (SELECT id FROM recipe_categories WHERE name = 'dessert'),
  34,
  'Fresh strawberry popsicles with coconut',
  85, 1, 95, NULL, NULL, 32, NULL,
  10, 6,
  '[
    {"item": "fresh strawberries", "amount": "2", "unit": "cups", "potassium_mg": 490, "vitamin_c_mg": 180},
    {"item": "coconut milk (full fat)", "amount": "1", "unit": "cup"},
    {"item": "honey", "amount": "2", "unit": "tbsp"},
    {"item": "lemon juice", "amount": "1", "unit": "tbsp"}
  ]'::jsonb,
  '["Blend all ingredients until smooth", "Pour into popsicle molds", "Freeze 4+ hours"]'::jsonb,
  NULL,
  'Make fresh - no histamine buildup'
),
(
  'Nut Butter Fudge Bites',
  (SELECT id FROM recipe_categories WHERE name = 'dessert'),
  35,
  'Freezer fudge bites with almond butter',
  210, 6, 195, NULL, NULL, NULL, 65,
  15, 12,
  '[
    {"item": "almond butter", "amount": "0.5", "unit": "cup"},
    {"item": "coconut oil", "amount": "0.25", "unit": "cup"},
    {"item": "cacao powder", "amount": "3", "unit": "tbsp"},
    {"item": "honey", "amount": "2", "unit": "tbsp"},
    {"item": "dark chocolate chips", "amount": "0.25", "unit": "cup"},
    {"item": "sea salt", "amount": "1", "unit": "pinch"}
  ]'::jsonb,
  '["Mix almond butter, melted coconut oil, cacao, and honey", "Fold in chocolate chips", "Pour into silicone mold or lined pan", "Freeze 1 hour", "Cut into 12 pieces"]'::jsonb,
  NULL,
  NULL
),
(
  'Coconut Chia Pudding',
  (SELECT id FROM recipe_categories WHERE name = 'dessert'),
  36,
  'Creamy chia pudding with toppings',
  290, 8, 240, NULL, NULL, NULL, 95,
  5, 2,
  '[
    {"item": "chia seeds", "amount": "0.25", "unit": "cup"},
    {"item": "coconut milk (full fat)", "amount": "1", "unit": "cup"},
    {"item": "honey or maple syrup", "amount": "1", "unit": "tbsp"},
    {"item": "vanilla extract", "amount": "0.5", "unit": "tsp"},
    {"item": "fresh berries", "amount": "0.25", "unit": "cup"},
    {"item": "pumpkin seeds", "amount": "1", "unit": "tbsp"}
  ]'::jsonb,
  '["Mix chia, coconut milk, honey, vanilla", "Refrigerate overnight (or 2+ hours)", "Stir once after 30 min", "Top with berries and pumpkin seeds before serving"]'::jsonb,
  NULL,
  'Make fresh same-day to avoid histamine'
),
(
  'Frozen Yogurt Bark',
  (SELECT id FROM recipe_categories WHERE name = 'dessert'),
  37,
  'Frozen yogurt with toppings',
  165, 5, 280, NULL, NULL, NULL, 45,
  10, 6,
  '[
    {"item": "coconut yogurt (or Greek)", "amount": "2", "unit": "cups"},
    {"item": "honey", "amount": "2", "unit": "tbsp"},
    {"item": "mixed berries", "amount": "0.5", "unit": "cup"},
    {"item": "dark chocolate chips", "amount": "2", "unit": "tbsp"},
    {"item": "pumpkin seeds", "amount": "2", "unit": "tbsp"},
    {"item": "unsweetened coconut flakes", "amount": "2", "unit": "tbsp"}
  ]'::jsonb,
  '["Spread yogurt on parchment-lined baking sheet", "Drizzle with honey", "Scatter all toppings evenly", "Freeze 2+ hours until solid", "Break into pieces"]'::jsonb,
  NULL,
  NULL
);
