/*
  # Create Restaurants Management System

  1. New Tables
    - `restaurants`
      - `id` (uuid, primary key)
      - `name` (text) - restaurant name
      - `type` (text) - Restaurant, Cafe, Fast Food, Bakery, Desserts
      - `image` (text) - restaurant image URL
      - `logo` (text) - restaurant logo URL (optional)
      - `rating` (numeric) - average rating
      - `review_count` (integer) - number of reviews
      - `delivery_time` (text) - e.g., "30-45 mins", "45-60 mins"
      - `delivery_fee` (numeric) - delivery fee amount
      - `description` (text) - restaurant description
      - `active` (boolean) - whether restaurant is active
      - `sort_order` (integer) - display order
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on restaurants table
    - Add policies for public read access (active restaurants only)
    - Add policies for authenticated admin access

  3. Indexes
    - Index on active for faster filtering
*/

-- Create restaurants table
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

-- Create index on active for faster queries
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON restaurants(active);
CREATE INDEX IF NOT EXISTS idx_restaurants_sort_order ON restaurants(sort_order);

-- Enable RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (active restaurants only)
CREATE POLICY "Anyone can read active restaurants"
  ON restaurants
  FOR SELECT
  TO public
  USING (active = true);

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can manage restaurants"
  ON restaurants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger for restaurants
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial restaurants data (8 restaurants excluding Kapyem Coffee)
INSERT INTO restaurants (id, name, type, image, rating, review_count, delivery_time, delivery_fee, description, active, sort_order) VALUES
  (gen_random_uuid(), 'Chooks-to-Go', 'Fast Food', 'https://images.unsplash.com/photo-1606755962773-d324e7833f15?w=400&h=300&fit=crop', 0.0, 0, '30-45 mins', 0, 'Chooks-to-Go is a popular roasted chicken chain in the Philippines.', true, 1),
  (gen_random_uuid(), 'Chowking', 'Restaurant', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop', 0.0, 0, '45-60 mins', 0, 'Chowking is a popular Filipino-Chinese fast food restaurant chain.', true, 2),
  (gen_random_uuid(), 'Mang Inasal', 'Restaurant', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', 0.0, 0, '45-60 mins', 0, 'Mang Inasal is a popular grilled chicken and barbecue restaurant chain in the Philippines.', true, 3),
  (gen_random_uuid(), 'McDonalds', 'Fast Food', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop', 4.0, 120, '45-60 mins', 0, 'McDonald''s is a global fast food restaurant chain.', true, 4),
  (gen_random_uuid(), 'Jollibee', 'Restaurant', 'https://images.unsplash.com/photo-1625937286074-9ca519d5b9d9?w=400&h=300&fit=crop', 0.0, 0, '30-45 mins', 0, 'Jollibee is a popular fast-food restaurant chain originating from the Philippines and now operating internationally.', true, 5),
  (gen_random_uuid(), 'KFC', 'Fast Food', 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop', 0.0, 0, '30-45 mins', 0, 'KFC is a global fast food restaurant chain specializing in fried chicken.', true, 6),
  (gen_random_uuid(), 'Greenwich', 'Restaurant', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop', 0.0, 0, '30-45 mins', 0, 'Greenwich is a popular pizza and pasta restaurant chain in the Philippines.', true, 7),
  (gen_random_uuid(), 'Goldilocks', 'Bakery', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop', 0.0, 0, '30-45 mins', 0, 'Goldilocks is a popular bakery and restaurant chain in the Philippines.', true, 8)
ON CONFLICT DO NOTHING;

