-- Create custom_locations table for admin-managed address suggestions
CREATE TABLE IF NOT EXISTS custom_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE custom_locations ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anyone can search locations)
CREATE POLICY "Allow public read access on custom_locations"
  ON custom_locations FOR SELECT
  USING (true);

-- Allow authenticated users to manage locations (admin)
CREATE POLICY "Allow authenticated insert on custom_locations"
  ON custom_locations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on custom_locations"
  ON custom_locations FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated delete on custom_locations"
  ON custom_locations FOR DELETE
  USING (true);
