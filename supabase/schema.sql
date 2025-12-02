-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Restaurants Table
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    image TEXT NOT NULL,
    logo TEXT,
    rating NUMERIC DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    delivery_time TEXT NOT NULL,
    delivery_fee NUMERIC DEFAULT 0,
    description TEXT,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add new columns if they don't exist
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT 14.967660129277315;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT 120.50763047621417;

-- 2. Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC NOT NULL,
    category TEXT NOT NULL,
    image TEXT,
    popular BOOLEAN DEFAULT false,
    available BOOLEAN DEFAULT true,
    variations JSONB,
    add_ons JSONB,
    discount_price NUMERIC,
    discount_start_date TIMESTAMP WITH TIME ZONE,
    discount_end_date TIMESTAMP WITH TIME ZONE,
    discount_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add restaurant_id if it doesn't exist (for older schemas)
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- 3. Groceries Table
CREATE TABLE IF NOT EXISTS groceries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    unit TEXT NOT NULL,
    available BOOLEAN DEFAULT true,
    popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Padala Bookings Table
CREATE TABLE IF NOT EXISTS padala_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    receiver_name TEXT,
    receiver_contact TEXT,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    item_description TEXT NOT NULL,
    item_weight TEXT,
    item_value NUMERIC,
    special_instructions TEXT,
    preferred_date DATE,
    preferred_time TEXT,
    status TEXT DEFAULT 'pending',
    delivery_fee NUMERIC,
    distance_km NUMERIC,
    payment_method TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Requests Table
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    request_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    address TEXT,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    qr_code_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE groceries ENABLE ROW LEVEL SECURITY;
ALTER TABLE padala_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Helper function to drop policies if they exist (to avoid errors on re-run)
DO $$ 
BEGIN
    -- Restaurants
    DROP POLICY IF EXISTS "Public restaurants are viewable by everyone" ON restaurants;
    DROP POLICY IF EXISTS "Restaurants are insertable by authenticated users" ON restaurants;
    DROP POLICY IF EXISTS "Restaurants are updateable by authenticated users" ON restaurants;
    DROP POLICY IF EXISTS "Restaurants are deletable by authenticated users" ON restaurants;

    -- Menu Items
    DROP POLICY IF EXISTS "Public menu items are viewable by everyone" ON menu_items;
    DROP POLICY IF EXISTS "Menu items are insertable by authenticated users" ON menu_items;
    DROP POLICY IF EXISTS "Menu items are updateable by authenticated users" ON menu_items;
    DROP POLICY IF EXISTS "Menu items are deletable by authenticated users" ON menu_items;

    -- Groceries
    DROP POLICY IF EXISTS "Public groceries are viewable by everyone" ON groceries;
    DROP POLICY IF EXISTS "Groceries are insertable by authenticated users" ON groceries;
    DROP POLICY IF EXISTS "Groceries are updateable by authenticated users" ON groceries;
    DROP POLICY IF EXISTS "Groceries are deletable by authenticated users" ON groceries;

    -- Padala Bookings
    DROP POLICY IF EXISTS "Anyone can create a booking" ON padala_bookings;
    DROP POLICY IF EXISTS "Admins can view all bookings" ON padala_bookings;
    DROP POLICY IF EXISTS "Admins can update bookings" ON padala_bookings;

    -- Requests
    DROP POLICY IF EXISTS "Anyone can create a request" ON requests;
    DROP POLICY IF EXISTS "Admins can view all requests" ON requests;
    DROP POLICY IF EXISTS "Admins can update requests" ON requests;

    -- Site Settings
    DROP POLICY IF EXISTS "Public site settings are viewable by everyone" ON site_settings;
    DROP POLICY IF EXISTS "Site settings are updateable by authenticated users" ON site_settings;

    -- Payment Methods
    DROP POLICY IF EXISTS "Public payment methods are viewable by everyone" ON payment_methods;
    DROP POLICY IF EXISTS "Payment methods are insertable by authenticated users" ON payment_methods;
    DROP POLICY IF EXISTS "Payment methods are updateable by authenticated users" ON payment_methods;
END $$;

-- Re-create Policies

-- Restaurants
CREATE POLICY "Public restaurants are viewable by everyone" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Restaurants are insertable by authenticated users" ON restaurants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Restaurants are updateable by authenticated users" ON restaurants FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Restaurants are deletable by authenticated users" ON restaurants FOR DELETE USING (auth.role() = 'authenticated');

-- Menu Items
CREATE POLICY "Public menu items are viewable by everyone" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Menu items are insertable by authenticated users" ON menu_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Menu items are updateable by authenticated users" ON menu_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Menu items are deletable by authenticated users" ON menu_items FOR DELETE USING (auth.role() = 'authenticated');

-- Groceries
CREATE POLICY "Public groceries are viewable by everyone" ON groceries FOR SELECT USING (true);
CREATE POLICY "Groceries are insertable by authenticated users" ON groceries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Groceries are updateable by authenticated users" ON groceries FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Groceries are deletable by authenticated users" ON groceries FOR DELETE USING (auth.role() = 'authenticated');

-- Padala Bookings
CREATE POLICY "Anyone can create a booking" ON padala_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all bookings" ON padala_bookings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can update bookings" ON padala_bookings FOR UPDATE USING (auth.role() = 'authenticated');

-- Requests
CREATE POLICY "Anyone can create a request" ON requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all requests" ON requests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can update requests" ON requests FOR UPDATE USING (auth.role() = 'authenticated');

-- Site Settings
CREATE POLICY "Public site settings are viewable by everyone" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Site settings are updateable by authenticated users" ON site_settings FOR UPDATE USING (auth.role() = 'authenticated');

-- Payment Methods
CREATE POLICY "Public payment methods are viewable by everyone" ON payment_methods FOR SELECT USING (true);
CREATE POLICY "Payment methods are insertable by authenticated users" ON payment_methods FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Payment methods are updateable by authenticated users" ON payment_methods FOR UPDATE USING (auth.role() = 'authenticated');
