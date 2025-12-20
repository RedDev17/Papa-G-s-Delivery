# Quick Start Guide - Supabase Setup

## 🚀 Fastest Setup Method

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for it to finish creating

### Step 2: Get Your Credentials
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon public** key

### Step 3: Set Environment Variables
Create `.env` file in project root:
```env
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Run Complete Setup Script
1. Go to **SQL Editor** in Supabase Dashboard
2. Open `supabase/setup-complete.sql`
3. Copy the entire file
4. Paste into SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. Wait for success message ✅

### Step 5: Verify Setup
1. Go to **SQL Editor** again
2. Open `supabase/verify-setup.sql`
3. Copy and run it
4. Check the output - all should show ✅

### Step 6: Test the App
```bash
npm run dev
```

Go to `/admin` and test adding a restaurant and menu items!

---

## 📋 What Gets Created

✅ **7 Database Tables:**
- restaurants
- menu_items
- variations
- add_ons
- categories
- site_settings
- payment_methods

✅ **Storage Bucket:**
- menu-images (for uploading menu item images)

✅ **Security:**
- Row Level Security (RLS) enabled
- Public read access
- Authenticated admin access

✅ **Sample Data:**
- Default categories
- Default site settings

---

## 🆘 Troubleshooting

**"Storage bucket not found"**
→ Run `supabase/setup-complete.sql` again, or manually create bucket in Storage section

**"Missing environment variables"**
→ Check your `.env` file has correct values

**"Policy violation"**
→ Make sure you ran the complete setup script

---

**That's it!** Your Supabase is now ready to use. 🎉

