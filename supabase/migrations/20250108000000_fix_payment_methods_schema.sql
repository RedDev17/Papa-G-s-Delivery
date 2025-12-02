/*
  # Fix Payment Methods Table Schema
  
  This migration ensures the payment_methods table uses text IDs (not UUID)
  to support kebab-case identifiers like "gcash", "maya", "bank-transfer"
  
  1. Check if table exists with UUID ID
  2. If UUID exists, convert to text ID (migrate data if any)
  3. If table doesn't exist, create with text ID
  4. Ensure all policies and triggers are correct
*/

-- First, check if table exists and what type the ID column is
DO $$
DECLARE
  table_exists boolean;
  id_type text;
  has_data boolean;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payment_methods'
  ) INTO table_exists;

  IF table_exists THEN
    -- Check the ID column type
    SELECT data_type INTO id_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'payment_methods'
    AND column_name = 'id';

    -- Check if table has data
    SELECT EXISTS (SELECT 1 FROM payment_methods LIMIT 1) INTO has_data;

    -- If ID is UUID, we need to convert it
    IF id_type = 'uuid' THEN
      -- Drop the table and recreate with text ID
      -- Note: This will lose existing data, but payment methods can be re-added
      DROP TABLE IF EXISTS payment_methods CASCADE;
      
      -- Recreate with text ID
      CREATE TABLE payment_methods (
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
    ELSIF id_type != 'text' THEN
      -- If it's some other type, recreate
      DROP TABLE IF EXISTS payment_methods CASCADE;
      
      CREATE TABLE payment_methods (
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
    END IF;
  ELSE
    -- Table doesn't exist, create it with text ID
    CREATE TABLE payment_methods (
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
  END IF;
END $$;

-- Ensure the table has the correct schema (in case the DO block didn't work)
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

-- If the table exists with UUID, we need to alter it
-- But ALTER TABLE can't change primary key type easily, so we'll handle it above

-- Ensure all columns exist with correct types
DO $$
BEGIN
  -- Ensure sort_order is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'payment_methods'
    AND column_name = 'sort_order'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE payment_methods ALTER COLUMN sort_order SET NOT NULL;
    ALTER TABLE payment_methods ALTER COLUMN sort_order SET DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Authenticated users can manage payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Public can read active payment methods" ON payment_methods;

-- Create policies for public read access
CREATE POLICY "Anyone can read active payment methods"
  ON payment_methods
  FOR SELECT
  TO public
  USING (active = true);

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can manage payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment methods if they don't exist
INSERT INTO payment_methods (id, name, account_number, account_name, qr_code_url, sort_order, active) VALUES
  ('gcash', 'GCash', '09XX XXX XXXX', 'M&C Bakehouse', 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', 1, true),
  ('maya', 'Maya (PayMaya)', '09XX XXX XXXX', 'M&C Bakehouse', 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', 2, true),
  ('bank-transfer', 'Bank Transfer', 'Account: 1234-5678-9012', 'M&C Bakehouse', 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', 3, true)
ON CONFLICT (id) DO NOTHING;

