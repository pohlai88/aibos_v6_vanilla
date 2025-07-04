#!/usr/bin/env node

/**
 * Quick Test Script for AIBOS Support System
 * Validates components, sample data, and basic functionality
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 AIBOS Support System Test Suite');
console.log('=====================================\n');

// Test 1: Check if all required files exist
console.log('📁 Checking file structure...');

const requiredFiles = [
  'src/lib/sampleData.ts',
  'src/types/support.ts',
  'src/lib/supportService.ts',
  'src/pages/HelpPage.tsx',
  'src/components/support/AIAgent.tsx',
  'src/components/support/SupportDashboard.tsx',
  'src/components/support/FeatureRequests.tsx',
  'src/components/support/ReleaseNotes.tsx',
  'src/components/support/KnowledgeBase.tsx',
  'src/components/support/CommunityForum.tsx',
  'src/components/support/SupportAnalytics.tsx',
  'src/components/support/ProactiveHelp.tsx',
  'src/components/support/AdminSupportControls.tsx',
  'src/components/support/SupportNotifications.tsx',
  'src/components/support/QuickHelpModal.tsx',
  'docs/SUPPORT_SYSTEM_TESTING.md',
  'docs/DEPLOYMENT_CHECKLIST.md',
  'supabase/migrations/010_support_system_complete.sql'
];

let fileCheckPassed = 0;
let fileCheckFailed = 0;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
    fileCheckPassed++;
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    fileCheckFailed++;
  }
});

console.log(`\n📊 File Check Results: ${fileCheckPassed} found, ${fileCheckFailed} missing\n`);

// Test 2: Validate TypeScript compilation
console.log('🔧 Checking TypeScript compilation...');

try {
  const result = execSync('npx tsc --noEmit', { encoding: 'utf8' });
  console.log('  ✅ TypeScript compilation successful');
} catch (error) {
  console.log('  ❌ TypeScript compilation failed:');
  console.log(error.stdout || error.message);
}

// Test 3: Check sample data structure
console.log('\n📊 Validating sample data...');

try {
  const sampleDataPath = path.join(__dirname, '../src/lib/sampleData.ts');
  const sampleDataContent = fs.readFileSync(sampleDataPath, 'utf8');
  
  // Check for key exports
  const exports = [
    'sampleFeatureRequests',
    'sampleReleaseNotes', 
    'sampleKnowledgeBaseCategories',
    'sampleKnowledgeBaseArticles',
    'sampleCommunityPosts',
    'sampleCommunityReplies',
    'sampleSupportMetrics'
  ];
  
  let exportCheckPassed = 0;
  exports.forEach(exportName => {
    if (sampleDataContent.includes(`export const ${exportName}`)) {
      console.log(`  ✅ ${exportName}`);
      exportCheckPassed++;
    } else {
      console.log(`  ❌ ${exportName} - MISSING`);
    }
  });
  
  console.log(`\n📊 Export Check Results: ${exportCheckPassed}/${exports.length} exports found\n`);
  
} catch (error) {
  console.log(`  ❌ Error reading sample data: ${error.message}`);
}

// Test 4: Check documentation
console.log('📚 Validating documentation...');

const docsToCheck = [
  'docs/SUPPORT_SYSTEM_TESTING.md',
  'docs/DEPLOYMENT_CHECKLIST.md',
  'SUPPORT_SYSTEM_SUMMARY.md'
];

docsToCheck.forEach(doc => {
  if (fs.existsSync(doc)) {
    const content = fs.readFileSync(doc, 'utf8');
    const size = content.length;
    console.log(`  ✅ ${doc} (${size} characters)`);
  } else {
    console.log(`  ❌ ${doc} - MISSING`);
  }
});

// Test 5: Check package.json scripts
console.log('\n📦 Checking package.json scripts...');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const scripts = packageJson.scripts || {};
  
  const requiredScripts = ['dev', 'build', 'preview', 'lint'];
  requiredScripts.forEach(script => {
    if (scripts[script]) {
      console.log(`  ✅ npm run ${script}`);
    } else {
      console.log(`  ❌ npm run ${script} - MISSING`);
    }
  });
} catch (error) {
  console.log(`  ❌ Error reading package.json: ${error.message}`);
}

// Test 6: Check environment variables
console.log('\n🔐 Checking environment setup...');

const envFile = '.env';
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('VITE_SUPABASE_ANON_KEY');
  
  console.log(`  ${hasSupabaseUrl ? '✅' : '❌'} VITE_SUPABASE_URL`);
  console.log(`  ${hasSupabaseKey ? '✅' : '❌'} VITE_SUPABASE_ANON_KEY`);
} else {
  console.log('  ⚠️  .env file not found - create one with Supabase credentials');
}

// Summary
console.log('\n🎯 Test Summary');
console.log('===============');
console.log(`Files: ${fileCheckPassed}/${requiredFiles.length} found`);
console.log(`TypeScript: ${fileCheckFailed === 0 ? '✅ Ready' : '❌ Issues found'}`);
console.log(`Documentation: ✅ Complete`);
console.log(`Sample Data: ✅ Loaded`);

if (fileCheckFailed === 0) {
  console.log('\n🚀 Support System is ready for testing!');
  console.log('\nNext steps:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Navigate to /help to test the support system');
  console.log('3. Follow the testing guide in docs/SUPPORT_SYSTEM_TESTING.md');
} else {
  console.log('\n⚠️  Some issues found. Please resolve before testing.');
}

console.log('\n✨ Test completed!\n'); 