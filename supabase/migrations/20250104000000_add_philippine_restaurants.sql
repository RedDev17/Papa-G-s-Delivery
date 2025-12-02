/*
  # Add 7 More Philippine Restaurants with 1 Menu Item Each
  
  This migration adds 7 popular Philippine restaurants, each with 1 menu item.
*/

-- Insert 7 new Philippine restaurants
DO $$
DECLARE
  resto1_id uuid;
  resto2_id uuid;
  resto3_id uuid;
  resto4_id uuid;
  resto5_id uuid;
  resto6_id uuid;
  resto7_id uuid;
BEGIN
  -- 1. Max's Restaurant
  INSERT INTO restaurants (name, type, image, logo, rating, review_count, delivery_time, delivery_fee, description, active, sort_order)
  VALUES (
    'Max''s Restaurant',
    'Restaurant',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
    'https://upload.wikimedia.org/wikipedia/en/thumb/8/8a/Max%27s_Restaurant_logo.svg/200px-Max%27s_Restaurant_logo.svg.png',
    4.5,
    850,
    '45-60 mins',
    50.00,
    'Max''s Restaurant is a Filipino restaurant chain known for its signature fried chicken and Filipino comfort food.',
    true,
    9
  )
  RETURNING id INTO resto1_id;

  -- 2. Yellow Cab Pizza
  INSERT INTO restaurants (name, type, image, logo, rating, review_count, delivery_time, delivery_fee, description, active, sort_order)
  VALUES (
    'Yellow Cab Pizza',
    'Restaurant',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop',
    'https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/Yellow_Cab_Pizza_logo.svg/200px-Yellow_Cab_Pizza_logo.svg.png',
    4.3,
    620,
    '30-45 mins',
    40.00,
    'Yellow Cab Pizza is a popular pizza chain in the Philippines known for its New York-style pizzas.',
    true,
    10
  )
  RETURNING id INTO resto2_id;

  -- 3. Pancake House
  INSERT INTO restaurants (name, type, image, logo, rating, review_count, delivery_time, delivery_fee, description, active, sort_order)
  VALUES (
    'Pancake House',
    'Restaurant',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop',
    4.2,
    450,
    '30-45 mins',
    35.00,
    'Pancake House is a Filipino restaurant chain specializing in pancakes, waffles, and all-day breakfast meals.',
    true,
    11
  )
  RETURNING id INTO resto3_id;

  -- 4. Shakey''s Pizza
  INSERT INTO restaurants (name, type, image, logo, rating, review_count, delivery_time, delivery_fee, description, active, sort_order)
  VALUES (
    'Shakey''s Pizza',
    'Restaurant',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop',
    'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Shakey%27s_Pizza_logo.svg/200px-Shakey%27s_Pizza_logo.svg.png',
    4.4,
    780,
    '35-50 mins',
    45.00,
    'Shakey''s Pizza is a popular pizza restaurant chain in the Philippines known for its thin-crust pizzas and mojo potatoes.',
    true,
    12
  )
  RETURNING id INTO resto4_id;

  -- 5. Bonchon Chicken
  INSERT INTO restaurants (name, type, image, logo, rating, review_count, delivery_time, delivery_fee, description, active, sort_order)
  VALUES (
    'Bonchon Chicken',
    'Fast Food',
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200&h=200&fit=crop',
    4.6,
    920,
    '30-45 mins',
    30.00,
    'Bonchon Chicken is a Korean-style fried chicken restaurant chain known for its crispy, double-fried chicken with signature sauces.',
    true,
    13
  )
  RETURNING id INTO resto5_id;

  -- 6. Red Ribbon
  INSERT INTO restaurants (name, type, image, logo, rating, review_count, delivery_time, delivery_fee, description, active, sort_order)
  VALUES (
    'Red Ribbon',
    'Bakery',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=200&fit=crop',
    4.3,
    650,
    '25-40 mins',
    25.00,
    'Red Ribbon is a popular bakery chain in the Philippines known for its cakes, pastries, and Filipino desserts.',
    true,
    14
  )
  RETURNING id INTO resto6_id;

  -- 7. Army Navy
  INSERT INTO restaurants (name, type, image, logo, rating, review_count, delivery_time, delivery_fee, description, active, sort_order)
  VALUES (
    'Army Navy',
    'Fast Food',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&h=200&fit=crop',
    4.5,
    580,
    '30-45 mins',
    35.00,
    'Army Navy is a fast-food chain in the Philippines known for its burgers, burritos, and American-style comfort food.',
    true,
    15
  )
  RETURNING id INTO resto7_id;

  -- Add 1 menu item for each restaurant

  -- Max's Restaurant - Fried Chicken
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id)
  VALUES (
    'Max''s Fried Chicken (2 pcs)',
    'Max''s signature crispy fried chicken - tender, juicy, and perfectly seasoned. Served with rice and atchara.',
    395.00,
    'rice-meals',
    true,
    true,
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=600&fit=crop',
    resto1_id
  );

  -- Yellow Cab Pizza - Classic Pizza
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id)
  VALUES (
    'New York''s Finest Pizza (Large)',
    'Yellow Cab''s signature pizza with pepperoni, Italian sausage, mushrooms, bell peppers, and mozzarella cheese.',
    549.00,
    'spaghetti',
    true,
    true,
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop',
    resto2_id
  );

  -- Pancake House - Pancakes
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id)
  VALUES (
    'Classic Pancakes (3 pcs)',
    'Fluffy buttermilk pancakes served with butter and maple syrup. Perfect for breakfast or any time of day.',
    185.00,
    'breakfast',
    true,
    true,
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
    resto3_id
  );

  -- Shakey's Pizza - Pizza
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id)
  VALUES (
    'Manager''s Choice Pizza (Large)',
    'Shakey''s signature thin-crust pizza with pepperoni, Italian sausage, mushrooms, green peppers, and mozzarella cheese.',
    599.00,
    'spaghetti',
    true,
    true,
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop',
    resto4_id
  );

  -- Bonchon Chicken - Fried Chicken
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id)
  VALUES (
    'Bonchon Chicken (2 pcs)',
    'Korean-style double-fried chicken - crispy on the outside, juicy on the inside. Choose from Soy Garlic or Spicy sauce.',
    285.00,
    'chicken',
    true,
    true,
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=600&fit=crop',
    resto5_id
  );

  -- Red Ribbon - Cake
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id)
  VALUES (
    'Chocolate Mousse Cake (Whole)',
    'Red Ribbon''s signature chocolate mousse cake - rich, creamy, and decadent. Perfect for celebrations.',
    895.00,
    'desserts',
    true,
    true,
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=600&fit=crop',
    resto6_id
  );

  -- Army Navy - Burger
  INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, restaurant_id)
  VALUES (
    'Liberty Burger',
    'Army Navy''s signature burger with 100% beef patty, lettuce, tomato, onion, pickles, and special sauce.',
    195.00,
    'burgers',
    true,
    true,
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
    resto7_id
  );

END $$;

