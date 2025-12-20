/*
  # Create Services Tables (Pabili, Padala, Requests)
  
  1. New Tables
    - `groceries` - Grocery items for Pabili service (similar to menu_items)
    - `padala_bookings` - Padala/Angkas booking requests
    - `requests` - General customer requests
  
  2. Security
    - Enable RLS on all tables
    - Public read access for active items
    - Authenticated admin access for all operations
*/

-- ============================================
-- 1. CREATE GROCERIES TABLE (Pabili Service)
-- ============================================

CREATE TABLE IF NOT EXISTS groceries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL,
  category text NOT NULL,
  image_url text,
  unit text NOT NULL DEFAULT 'piece', -- e.g., 'piece', 'kg', 'pack', 'bottle'
  available boolean DEFAULT true,
  popular boolean DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE groceries ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read active groceries"
  ON groceries
  FOR SELECT
  TO public
  USING (available = true);

-- Create policies for authenticated admin access
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

-- Create updated_at trigger
CREATE TRIGGER update_groceries_updated_at
  BEFORE UPDATE ON groceries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. CREATE PADALA BOOKINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS padala_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  contact_number text NOT NULL,
  pickup_address text NOT NULL,
  delivery_address text NOT NULL,
  item_description text NOT NULL,
  item_weight text, -- e.g., "1kg", "2kg", "light", "medium", "heavy"
  item_value decimal(10,2), -- Declared value of item
  special_instructions text,
  preferred_date date,
  preferred_time text, -- e.g., "Morning", "Afternoon", "Evening"
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'
  delivery_fee decimal(10,2),
  distance_km decimal(10,2),
  payment_method text,
  reference_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE padala_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for public insert (customers can create bookings)
CREATE POLICY "Anyone can create padala bookings"
  ON padala_bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can manage padala bookings"
  ON padala_bookings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_padala_bookings_status ON padala_bookings(status);
CREATE INDEX IF NOT EXISTS idx_padala_bookings_created_at ON padala_bookings(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_padala_bookings_updated_at
  BEFORE UPDATE ON padala_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. CREATE REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  contact_number text NOT NULL,
  request_type text NOT NULL, -- e.g., 'custom_order', 'special_request', 'complaint', 'suggestion'
  subject text NOT NULL,
  description text NOT NULL,
  address text, -- Optional, for delivery-related requests
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'resolved', 'cancelled'
  admin_notes text, -- Admin can add notes
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Create policies for public insert (customers can create requests)
CREATE POLICY "Anyone can create requests"
  ON requests
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can manage requests"
  ON requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_type ON requests(request_type);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. INSERT SAMPLE GROCERY CATEGORIES (if categories table exists)
-- ============================================

-- Note: Groceries will use existing categories or create new ones
-- This is handled in the application code

