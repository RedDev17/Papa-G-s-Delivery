/*
  # Complete Supabase Setup Script
  # Run this script to set up the entire database and storage for Papa G's Delivery
  
  This script includes:
  1. Database tables (restaurants, menu_items, variations, add_ons, categories, site_settings, payment_methods)
  2. Storage bucket for menu images
  3. All RLS policies
  4. Indexes for performance
  5. Sample data (optional)
  
  Run this in Supabase SQL Editor after creating your project.
*/

-- ============================================
-- 1. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 2. CREATE RESTAURANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('Restaurant', 'Cafe', 'Fast Food', 'Bakery', 'Desserts')),
  image text NOT NULL,
  logo text,
  rating numeric(3,1) DEFAULT 0.0,
  review_count integer DEFAULT 0,
  delivery_time text NOT NULL,
  delivery_fee numeric(10,2) DEFAULT 0,
  description text,
  active boolean DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can manage restaurants" ON restaurants;

-- Create policies
CREATE POLICY "Anyone can read active restaurants"
  ON restaurants
  FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Authenticated users can manage restaurants"
  ON restaurants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON restaurants(active);
CREATE INDEX IF NOT EXISTS idx_restaurants_sort_order ON restaurants(sort_order);

-- Create trigger
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. CREATE CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '☕',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;

-- Create policies
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. CREATE MENU ITEMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  base_price decimal(10,2) NOT NULL,
  category text NOT NULL,
  popular boolean DEFAULT false,
  available boolean DEFAULT true,
  image_url text,
  discount_price decimal(10,2),
  discount_start_date timestamptz,
  discount_end_date timestamptz,
  discount_active boolean DEFAULT false,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint for category
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

-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read menu items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can manage menu items" ON menu_items;

-- Create policies
CREATE POLICY "Anyone can read menu items"
  ON menu_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_discount_active ON menu_items(discount_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_discount_dates ON menu_items(discount_start_date, discount_end_date);

-- Create trigger
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. CREATE VARIATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE variations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read variations" ON variations;
DROP POLICY IF EXISTS "Authenticated users can manage variations" ON variations;

-- Create policies
CREATE POLICY "Anyone can read variations"
  ON variations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage variations"
  ON variations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 6. CREATE ADD_ONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read add-ons" ON add_ons;
DROP POLICY IF EXISTS "Authenticated users can manage add-ons" ON add_ons;

-- Create policies
CREATE POLICY "Anyone can read add-ons"
  ON add_ons
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage add-ons"
  ON add_ons
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 7. CREATE SITE SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS site_settings (
  id text PRIMARY KEY,
  value text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can manage site settings" ON site_settings;

-- Create policies
CREATE POLICY "Anyone can read site settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage site settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default site settings
INSERT INTO site_settings (id, value, type, description) VALUES
  ('site_name', 'Beracah Cafe', 'text', 'The name of the cafe/restaurant'),
  ('site_logo', 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', 'image', 'The logo image URL for the site'),
  ('site_description', 'Welcome to Beracah Cafe - Your perfect coffee destination', 'text', 'Short description of the cafe'),
  ('currency', 'PHP', 'text', 'Currency symbol for prices'),
  ('currency_code', 'PHP', 'text', 'Currency code for payments')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. CREATE PAYMENT METHODS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id text PRIMARY KEY,
  name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  qr_code_url text NOT NULL,
  active boolean DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Authenticated users can manage payment methods" ON payment_methods;

-- Create policies
CREATE POLICY "Anyone can read active payment methods"
  ON payment_methods
  FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Authenticated users can manage payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. CREATE GROCERIES TABLE (Pabili Service)
-- ============================================

CREATE TABLE IF NOT EXISTS groceries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL,
  category text NOT NULL,
  image_url text,
  unit text NOT NULL DEFAULT 'piece', -- e.g., 'piece', 'kg', 'pack', 'bottle', 'box'
  available boolean DEFAULT true,
  popular boolean DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE groceries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active groceries" ON groceries;
DROP POLICY IF EXISTS "Authenticated users can manage groceries" ON groceries;

-- Create policies
CREATE POLICY "Anyone can read active groceries"
  ON groceries
  FOR SELECT
  TO public
  USING (available = true);

CREATE POLICY "Authenticated users can manage groceries"
  ON groceries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_groceries_category ON groceries(category);
CREATE INDEX IF NOT EXISTS idx_groceries_available ON groceries(available);
CREATE INDEX IF NOT EXISTS idx_groceries_sort_order ON groceries(sort_order);

-- Create trigger
DROP TRIGGER IF EXISTS update_groceries_updated_at ON groceries;
CREATE TRIGGER update_groceries_updated_at
  BEFORE UPDATE ON groceries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. CREATE STORAGE BUCKET FOR IMAGES
-- ============================================

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- 11. CREATE STORAGE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access for menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu images" ON storage.objects;

-- Allow public read access to menu images
CREATE POLICY "Public read access for menu images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menu-images');

-- Allow authenticated users to upload menu images
CREATE POLICY "Authenticated users can upload menu images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Allow authenticated users to update menu images
CREATE POLICY "Authenticated users can update menu images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-images');

-- Allow authenticated users to delete menu images
CREATE POLICY "Authenticated users can delete menu images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images');

-- ============================================
-- 12. INSERT SAMPLE CATEGORIES
-- ============================================

INSERT INTO categories (id, name, icon, sort_order, active) VALUES
  ('hot-coffee', 'Hot Coffee', '☕', 1, true),
  ('cold-coffee', 'Cold Coffee', '🧊', 2, true),
  ('dim-sum', 'Dim Sum', '🥟', 3, true),
  ('noodles', 'Noodles', '🍜', 4, true),
  ('rice-dishes', 'Rice Dishes', '🍚', 5, true),
  ('beverages', 'Beverages', '🍵', 6, true),
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

-- ============================================
-- SETUP COMPLETE!
-- ============================================

-- Verify setup
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE '✅ All tables created';
  RAISE NOTICE '✅ All policies configured';
  RAISE NOTICE '✅ Storage bucket created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Set environment variables in .env file';
  RAISE NOTICE '2. Test the application';
  RAISE NOTICE '3. Add restaurants and menu items via admin panel';
END $$;

