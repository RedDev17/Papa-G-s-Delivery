/*
  # Verify Supabase Setup
  # Run this script to verify your Supabase setup is correct
*/

-- Check if all tables exist
DO $$
DECLARE
  table_count integer;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('restaurants', 'menu_items', 'variations', 'add_ons', 'categories', 'site_settings', 'payment_methods');
  
  IF table_count = 7 THEN
    RAISE NOTICE '✅ All 7 tables exist';
  ELSE
    RAISE WARNING '❌ Missing tables. Found: % out of 7', table_count;
  END IF;
END $$;

-- Check if storage bucket exists
DO $$
DECLARE
  bucket_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'menu-images'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE '✅ Storage bucket "menu-images" exists';
  ELSE
    RAISE WARNING '❌ Storage bucket "menu-images" NOT found. Please create it.';
  END IF;
END $$;

-- Check RLS policies
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('restaurants', 'menu_items', 'variations', 'add_ons', 'categories', 'site_settings', 'payment_methods');
  
  IF policy_count >= 14 THEN
    RAISE NOTICE '✅ RLS policies configured (% policies found)', policy_count;
  ELSE
    RAISE WARNING '❌ Some RLS policies may be missing. Found: % policies', policy_count;
  END IF;
END $$;

-- Check storage policies
DO $$
DECLARE
  storage_policy_count integer;
BEGIN
  SELECT COUNT(*) INTO storage_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%menu images%';
  
  IF storage_policy_count >= 4 THEN
    RAISE NOTICE '✅ Storage policies configured (% policies found)', storage_policy_count;
  ELSE
    RAISE WARNING '❌ Some storage policies may be missing. Found: % policies', storage_policy_count;
  END IF;
END $$;

-- Check indexes
DO $$
DECLARE
  index_count integer;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
  
  IF index_count >= 5 THEN
    RAISE NOTICE '✅ Indexes created (% indexes found)', index_count;
  ELSE
    RAISE WARNING '⚠️  Some indexes may be missing. Found: % indexes', index_count;
  END IF;
END $$;

-- Check sample data
DO $$
DECLARE
  category_count integer;
  setting_count integer;
BEGIN
  SELECT COUNT(*) INTO category_count FROM categories;
  SELECT COUNT(*) INTO setting_count FROM site_settings;
  
  IF category_count > 0 THEN
    RAISE NOTICE '✅ Categories table has data (% categories)', category_count;
  ELSE
    RAISE WARNING '⚠️  Categories table is empty';
  END IF;
  
  IF setting_count > 0 THEN
    RAISE NOTICE '✅ Site settings table has data (% settings)', setting_count;
  ELSE
    RAISE WARNING '⚠️  Site settings table is empty';
  END IF;
END $$;

-- Final summary
SELECT 
  'Setup Verification Complete' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('restaurants', 'menu_items', 'variations', 'add_ons', 'categories', 'site_settings', 'payment_methods')) as tables_count,
  (SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'menu-images')) as storage_bucket_exists,
  (SELECT COUNT(*) FROM categories) as categories_count,
  (SELECT COUNT(*) FROM site_settings) as settings_count;

