/**
 * Script to run Supabase migration via SQL
 * This script reads the migration file and executes it using Supabase client
 * 
 * Usage: node scripts/run-migration.js
 * 
 * Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in your .env file
 * (Use Service Role Key for admin operations, not the anon key)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials!');
  console.error('Please set the following environment variables:');
  console.error('  - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('  - VITE_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nNote: You need the SERVICE ROLE KEY (not the anon key) for running migrations.');
  console.error('You can find it in your Supabase dashboard: Project Settings > API > service_role key');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('📄 Reading migration file...');
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250103000000_add_restaurant_menu_items.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Executing migration...');
    console.log('This may take a few moments...\n');

    // Split SQL by semicolons and execute each statement
    // Note: Supabase JS client doesn't have a direct SQL execution method
    // So we'll use the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql })
    });

    // Alternative: Use Supabase's REST API to execute SQL
    // Actually, the best way is to use the Supabase Management API
    // But for simplicity, let's try using the client's from().rpc() method
    
    // Since direct SQL execution isn't available in the JS client,
    // we need to use the Management API or REST API
    console.log('⚠️  Direct SQL execution via JS client is limited.');
    console.log('\n✅ Migration file is ready!');
    console.log('\nPlease run this migration using one of these methods:');
    console.log('\n1. Supabase Dashboard (Recommended):');
    console.log('   - Go to your Supabase dashboard');
    console.log('   - Navigate to SQL Editor');
    console.log('   - Copy and paste the SQL from: supabase/migrations/20250103000000_add_restaurant_menu_items.sql');
    console.log('   - Click "Run"');
    
    console.log('\n2. Install Supabase CLI:');
    console.log('   npm install -g supabase');
    console.log('   supabase db push');
    
    console.log('\n3. Use Supabase Management API:');
    console.log('   See: https://supabase.com/docs/reference/api/run-sql');

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    process.exit(1);
  }
}

runMigration();

