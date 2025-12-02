# Complete Supabase Setup Guide

This guide will help you set up your Supabase project from scratch for the Papa G's Delivery application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js installed (for running migration scripts)

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: Papa G's Delivery (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
4. Click "Create new project"
5. Wait for project to be created (2-3 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")

## Step 3: Set Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Never commit the `.env` file to git! It's already in `.gitignore`.

## Step 4: Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended for Beginners)

1. Go to **SQL Editor** in your Supabase dashboard
2. Run migrations in this order:

   **Migration 1**: `20250101000000_add_discount_pricing_and_site_settings.sql`
   - Creates discount pricing fields and site settings table

   **Migration 2**: `20250102000000_create_restaurants_table.sql`
   - Creates restaurants table with sample data

   **Migration 3**: `20250103000000_add_restaurant_menu_items.sql`
   - Adds restaurant_id to menu_items
   - Creates categories table
   - Creates Jollibee sample data

   **Migration 4**: `20250830082821_peaceful_cliff.sql`
   - Creates storage bucket for images

3. For each migration:
   - Click "New Query"
   - Copy the entire contents of the migration file
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)
   - Verify success message

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

### Option C: Using Migration Scripts

The project includes migration scripts in the `scripts/` folder:

**For Windows (PowerShell):**
```powershell
.\run-migration.ps1
```

**For Node.js:**
```bash
node scripts/run-migration.js
```

**For ES Modules:**
```bash
node scripts/run-migration.mjs
```

## Step 5: Set Up Storage Bucket

The storage bucket is created by migration `20250830082821_peaceful_cliff.sql`, but you can also set it up manually:

### Manual Setup (if migration didn't work):

1. Go to **Storage** in Supabase Dashboard
2. Click "Create a new bucket"
3. Settings:
   - **Name**: `menu-images`
   - **Public bucket**: ✅ Enable (checked)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`
4. Click "Create bucket"

### Set Storage Policies:

Go to **Storage** → **Policies** → `menu-images` and ensure these policies exist:

1. **Public Read Access**:
   ```sql
   CREATE POLICY "Public read access for menu images"
   ON storage.objects
   FOR SELECT
   TO public
   USING (bucket_id = 'menu-images');
   ```

2. **Authenticated Upload**:
   ```sql
   CREATE POLICY "Authenticated users can upload menu images"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'menu-images');
   ```

3. **Authenticated Update**:
   ```sql
   CREATE POLICY "Authenticated users can update menu images"
   ON storage.objects
   FOR UPDATE
   TO authenticated
   USING (bucket_id = 'menu-images');
   ```

4. **Authenticated Delete**:
   ```sql
   CREATE POLICY "Authenticated users can delete menu images"
   ON storage.objects
   FOR DELETE
   TO authenticated
   USING (bucket_id = 'menu-images');
   ```

## Step 6: Verify Setup

### Check Tables

Go to **Table Editor** and verify these tables exist:
- ✅ `restaurants`
- ✅ `menu_items`
- ✅ `variations`
- ✅ `add_ons`
- ✅ `categories`
- ✅ `site_settings`
- ✅ `payment_methods`

### Check Storage

Go to **Storage** and verify:
- ✅ `menu-images` bucket exists
- ✅ Bucket is public
- ✅ Policies are set up

### Check RLS Policies

Go to **Authentication** → **Policies** and verify:
- ✅ All tables have RLS enabled
- ✅ Public read policies exist
- ✅ Authenticated admin policies exist

## Step 7: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the application in your browser

3. Test admin panel:
   - Go to `/admin`
   - Password: `papaCalinanDelivery@Admin!2025`
   - Try adding a restaurant
   - Try adding a menu item with image upload

4. Check browser console for any errors

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Make sure `.env` file exists with correct values:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Issue: "Storage bucket not found"

**Solution**: 
1. Check if `menu-images` bucket exists in Storage
2. Run the storage migration: `20250830082821_peaceful_cliff.sql`
3. Or create it manually (see Step 5)

### Issue: "Policy violation" or "Permission denied"

**Solution**:
1. Check RLS is enabled on all tables
2. Verify policies are created correctly
3. Make sure you're using the `anon` key (not `service_role` key)

### Issue: "Foreign key constraint violation"

**Solution**:
1. Make sure migrations are run in order
2. Check that referenced tables exist (e.g., `categories` before `menu_items`)
3. Verify foreign key relationships in Table Editor

### Issue: "Category does not exist"

**Solution**:
1. Run migration `20250103000000_add_restaurant_menu_items.sql` which creates categories
2. Or manually create categories in the admin panel

## Migration Files Order

Run migrations in this exact order:

1. `20250101000000_add_discount_pricing_and_site_settings.sql`
2. `20250102000000_create_restaurants_table.sql`
3. `20250103000000_add_restaurant_menu_items.sql`
4. `20250830082821_peaceful_cliff.sql` (Storage bucket)
5. Any other migrations (they should be idempotent)

## Quick Setup Script

For a complete automated setup, you can use this SQL script that combines all essential setup:

See `supabase/setup-complete.sql` (created below)

## Next Steps

After setup:
1. ✅ Test adding a restaurant
2. ✅ Test adding menu items with images
3. ✅ Test adding variations and add-ons
4. ✅ Verify images upload correctly
5. ✅ Check that data appears in the frontend

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase Dashboard → Logs for database errors
3. Verify all migrations ran successfully
4. Check that environment variables are set correctly

---

**Last Updated**: 2025-01-03

