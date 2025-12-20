/*
  # Remove "jollibee-" prefix from categories
  
  This migration:
  1. Updates category IDs to remove "jollibee-" prefix
  2. Updates all menu_items that reference these categories
  3. Handles foreign key constraints properly
*/

-- First, update all menu_items to use new category IDs
UPDATE menu_items
SET category = CASE
  WHEN category = 'jollibee-burgers' THEN 'burgers'
  WHEN category = 'jollibee-chicken' THEN 'chicken'
  WHEN category = 'jollibee-spaghetti' THEN 'spaghetti'
  WHEN category = 'jollibee-rice-meals' THEN 'rice-meals'
  WHEN category = 'jollibee-desserts' THEN 'desserts'
  WHEN category = 'jollibee-drinks' THEN 'drinks'
  WHEN category = 'jollibee-breakfast' THEN 'breakfast'
  WHEN category = 'jollibee-sides' THEN 'sides'
  ELSE category
END
WHERE category LIKE 'jollibee-%';

-- Drop foreign key constraint temporarily
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_category_fkey;

-- Delete old categories with jollibee- prefix
DELETE FROM categories WHERE id LIKE 'jollibee-%';

-- Insert new categories without prefix
INSERT INTO categories (id, name, icon, sort_order, active) VALUES
  ('burgers', 'Burgers', '🍔', 7, true),
  ('chicken', 'Chicken', '🍗', 8, true),
  ('spaghetti', 'Spaghetti & Pasta', '🍝', 9, true),
  ('rice-meals', 'Rice Meals', '🍛', 10, true),
  ('desserts', 'Desserts', '🍰', 11, true),
  ('drinks', 'Drinks', '🥤', 12, true),
  ('breakfast', 'Breakfast', '🥞', 13, true),
  ('sides', 'Sides & Add-ons', '🍟', 14, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- Re-add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'menu_items_category_fkey'
  ) THEN
    ALTER TABLE menu_items 
    ADD CONSTRAINT menu_items_category_fkey 
    FOREIGN KEY (category) REFERENCES categories(id);
  END IF;
END $$;

