/*
  # Add Restaurant Support to Menu Items and Create Jollibee Menu
  
  1. Schema Changes
    - Add restaurant_id column to menu_items table
    - Create index for faster restaurant menu queries
  
  2. Jollibee Menu Data
    - Create Jollibee-specific categories
    - Add comprehensive Jollibee menu items
    - Update Jollibee restaurant information
*/

-- Ensure restaurants table exists first (needed for foreign key)
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

-- Ensure update_updated_at_column function exists (needed for restaurants trigger)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure restaurants trigger exists
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on restaurants if not already enabled
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Create/update policies for restaurants
DROP POLICY IF EXISTS "Anyone can read active restaurants" ON restaurants;
CREATE POLICY "Anyone can read active restaurants"
  ON restaurants
  FOR SELECT
  TO public
  USING (active = true);

DROP POLICY IF EXISTS "Authenticated users can manage restaurants" ON restaurants;
CREATE POLICY "Authenticated users can manage restaurants"
  ON restaurants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for restaurants if they don't exist
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON restaurants(active);
CREATE INDEX IF NOT EXISTS idx_restaurants_sort_order ON restaurants(sort_order);

-- Ensure menu_items table exists first (create if it doesn't)
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure variations table exists
CREATE TABLE IF NOT EXISTS variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Ensure add_ons table exists
CREATE TABLE IF NOT EXISTS add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Function already created above for restaurants

-- Ensure trigger exists for menu_items
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add missing columns to menu_items if they don't exist
DO $$
BEGIN
  -- Add available column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'available'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN available boolean DEFAULT true;
  END IF;

  -- Add discount_price column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'discount_price'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN discount_price decimal(10,2);
  END IF;

  -- Add discount_start_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'discount_start_date'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN discount_start_date timestamptz;
  END IF;

  -- Add discount_end_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'discount_end_date'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN discount_end_date timestamptz;
  END IF;

  -- Add discount_active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'discount_active'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN discount_active boolean DEFAULT false;
  END IF;

  -- Add restaurant_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'restaurant_id'
  ) THEN
    ALTER TABLE menu_items 
    ADD COLUMN restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on tables if not already enabled
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;

-- Create/update policies for menu_items (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can read menu items" ON menu_items;
CREATE POLICY "Anyone can read menu items"
  ON menu_items
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage menu items" ON menu_items;
CREATE POLICY "Authenticated users can manage menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create/update policies for variations
DROP POLICY IF EXISTS "Anyone can read variations" ON variations;
CREATE POLICY "Anyone can read variations"
  ON variations
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage variations" ON variations;
CREATE POLICY "Authenticated users can manage variations"
  ON variations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create/update policies for add_ons
DROP POLICY IF EXISTS "Anyone can read add-ons" ON add_ons;
CREATE POLICY "Anyone can read add-ons"
  ON add_ons
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage add-ons" ON add_ons;
CREATE POLICY "Authenticated users can manage add-ons"
  ON add_ons
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster restaurant menu queries
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);

-- Ensure categories table exists
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '☕',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on categories if not already enabled
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create/update policies for categories
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO public
  USING (active = true);

DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure categories trigger exists
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint if it doesn't exist
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

-- Create categories
INSERT INTO categories (id, name, icon, sort_order, active) VALUES
  ('burgers', 'Burgers', '🍔', 1, true),
  ('chicken', 'Chicken', '🍗', 2, true),
  ('spaghetti', 'Spaghetti & Pasta', '🍝', 3, true),
  ('rice-meals', 'Rice Meals', '🍛', 4, true),
  ('desserts', 'Desserts', '🍰', 5, true),
  ('drinks', 'Drinks', '🥤', 6, true),
  ('breakfast', 'Breakfast', '🥞', 7, true),
  ('sides', 'Sides & Add-ons', '🍟', 8, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- Get Jollibee restaurant ID (create if doesn't exist)
DO $$
DECLARE
  jollibee_id uuid;
BEGIN
  -- Try to get existing Jollibee restaurant
  SELECT id INTO jollibee_id FROM restaurants WHERE name = 'Jollibee' LIMIT 1;
  
  -- If Jollibee doesn't exist, create it
  IF jollibee_id IS NULL THEN
    INSERT INTO restaurants (name, type, image, logo, rating, review_count, delivery_time, delivery_fee, description, active, sort_order)
    VALUES (
      'Jollibee',
      'Fast Food',
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop',
      'https://upload.wikimedia.org/wikipedia/en/thumb/3/3e/Jollibee_Logo.svg/200px-Jollibee_Logo.svg.png',
      4.5,
      1250,
      '30-45 mins',
      25.00,
      'Jollibee is the largest fast food chain in the Philippines, operating a network of more than 1,400 stores. A dominant market leader in the Philippines, Jollibee enjoys the lion''s share of the local market that is more than all the other multinational fastfood brands in PH combined.',
      true,
      1
    )
    RETURNING id INTO jollibee_id;
  ELSE
    -- Update existing Jollibee restaurant with better details
    UPDATE restaurants 
    SET 
      logo = 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3e/Jollibee_Logo.svg/200px-Jollibee_Logo.svg.png',
      rating = 4.5,
      review_count = 1250,
      delivery_time = '30-45 mins',
      delivery_fee = 25.00,
      description = 'Jollibee is the largest fast food chain in the Philippines, operating a network of more than 1,400 stores. A dominant market leader in the Philippines, Jollibee enjoys the lion''s share of the local market that is more than all the other multinational fastfood brands in PH combined.',
      image = 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop'
    WHERE id = jollibee_id;
  END IF;

  -- Insert Jollibee Menu Items
  
  -- BURGERS
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id) VALUES
    ('Yum Burger', 'Jollibee''s classic burger with special dressing, lettuce, and mayonnaise', 65.00, 'burgers', true, true, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop', jollibee_id),
    ('Yum Burger with Cheese', 'Classic Yum Burger topped with a slice of cheese', 75.00, 'burgers', true, true, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop', jollibee_id),
    ('Champ Burger', '100% pure beef patty, special dressing, lettuce, and mayonnaise in a sesame seed bun', 95.00, 'burgers', true, true, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop', jollibee_id),
    ('Champ Burger with Cheese', 'Champ Burger with a slice of cheese', 105.00, 'burgers', true, true, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop', jollibee_id),
    ('Chicken Burger', 'Crispy chicken patty with special dressing, lettuce, and mayonnaise', 85.00, 'burgers', false, true, 'https://images.unsplash.com/photo-1606755962773-d324e7833f15?w=800&h=600&fit=crop', jollibee_id),
    ('Bacon Champ', 'Champ Burger with crispy bacon strips', 115.00, 'burgers', false, true, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop', jollibee_id);

  -- CHICKEN
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id) VALUES
    ('1-Piece Chickenjoy', 'Jollibee''s signature crispy fried chicken - juicy, tender, and perfectly seasoned', 95.00, 'chicken', true, true, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=600&fit=crop', jollibee_id),
    ('2-Piece Chickenjoy', 'Two pieces of crispy fried chicken with rice', 175.00, 'chicken', true, true, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=600&fit=crop', jollibee_id),
    ('6-Piece Chickenjoy Bucket', 'Six pieces of crispy fried chicken - perfect for sharing', 495.00, 'chicken', true, true, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=600&fit=crop', jollibee_id),
    ('8-Piece Chickenjoy Bucket', 'Eight pieces of crispy fried chicken - great for families', 645.00, 'chicken', false, true, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=600&fit=crop', jollibee_id),
    ('Chickenjoy with Spaghetti', '1-Piece Chickenjoy with Jollibee Spaghetti', 145.00, 'chicken', true, true, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=600&fit=crop', jollibee_id),
    ('2-Piece Chickenjoy with Spaghetti', 'Two pieces of Chickenjoy with Jollibee Spaghetti', 205.00, 'chicken', false, true, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=600&fit=crop', jollibee_id);

  -- SPAGHETTI & PASTA
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id) VALUES
    ('Jolly Spaghetti', 'Jollibee''s signature sweet-style spaghetti with sliced hotdogs, ground meat, and cheese', 65.00, 'spaghetti', true, true, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop', jollibee_id),
    ('Jolly Spaghetti (Family Pan)', 'Family-sized Jolly Spaghetti - perfect for sharing', 265.00, 'spaghetti', false, true, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop', jollibee_id),
    ('Jolly Spaghetti with Yum Burger', 'Jolly Spaghetti with one Yum Burger', 115.00, 'spaghetti', true, true, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop', jollibee_id),
    ('Jolly Spaghetti with 1-Piece Chickenjoy', 'Jolly Spaghetti with one piece of Chickenjoy', 145.00, 'spaghetti', true, true, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop', jollibee_id);

  -- RICE MEALS
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id) VALUES
    ('1-Piece Chickenjoy with Rice', 'One piece of crispy Chickenjoy served with steamed rice', 105.00, 'rice-meals', true, true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop', jollibee_id),
    ('2-Piece Chickenjoy with Rice', 'Two pieces of crispy Chickenjoy served with steamed rice', 175.00, 'rice-meals', true, true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop', jollibee_id),
    ('1-Piece Chickenjoy with Rice & Drink', 'One piece of Chickenjoy with rice and your choice of drink', 125.00, 'rice-meals', true, true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop', jollibee_id),
    ('Burger Steak', 'Savory burger patties in rich mushroom gravy served with steamed rice', 75.00, 'rice-meals', true, true, 'https://images.unsplash.com/photo-1606755962773-d324e7833f15?w=800&h=600&fit=crop', jollibee_id),
    ('Burger Steak (2 pieces)', 'Two burger patties in rich mushroom gravy served with steamed rice', 105.00, 'rice-meals', false, true, 'https://images.unsplash.com/photo-1606755962773-d324e7833f15?w=800&h=600&fit=crop', jollibee_id),
    ('Palabok Fiesta', 'Traditional Filipino noodle dish with shrimp sauce, chicharon, and eggs', 95.00, 'rice-meals', true, true, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop', jollibee_id),
    ('Jolly Hotdog', 'Classic hotdog sandwich served with rice', 75.00, 'rice-meals', false, true, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop', jollibee_id);

  -- BREAKFAST
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id) VALUES
    ('Longganisa', 'Filipino-style sweet sausages served with steamed rice and egg', 85.00, 'breakfast', true, true, 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800&h=600&fit=crop', jollibee_id),
    ('Tapa', 'Marinated beef tapa served with steamed rice and egg', 95.00, 'breakfast', true, true, 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800&h=600&fit=crop', jollibee_id),
    ('Corned Beef', 'Savory corned beef served with steamed rice and egg', 85.00, 'breakfast', false, true, 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800&h=600&fit=crop', jollibee_id),
    ('Breakfast Steak', 'Tender breakfast steak served with steamed rice and egg', 95.00, 'breakfast', false, true, 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800&h=600&fit=crop', jollibee_id),
    ('Pancake', 'Fluffy pancakes served with butter and syrup', 65.00, 'breakfast', false, true, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop', jollibee_id);

  -- DESSERTS
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id) VALUES
    ('Peach Mango Pie', 'Crispy pie filled with sweet peach mango filling', 45.00, 'desserts', true, true, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=600&fit=crop', jollibee_id),
    ('Choco Mallow Pie', 'Crispy pie filled with chocolate and marshmallow', 45.00, 'desserts', true, true, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=600&fit=crop', jollibee_id),
    ('Sundae (Chocolate)', 'Creamy vanilla ice cream topped with rich chocolate syrup', 35.00, 'desserts', true, true, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop', jollibee_id),
    ('Sundae (Strawberry)', 'Creamy vanilla ice cream topped with sweet strawberry syrup', 35.00, 'desserts', false, true, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop', jollibee_id),
    ('Halo-Halo', 'Traditional Filipino shaved ice dessert with mixed fruits, leche flan, and ube ice cream', 85.00, 'desserts', true, true, 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=800&h=600&fit=crop', jollibee_id),
    ('Jolly Twirls', 'Soft-serve ice cream in a cone', 25.00, 'desserts', false, true, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop', jollibee_id);

  -- DRINKS
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id) VALUES
    ('Pineapple Juice', 'Refreshing pineapple juice', 45.00, 'drinks', true, true, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop', jollibee_id),
    ('Coke Float', 'Classic Coca-Cola with creamy vanilla ice cream', 55.00, 'drinks', true, true, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=600&fit=crop', jollibee_id),
    ('Pineapple Juice Float', 'Pineapple juice with creamy vanilla ice cream', 55.00, 'drinks', false, true, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=600&fit=crop', jollibee_id),
    ('Coca-Cola (Regular)', 'Classic Coca-Cola soft drink', 35.00, 'drinks', true, true, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=600&fit=crop', jollibee_id),
    ('Sprite (Regular)', 'Refreshing lemon-lime soft drink', 35.00, 'drinks', false, true, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=600&fit=crop', jollibee_id),
    ('Royal (Regular)', 'Refreshing orange soft drink', 35.00, 'drinks', false, true, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=600&fit=crop', jollibee_id),
    ('Iced Tea', 'Refreshing iced tea', 35.00, 'drinks', false, true, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop', jollibee_id),
    ('Hot Coffee', 'Hot brewed coffee', 40.00, 'drinks', false, true, 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=600&fit=crop', jollibee_id);

  -- SIDES & ADD-ONS
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id) VALUES
    ('Jolly Crispy Fries (Regular)', 'Crispy golden French fries', 55.00, 'sides', true, true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop', jollibee_id),
    ('Jolly Crispy Fries (Large)', 'Large serving of crispy golden French fries', 85.00, 'sides', false, true, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop', jollibee_id),
    ('Rice (Regular)', 'Steamed white rice', 25.00, 'sides', true, true, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=600&fit=crop', jollibee_id),
    ('Rice (Large)', 'Large serving of steamed white rice', 35.00, 'sides', false, true, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=600&fit=crop', jollibee_id),
    ('Gravy (Regular)', 'Rich mushroom gravy', 25.00, 'sides', false, true, 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800&h=600&fit=crop', jollibee_id),
    ('Extra Egg', 'Additional fried egg', 15.00, 'sides', false, true, 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800&h=600&fit=crop', jollibee_id);

  -- Add variations for drinks (size options)
  INSERT INTO variations (menu_item_id, name, price)
  SELECT mi.id, 'Regular', 0
  FROM menu_items mi
  WHERE mi.category = 'drinks' 
    AND mi.name IN ('Coca-Cola (Regular)', 'Sprite (Regular)', 'Royal (Regular)', 'Iced Tea', 'Hot Coffee')
    AND mi.restaurant_id = jollibee_id;
  
  INSERT INTO variations (menu_item_id, name, price)
  SELECT mi.id, 'Large', 10
  FROM menu_items mi
  WHERE mi.category = 'drinks' 
    AND mi.name IN ('Coca-Cola (Regular)', 'Sprite (Regular)', 'Royal (Regular)', 'Iced Tea', 'Hot Coffee')
    AND mi.restaurant_id = jollibee_id;

END $$;

