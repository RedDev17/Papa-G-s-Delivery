-- Add latitude and longitude columns to restaurants table
-- Default values are set to the current hardcoded DELIVERY_CENTER (Floridablanca, Pampanga)

ALTER TABLE restaurants
ADD COLUMN latitude DOUBLE PRECISION DEFAULT 14.967660129277315,
ADD COLUMN longitude DOUBLE PRECISION DEFAULT 120.50763047621417;
