#!/usr/bin/env node

/**
 * Quick Database Setup Script for AIBOS Support System
 * Helps users set up their database environment quickly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 AIBOS Support System Database Setup');
console.log('======================================\n');

// Check if .env exists
const envFile = path.join(__dirname, '../.env');
const envExampleFile = path.join(__dirname, '../env.example');

if (!fs.existsSync(envFile)) {
  console.log('📝 Creating .env file...');
  
  if (fs.existsSync(envExampleFile)) {
    fs.copyFileSync(envExampleFile, envFile);
    console.log('✅ .env file created from env.example');
    console.log('⚠️  Please edit .env with your actual Supabase credentials');
  } else {
    // Create basic .env file
    const envContent = `# Supabase Configuration
# Replace with your actual Supabase project credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: For local development with Supabase CLI
# SUPABASE_ACCESS_TOKEN=your-access-token
# SUPABASE_DB_PASSWORD=your-db-password
`;
    fs.writeFileSync(envFile, envContent);
    console.log('✅ .env file created with template');
    console.log('⚠️  Please edit .env with your actual Supabase credentials');
  }
} else {
  console.log('✅ .env file already exists');
}

// Check Docker status
console.log('\n🐳 Checking Docker status...');
try {
  execSync('docker --version', { stdio: 'pipe' });
  console.log('✅ Docker is installed');
  
  try {
    execSync('docker ps', { stdio: 'pipe' });
    console.log('✅ Docker is running');
  } catch (error) {
    console.log('❌ Docker is not running');
    console.log('💡 Please start Docker Desktop and try again');
  }
} catch (error) {
  console.log('❌ Docker is not installed');
  console.log('💡 Please install Docker Desktop from https://docs.docker.com/desktop');
}

// Check Supabase CLI
console.log('\n📦 Checking Supabase CLI...');
try {
  execSync('npx supabase --version', { stdio: 'pipe' });
  console.log('✅ Supabase CLI is available');
} catch (error) {
  console.log('❌ Supabase CLI not found');
  console.log('💡 Installing Supabase CLI...');
  try {
    execSync('npm install -g supabase', { stdio: 'inherit' });
    console.log('✅ Supabase CLI installed');
  } catch (installError) {
    console.log('❌ Failed to install Supabase CLI');
    console.log('💡 Please install manually: npm install -g supabase');
  }
}

// Check migration files
console.log('\n📄 Checking migration files...');
const migrationsDir = path.join(__dirname, '../supabase/migrations');
if (fs.existsSync(migrationsDir)) {
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  console.log(`✅ Found ${migrationFiles.length} migration files`);
  
  const supportMigration = migrationFiles.find(file => file.includes('support'));
  if (supportMigration) {
    console.log(`✅ Support system migration: ${supportMigration}`);
  }
} else {
  console.log('❌ Migrations directory not found');
}

// Provide next steps
console.log('\n📋 Next Steps:');
console.log('==============');

console.log('\n1. 🔧 Configure Environment:');
console.log('   Edit .env file with your Supabase credentials');

console.log('\n2. 🐳 Start Local Supabase (if using local):');
console.log('   npx supabase start');

console.log('\n3. 🗄️  Apply Migrations:');
console.log('   npx supabase db push');

console.log('\n4. ✅ Verify Setup:');
console.log('   node scripts/verify-database.js');

console.log('\n5. 🧪 Test Application:');
console.log('   npm run dev');
console.log('   Navigate to http://localhost:3000/help');

console.log('\n📚 For detailed instructions, see:');
console.log('   docs/DATABASE_SETUP_GUIDE.md');

console.log('\n🎯 Setup script completed!\n'); 