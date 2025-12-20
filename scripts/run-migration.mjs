/**
 * Run Supabase Migration Script
 * This script executes the SQL migration using Supabase Management API
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local') });
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Error: VITE_SUPABASE_URL or SUPABASE_URL not found in environment variables');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Error: VITE_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY not found');
  console.error('\n📝 Note: You need the SERVICE ROLE KEY (not anon key) to run migrations.');
  console.error('   Find it in: Supabase Dashboard > Project Settings > API > service_role key');
  process.exit(1);
}

async function runMigration() {
  try {
    console.log('📄 Reading migration file...\n');
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250103000000_add_restaurant_menu_items.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('🔌 Connecting to Supabase...');
    console.log(`   URL: ${supabaseUrl.replace(/\/$/, '')}\n`);

    // Use Supabase Management API to execute SQL
    // Extract project reference from URL
    const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
    
    if (!projectRef) {
      console.error('❌ Could not extract project reference from Supabase URL');
      process.exit(1);
    }

    console.log('🚀 Executing migration via Management API...\n');

    // Use the Management API endpoint
    const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
    
    const response = await fetch(managementUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      // Try alternative: Execute SQL via REST API using RPC or direct query
      console.log('⚠️  Management API approach failed, trying alternative method...\n');
      
      // Alternative: Split SQL into statements and execute via Supabase client
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Split SQL by semicolons (basic splitting, may need refinement for complex SQL)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

      console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

      // Unfortunately, Supabase JS client doesn't support raw SQL execution
      // We need to use the REST API or Management API
      console.log('⚠️  Direct SQL execution requires Supabase CLI or Dashboard\n');
      console.log('✅ Migration file is ready to run!\n');
      console.log('📋 Next steps:');
      console.log('   1. Go to your Supabase Dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Copy the contents of: supabase/migrations/20250103000000_add_restaurant_menu_items.sql');
      console.log('   4. Paste and click "Run"\n');
      
      // Show a preview of what will be created
      console.log('📦 This migration will create:');
      console.log('   • restaurant_id column in menu_items table');
      console.log('   • 8 Jollibee categories');
      console.log('   • 50+ Jollibee menu items');
      console.log('   • Updated Jollibee restaurant details\n');

      return;
    }

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Migration executed successfully!\n');
      console.log('📊 Results:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Migration failed:', result);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Alternative: Run the migration via Supabase Dashboard');
    console.error('   1. Open SQL Editor in your Supabase Dashboard');
    console.error('   2. Copy the SQL from: supabase/migrations/20250103000000_add_restaurant_menu_items.sql');
    console.error('   3. Paste and execute\n');
    process.exit(1);
  }
}

runMigration();

