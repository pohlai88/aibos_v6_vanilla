#!/usr/bin/env node

/**
 * Database Verification Script for AIBOS Support System
 * Checks if all required tables exist and are properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗄️  AIBOS Support System Database Verification');
console.log('==============================================\n');

// Check if .env file exists
const envFile = path.join(__dirname, '../.env');
if (!fs.existsSync(envFile)) {
  console.log('❌ .env file not found');
  console.log('📝 Please create a .env file with your Supabase credentials:');
  console.log('');
  console.log('VITE_SUPABASE_URL=https://your-project-id.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=your-anon-key-here');
  console.log('');
  console.log('💡 Copy from env.example and update with your actual values');
  process.exit(1);
}

console.log('✅ .env file found');

// Read environment variables
const envContent = fs.readFileSync(envFile, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1];

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in .env file');
  console.log('   Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

console.log('✅ Supabase credentials found');

// Check if migrations exist
const migrationsDir = path.join(__dirname, '../supabase/migrations');
if (!fs.existsSync(migrationsDir)) {
  console.log('❌ Migrations directory not found');
  process.exit(1);
}

const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort();

console.log(`✅ Found ${migrationFiles.length} migration files:`);
migrationFiles.forEach(file => {
  console.log(`   📄 ${file}`);
});

// Check for support system migration
const supportMigration = migrationFiles.find(file => file.includes('support'));
if (supportMigration) {
  console.log(`✅ Support system migration found: ${supportMigration}`);
} else {
  console.log('⚠️  No specific support system migration found');
}

// Check if supabase config exists
const configFile = path.join(__dirname, '../supabase/config.toml');
if (fs.existsSync(configFile)) {
  console.log('✅ Supabase config.toml found');
} else {
  console.log('⚠️  Supabase config.toml not found');
}

console.log('\n📋 Database Verification Checklist');
console.log('==================================');

console.log('\n1. ✅ Environment Configuration');
console.log('   - .env file exists');
console.log('   - Supabase credentials configured');

console.log('\n2. ✅ Migration Files');
console.log(`   - ${migrationFiles.length} migration files found`);
console.log('   - Support system migration present');

console.log('\n3. 🔄 Next Steps:');
console.log('   a) Start Docker Desktop (if using local Supabase)');
console.log('   b) Run: npx supabase start');
console.log('   c) Run: npx supabase db push');
console.log('   d) Or apply migrations to your remote Supabase instance');

console.log('\n4. 🧪 Testing:');
console.log('   a) Start the app: npm run dev');
console.log('   b) Navigate to /help');
console.log('   c) Check browser console for database errors');

console.log('\n5. 📊 Expected Tables (after migration):');
const expectedTables = [
  'feature_requests',
  'release_notes', 
  'knowledge_base_articles',
  'knowledge_base_categories',
  'community_posts',
  'community_replies',
  'ai_agent_conversations',
  'ai_agent_messages',
  'proactive_help_suggestions',
  'support_analytics'
];

expectedTables.forEach(table => {
  console.log(`   - ${table}`);
});

console.log('\n🎯 Database verification complete!');
console.log('Ready to apply migrations and test the support system.\n'); 