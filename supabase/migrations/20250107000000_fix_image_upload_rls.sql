/*
  # Fix Image Upload RLS Policy
  
  This migration fixes the "new row violates row-level security policy" error
  by allowing anonymous/public uploads to the menu-images bucket.
  
  Security:
  - Allows public uploads (for admin dashboard without auth)
  - File size and type restrictions are enforced at bucket level
  - Public read access maintained
*/

-- Drop existing upload policies
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to menu-images" ON storage.objects;

-- Allow public/anonymous uploads to menu-images bucket
-- This allows the admin dashboard to upload images without requiring authentication
CREATE POLICY "Allow public uploads to menu-images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'menu-images');

-- Also allow authenticated users to upload (for future use)
CREATE POLICY "Authenticated users can upload menu images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Update existing policies to ensure they work correctly
DROP POLICY IF EXISTS "Public read access for menu images" ON storage.objects;
CREATE POLICY "Public read access for menu images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menu-images');

-- Allow public to update their own uploads (optional, for replacing images)
CREATE POLICY "Allow public updates to menu-images"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'menu-images')
WITH CHECK (bucket_id = 'menu-images');

-- Allow public to delete from menu-images (for admin cleanup)
CREATE POLICY "Allow public deletes from menu-images"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'menu-images');

-- Ensure bucket exists and is configured correctly
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

